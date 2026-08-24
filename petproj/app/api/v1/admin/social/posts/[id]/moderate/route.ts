import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { fanOutPostToFollowers, removePostFromCaches } from "@/lib/redis";

export const dynamic = "force-dynamic";

const VALID_STATES = ['none', 'quarantined', 'hidden', 'shadow_hidden', 'redacted'];
// Public content notices a post can carry — shown to every viewer, not just
// admins (see lib/moderationRedaction.ts). Keep this narrow rather than
// accepting arbitrary free text into a field the client renders verbatim.
const VALID_NOTICE_REASONS = ['pet_sale'];

/**
 * PATCH /api/v1/admin/social/posts/:id/moderate
 * Body: { state?: 'none' | 'quarantined' | 'hidden' | 'shadow_hidden' | 'redacted', notice_reason?: 'pet_sale' | null }
 * At least one of `state` / `notice_reason` must be present; each updates
 * independently of the other, so setting one never disturbs the other.
 *
 * `state` — is_hidden / is_shadow_hidden are kept in sync so existing feed
 * queries behave correctly:
 *   hidden        -> is_hidden = true (dropped everywhere, author included)
 *   shadow_hidden -> is_shadow_hidden = true (dropped for everyone EXCEPT the
 *                    author, whose feed/profile look completely unchanged —
 *                    they are never told, and the flag is redacted out of
 *                    every client response; see lib/moderationRedaction.ts)
 *   quarantined   -> both false (still visible to followers; global/personalized exclude it in Pass 2)
 *   redacted      -> both false — the post stays visible to EVERYONE
 *                    (unlike shadow_hidden), but lib/moderationRedaction.ts
 *                    covers the SEVERE word(s) in `content` with a grey chip
 *                    on read (see lib/moderation/badWords.ts
 *                    redactSevereWords). Use this when the rest of the post
 *                    is fine and only the slur itself needs covering.
 *   none          -> both false
 *
 * `notice_reason` (currently only 'pet_sale', or null to clear) — unlike
 * `state`, this does NOT change the post's visibility at all. It puts a
 * public "flagged: buying or selling pets" banner above the post body that
 * every viewer sees (PostCard's PetSaleNoticeBanner on the client), for
 * content Paltuu wants to visibly flag without hiding it.
 *
 * Set automatically on create/edit/quote by lib/moderation/petSaleDetection.ts;
 * this endpoint is the manual path, for the listings that detector misses
 * (a seller who avoids price and sale language entirely) and for clearing
 * its false positives. Passing both fields in one call is the "confirmed as
 * a sale post" verdict: flag it and take it down in a single action.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const postId = params.id;
    const body = await req.json();
    const state: string | undefined = body.state;
    const hasNoticeReason = Object.prototype.hasOwnProperty.call(body, 'notice_reason');
    const noticeReason: string | null = body.notice_reason ?? null;

    if (state === undefined && !hasNoticeReason) {
      return NextResponse.json({ error: "Provide state and/or notice_reason" }, { status: 400 });
    }
    if (state !== undefined && !VALID_STATES.includes(state)) {
      return NextResponse.json({ error: `state must be one of ${VALID_STATES.join(', ')}` }, { status: 400 });
    }
    if (hasNoticeReason && noticeReason !== null && !VALID_NOTICE_REASONS.includes(noticeReason)) {
      return NextResponse.json({ error: `notice_reason must be one of ${VALID_NOTICE_REASONS.join(', ')}` }, { status: 400 });
    }

    const isHidden = state === 'hidden';
    const isShadowHidden = state === 'shadow_hidden';

    // Read the current flag first: the cache reconciliation below only wants
    // to act on an actual transition, and a subselect in RETURNING would be
    // reading the same row the same statement is writing.
    const before = await db.query(
      `SELECT user_id, created_at, is_shadow_hidden FROM social_posts WHERE post_id = $1`,
      [postId]
    );
    if (before.rowCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const { user_id: authorId, created_at: createdAt, is_shadow_hidden: wasShadowHidden } = before.rows[0];

    const setClauses: string[] = [];
    const values: any[] = [postId];
    if (state !== undefined) {
      setClauses.push(`moderation_state = $${values.length + 1}`, `is_hidden = $${values.length + 2}`, `is_shadow_hidden = $${values.length + 3}`);
      values.push(state, isHidden, isShadowHidden);
    }
    if (hasNoticeReason) {
      setClauses.push(`content_notice_reason = $${values.length + 1}`);
      values.push(noticeReason);
    }

    const updated = await db.query(
      `UPDATE social_posts SET ${setClauses.join(', ')} WHERE post_id = $1 RETURNING post_id`,
      values
    );
    if ((updated.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Follower feed caches are populated by fan-out at post time, so flipping
    // the flag in Postgres alone would leave the post sitting in other users'
    // cached feeds. Pull it out when shadow-hiding, and put it back on
    // restore, so the change takes effect immediately rather than whenever
    // the 24h ZSET TTL happens to expire. Only relevant when `state` changed.
    if (state !== undefined) {
      if (isShadowHidden && !wasShadowHidden) {
        removePostFromCaches(postId, authorId, db).catch(() => {});
      } else if (!isShadowHidden && wasShadowHidden) {
        fanOutPostToFollowers(postId, authorId, createdAt, db).catch(() => {});
      }
    }

    const actionParts = [
      state !== undefined ? `state:${state}` : null,
      hasNoticeReason ? `notice:${noticeReason ?? 'cleared'}` : null,
    ].filter(Boolean).join(',');
    await db.query(
      `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
       VALUES ($1, $2, $3, 'successful')`,
      [adminId, `moderate_post:${actionParts}`, `post:${postId}`]
    );

    return NextResponse.json({
      success: true,
      ...(state !== undefined ? { moderation_state: state } : {}),
      ...(hasNoticeReason ? { content_notice_reason: noticeReason } : {}),
    });
  } catch (error) {
    console.error("Admin moderate-post PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
