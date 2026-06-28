import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/social/posts/:id/reject
 * Body: { reason: string }
 * Hides the post (moderation_state='hidden' + is_hidden=true so all feeds drop it).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const adminId = Number.isNaN(parseInt(String(admin.id), 10)) ? null : parseInt(String(admin.id), 10);

  try {
    const postId = params.id;
    const body = await req.json().catch(() => ({}));
    const reason: string = body.reason || 'unspecified';

    const updated = await db.query(
      `UPDATE social_posts
         SET moderation_state = 'hidden', is_hidden = true
       WHERE post_id = $1
       RETURNING post_id`,
      [postId]
    );
    if ((updated.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await db.query(
      `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
       VALUES ($1, 'reject_post', $2, $3)`,
      [adminId, `post:${postId}`, reason.slice(0, 250)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin reject-post POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
