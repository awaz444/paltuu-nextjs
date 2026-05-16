import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/collections/:id
 * Rename collection
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);
    const collectionId = params.id;

    const body = await req.json();
    const name = body.name?.toString().trim();

    if (!name || name.length === 0) {
      return NextResponse.json({ error: { code: "INVALID_NAME", message: "Name is required", status: 400 } }, { status: 400 });
    }

    // 1. Verify ownership and check if default
    const colRes = await db.query("SELECT is_default FROM save_collections WHERE collection_id = $1 AND user_id = $2", [collectionId, userId]);
    if (colRes.rowCount === 0) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Collection not found", status: 404 } }, { status: 404 });
    }
    if (colRes.rows[0].is_default) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Cannot rename default collection", status: 403 } }, { status: 403 });
    }

    // 2. Update
    const result = await db.query(
      "UPDATE save_collections SET name = $1, updated_at = now() WHERE collection_id = $2 RETURNING *",
      [name, collectionId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Collection PATCH error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/collections/:id
 * Delete collection (posts are NOT unsaved, just removed from this folder)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);
    const collectionId = params.id;

    // 1. Verify ownership and check if default
    const colRes = await db.query("SELECT is_default FROM save_collections WHERE collection_id = $1 AND user_id = $2", [collectionId, userId]);
    if (colRes.rowCount === 0) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Collection not found", status: 404 } }, { status: 404 });
    }
    if (colRes.rows[0].is_default) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Cannot delete default collection", status: 403 } }, { status: 403 });
    }

    // 2. Delete collection (cascades to collection_posts)
    await db.query("DELETE FROM save_collections WHERE collection_id = $1", [collectionId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collection DELETE error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}
