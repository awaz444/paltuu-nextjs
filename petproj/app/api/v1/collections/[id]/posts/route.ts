import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

function encodeCursor(save_id: string | number, added_at: string | Date) {
  const data = JSON.stringify({ id: save_id, added_at: new Date(added_at).toISOString() });
  return Buffer.from(data).toString("base64");
}

function decodeCursor(cursor: string | null) {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    return JSON.parse(decoded) as { id: number; added_at: string };
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/v1/collections/:id/posts
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);
    const collectionId = parseInt(params.id, 10);
    if (isNaN(collectionId)) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid Collection ID", status: 400 } }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(40, parseInt(searchParams.get("limit") || "20", 10));
    const cursor = decodeCursor(searchParams.get("cursor"));

    // 1. Verify collection ownership
    const colRes = await db.query("SELECT name FROM save_collections WHERE collection_id = $1 AND user_id = $2", [collectionId, userId]);
    if (colRes.rowCount === 0) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Collection not found", status: 404 } }, { status: 404 });
    }

    // 2. Fetch posts
    let query = `
      SELECT 
        p.*,
        u.name               AS author_name,
        u.profile_image_url  AS author_image,
        u.social_username,
        sp.save_id,
        cp.added_at,
        COALESCE(
          (SELECT json_agg(m.* ORDER BY m.ordering) 
           FROM social_post_media m 
           WHERE m.post_id = p.post_id), 
          '[]'::json
        ) AS media,
        op.content           AS original_content,
        op.user_id           AS original_user_id,
        ou.name              AS original_author_name,
        ou.social_username   AS original_social_username,
        ou.profile_image_url AS original_author_image,
        COALESCE(
          (SELECT json_agg(opm.* ORDER BY opm.ordering) 
           FROM social_post_media opm 
           WHERE opm.post_id = op.post_id), 
          '[]'::json
        ) AS original_media,
        EXISTS(SELECT 1 FROM social_likes WHERE post_id = p.post_id AND user_id = $2) AS is_liked,
        EXISTS(SELECT 1 FROM social_reposts WHERE post_id = p.post_id AND user_id = $2) AS is_reposted,
        EXISTS(SELECT 1 FROM social_follows WHERE follower_id = $2 AND following_id = p.user_id) AS is_following
      FROM collection_posts cp
      JOIN saved_posts sp ON sp.save_id = cp.save_id
      JOIN social_posts p ON p.post_id = sp.post_id
      JOIN users u ON u.user_id = p.user_id
      LEFT JOIN social_posts op  ON op.post_id = p.original_post_id
      LEFT JOIN users ou         ON ou.user_id = op.user_id
      WHERE cp.collection_id = $1 
        AND p.is_deleted = false
    `;

    const queryParams: any[] = [collectionId, userId];

    if (cursor) {
      query += ` AND (cp.added_at < $3 OR (cp.added_at = $3 AND sp.save_id < $4))`;
      queryParams.push(cursor.added_at, cursor.id);
    }

    query += ` ORDER BY cp.added_at DESC, sp.save_id DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    const result = await db.query(query, queryParams);
    const posts = result.rows.map(row => ({
      ...row,
      is_saved: true
    }));

    const nextCursor = posts.length === limit 
      ? encodeCursor(posts[posts.length - 1].save_id, posts[posts.length - 1].added_at) 
      : null;

    return NextResponse.json({
      collection_name: colRes.rows[0].name,
      posts,
      next_cursor: nextCursor
    });

  } catch (error) {
    console.error("Collection Posts GET error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}

/**
 * POST /api/v1/collections/:id/posts
 * Add an already-saved post to a collection
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);
    const collectionId = parseInt(params.id, 10);
    if (isNaN(collectionId)) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid Collection ID", status: 400 } }, { status: 400 });
    }

    const body = await req.json();
    const postId = body.post_id;

    if (!postId) {
      return NextResponse.json({ error: { code: "MISSING_POST_ID", message: "Post ID is required", status: 400 } }, { status: 400 });
    }

    // 1. Verify collection ownership
    const colRes = await db.query("SELECT collection_id FROM save_collections WHERE collection_id = $1 AND user_id = $2", [collectionId, userId]);
    if (colRes.rowCount === 0) {
      return NextResponse.json({ error: { code: "COLLECTION_NOT_FOUND", message: "Collection not found", status: 404 } }, { status: 404 });
    }

    // 2. Find save_id for this post (must be already saved)
    const saveRes = await db.query("SELECT save_id FROM saved_posts WHERE user_id = $1 AND post_id = $2", [userId, postId]);
    if (saveRes.rowCount === 0) {
      return NextResponse.json({ error: { code: "NOT_SAVED", message: "Post must be saved first", status: 400 } }, { status: 400 });
    }
    const saveId = saveRes.rows[0].save_id;

    // 3. Add to collection
    const result = await db.query(
      "INSERT INTO collection_posts (collection_id, save_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [collectionId, saveId]
    );

    if (result.rowCount !== null && result.rowCount > 0) {
      await db.query("UPDATE save_collections SET post_count = post_count + 1 WHERE collection_id = $1", [collectionId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collection Posts POST error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}
