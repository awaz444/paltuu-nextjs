import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { fanOutPostToFollowers, removePostFromCaches } from "@/lib/redis";

export const dynamic = "force-dynamic";

const VALID_STATES = ['none', 'quarantined', 'hidden', 'shadow_hidden'];

/**
 * PATCH /api/v1/admin/social/posts/:id/moderate
 * Body: { state: 'none' | 'quarantined' | 'hidden' | 'shadow_hidden' }
 *
 * is_hidden / is_shadow_hidden are kept in sync so existing feed queries
 * behave correctly:
 *   hidden        -> is_hidden = true (dropped everywhere, author included)
 *   shadow_hidden -> is_shadow_hidden = true (dropped for everyone EXCEPT the
 *                    author, whose feed/profile look completely unchanged —
 *                    they are never told, and the flag is redacted out of
 *                    every client response; see lib/moderationRedaction.ts)
 *   quarantined   -> both false (still visible to followers; global/personalized exclude it in Pass 2)
 *   none          -> both false
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const postId = params.id;
    const body = await req.json();
    const state: string = body.state;

    if (!VALID_STATES.includes(state)) {
      return NextResponse.json({ error: `state must be one of ${VALID_STATES.join(', ')}` }, { status: 400 });
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

    const updated = await db.query(
      `UPDATE social_posts
         SET moderation_state = $2, is_hidden = $3, is_shadow_hidden = $4
       WHERE post_id = $1
       RETURNING post_id`,
      [postId, state, isHidden, isShadowHidden]
    );
    if ((updated.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Follower feed caches are populated by fan-out at post time, so flipping
    // the flag in Postgres alone would leave the post sitting in other users'
    // cached feeds. Pull it out when shadow-hiding, and put it back on
    // restore, so the change takes effect immediately rather than whenever
    // the 24h ZSET TTL happens to expire.
    if (isShadowHidden && !wasShadowHidden) {
      removePostFromCaches(postId, authorId, db).catch(() => {});
    } else if (!isShadowHidden && wasShadowHidden) {
      fanOutPostToFollowers(postId, authorId, createdAt, db).catch(() => {});
    }

    await db.query(
      `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
       VALUES ($1, $2, $3, 'successful')`,
      [adminId, `moderate_post:${state}`, `post:${postId}`]
    );

    return NextResponse.json({ success: true, moderation_state: state });
  } catch (error) {
    console.error("Admin moderate-post PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
