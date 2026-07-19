import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/posts/:id/hide
 * Hide a post from this user's own feed only.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);

    const postCheck = await db.query("SELECT post_id FROM social_posts WHERE post_id = $1 AND is_deleted = false", [params.id]);
    if (postCheck.rowCount === 0) {
      return NextResponse.json({ error: { code: "POST_NOT_FOUND", message: "Post does not exist", status: 404 } }, { status: 404 });
    }

    await db.query(
      "INSERT INTO hidden_posts (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING",
      [userId, params.id]
    );

    return NextResponse.json({ hidden: true });
  } catch (error) {
    console.error("Hide Post POST error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/posts/:id/hide
 * Undo hiding a post.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);

    await db.query("DELETE FROM hidden_posts WHERE user_id = $1 AND post_id = $2", [userId, params.id]);

    return NextResponse.json({ hidden: false });
  } catch (error) {
    console.error("Hide Post DELETE error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}
