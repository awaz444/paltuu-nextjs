import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/collections/:id/posts/:post_id
 * Remove a post from a specific collection
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string; post_id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);
    const collectionId = params.id;
    const postId = params.post_id;

    // 1. Verify collection ownership
    const colRes = await db.query("SELECT is_default FROM save_collections WHERE collection_id = $1 AND user_id = $2", [collectionId, userId]);
    if (colRes.rowCount === 0) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Collection not found", status: 404 } }, { status: 404 });
    }
    
    // Cannot remove from default collection via this endpoint if it's meant to be "All Posts"
    // Actually, "All Posts" contains EVERYTHING saved. If you remove it from "All Posts", you are unsaving it.
    // The user should use DELETE /api/v1/posts/:id/save for that.
    if (colRes.rows[0].is_default) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "To remove from All Posts, use the unsave endpoint", status: 403 } }, { status: 403 });
    }

    // 2. Find save_id
    const saveRes = await db.query("SELECT save_id FROM saved_posts WHERE user_id = $1 AND post_id = $2", [userId, postId]);
    if (saveRes.rowCount === 0) {
      return NextResponse.json({ success: true }); // Already not there
    }
    const saveId = saveRes.rows[0].save_id;

    // 3. Remove from collection
    const result = await db.query(
      "DELETE FROM collection_posts WHERE collection_id = $1 AND save_id = $2",
      [collectionId, saveId]
    );

    if (result.rowCount > 0) {
      await db.query("UPDATE save_collections SET post_count = GREATEST(0, post_count - 1) WHERE collection_id = $1", [collectionId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collection Post Remove DELETE error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}
