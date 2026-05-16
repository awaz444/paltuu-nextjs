import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

function encodeCursor(save_id: string | number, created_at: string | Date) {
  const data = JSON.stringify({ id: save_id, created_at: new Date(created_at).toISOString() });
  return Buffer.from(data).toString("base64");
}

function decodeCursor(cursor: string | null) {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    return JSON.parse(decoded) as { id: number; created_at: string };
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/v1/users/me/saved
 */
export async function GET(req: NextRequest) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(40, parseInt(searchParams.get("limit") || "20", 10));
    const cursor = decodeCursor(searchParams.get("cursor"));

    let query = `
      SELECT 
        p.post_id,
        p.content,
        p.like_count,
        p.comment_count,
        u.name as author_name,
        u.user_id as author_id,
        u.social_username,
        u.profile_image_url as author_image,
        sp.save_id,
        sp.created_at as saved_at,
        p.created_at as created_at,
        COALESCE(
          (SELECT json_agg(m.* ORDER BY m.ordering) 
           FROM social_post_media m 
           WHERE m.post_id = p.post_id), 
          '[]'::json
        ) AS media,
        ARRAY(
          SELECT sc.collection_id 
          FROM collection_posts cp
          JOIN save_collections sc ON sc.collection_id = cp.collection_id
          WHERE cp.save_id = sp.save_id
        ) as saved_to_collections
      FROM saved_posts sp
      JOIN social_posts p ON p.post_id = sp.post_id
      JOIN users u ON u.user_id = p.user_id
      WHERE sp.user_id = $1 
        AND p.is_deleted = false
    `;

    const params: any[] = [userId];

    if (cursor) {
      query += ` AND (sp.created_at < $2 OR (sp.created_at = $2 AND sp.save_id < $3))`;
      params.push(cursor.created_at, cursor.id);
    }

    query += ` ORDER BY sp.created_at DESC, sp.save_id DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    const posts = result.rows.map(row => ({
      ...row,
      is_saved: true
    }));

    const nextCursor = posts.length === limit 
      ? encodeCursor(posts[posts.length - 1].save_id, posts[posts.length - 1].saved_at) 
      : null;

    return NextResponse.json({
      posts,
      next_cursor: nextCursor
    });

  } catch (error) {
    console.error("Get Saved Posts error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error", status: 500 } }, { status: 500 });
  }
}
