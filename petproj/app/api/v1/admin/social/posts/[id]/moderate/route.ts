import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

const VALID_STATES = ['none', 'quarantined', 'hidden'];

/**
 * PATCH /api/v1/admin/social/posts/:id/moderate
 * Body: { state: 'none' | 'quarantined' | 'hidden' }
 *
 * is_hidden is kept in sync so existing feed queries behave correctly:
 *   hidden      -> is_hidden = true (dropped everywhere)
 *   quarantined -> is_hidden = false (still visible to followers; global/personalized exclude it in Pass 2)
 *   none        -> is_hidden = false
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
    const updated = await db.query(
      `UPDATE social_posts
         SET moderation_state = $2, is_hidden = $3
       WHERE post_id = $1
       RETURNING post_id`,
      [postId, state, isHidden]
    );
    if ((updated.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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
