import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/collections
 * Get all my collections
 */
export async function GET(req: NextRequest) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);

    const result = await db.query(`
      SELECT collection_id, name, is_default, post_count, cover_image_url, created_at
      FROM save_collections
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `, [userId]);

    return NextResponse.json({ collections: result.rows });
  } catch (error) {
    console.error("Collections GET error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}

/**
 * POST /api/v1/collections
 * Create a new collection
 */
export async function POST(req: NextRequest) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);

    const body = await req.json();
    const name = body.name?.toString().trim();

    if (!name || name.length === 0) {
      return NextResponse.json({ error: { code: "INVALID_NAME", message: "Name is required", status: 400 } }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: { code: "INVALID_NAME", message: "Name too long", status: 400 } }, { status: 400 });
    }

    // Check limit (max 100)
    const countRes = await db.query("SELECT COUNT(*) as count FROM save_collections WHERE user_id = $1", [userId]);
    if (parseInt(countRes.rows[0].count) >= 100) {
      return NextResponse.json({ error: { code: "LIMIT_REACHED", message: "Maximum 100 collections allowed", status: 400 } }, { status: 400 });
    }

    // Check unique name
    const existing = await db.query("SELECT collection_id FROM save_collections WHERE user_id = $1 AND LOWER(name) = LOWER($2)", [userId, name]);
    if (existing.rowCount > 0) {
      return NextResponse.json({ error: { code: "NAME_TAKEN", message: "You already have a collection with this name", status: 409 } }, { status: 409 });
    }

    const result = await db.query(
      "INSERT INTO save_collections (user_id, name) VALUES ($1, $2) RETURNING *",
      [userId, name]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Collections POST error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}
