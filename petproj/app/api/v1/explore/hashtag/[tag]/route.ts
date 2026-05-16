import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * Helper to encode cursor: base64(JSON.stringify({ id, created_at }))
 */
function encodeCursor(id: number | string, createdAt: Date | string | null) {
    if (!id || !createdAt) return null;
    const data = JSON.stringify({ id, created_at: createdAt });
    return Buffer.from(data).toString("base64");
}

/**
 * Helper to decode cursor
 */
function decodeCursor(cursor: string | null) {
    if (!cursor) return null;
    try {
        const decoded = Buffer.from(cursor, "base64").toString("utf8");
        return JSON.parse(decoded) as { id: number | string; created_at: string };
    } catch (e) {
        return null;
    }
}

/**
 * Standard Error Envelope
 */
function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json(
        {
            error: {
                code,
                message,
                status,
            },
        },
        { status }
    );
}

/**
 * GET /api/v1/explore/hashtag/[tag]
 * Returns all posts tagged with a specific hashtag.
 */
export async function GET(req: NextRequest, { params }: { params: { tag: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);

        const tag = params.tag.toLowerCase().replace(/^#/, "");
        const { searchParams } = new URL(req.url);
        const limit = Math.min(40, parseInt(searchParams.get("limit") || "20", 10));
        const cursorStr = searchParams.get("cursor");
        const cursor = decodeCursor(cursorStr);

        // Fetch hashtag info
        const hashtagRes = await db.query(
            "SELECT tag, post_count FROM hashtags WHERE tag = $1",
            [tag]
        );

        if (hashtagRes.rowCount === 0) {
            return errorResponse("NOT_FOUND", "Hashtag not found", 404);
        }

        // Fetch posts for this hashtag
        let query = `
            SELECT
                p.post_id, p.content, p.like_count, p.comment_count, p.created_at,
                u.name AS author_name, u.profile_image_url AS author_image, u.user_id AS author_id,
                COALESCE((SELECT json_agg(m.* ORDER BY m.ordering) FROM social_post_media m WHERE m.post_id = p.post_id), '[]'::json) AS media
            FROM social_posts p
            JOIN users u ON u.user_id = p.user_id
            JOIN post_hashtags ph ON ph.post_id = p.post_id
            JOIN hashtags h ON h.hashtag_id = ph.hashtag_id
            WHERE h.tag = $1
              AND p.is_deleted = false
              AND p.is_hidden = false
        `;
        const queryParams: any[] = [tag, limit + 1];

        if (cursor) {
            query += ` AND (p.created_at, p.post_id) < ($3, $4)`;
            queryParams.push(cursor.created_at, cursor.id);
        }

        query += ` ORDER BY p.created_at DESC, p.post_id DESC LIMIT $2`;

        const postsRes = await db.query(query, queryParams);
        
        const hasMore = postsRes.rows.length > limit;
        const posts = hasMore ? postsRes.rows.slice(0, limit) : postsRes.rows;
        
        let nextCursor = null;
        if (hasMore) {
            const lastItem = posts[posts.length - 1];
            nextCursor = encodeCursor(lastItem.post_id, lastItem.created_at);
        }

        return NextResponse.json({
            tag: hashtagRes.rows[0].tag,
            post_count: hashtagRes.rows[0].post_count,
            posts: posts,
            next_cursor: nextCursor
        });

    } catch (error) {
        console.error("V1 Hashtag Feed error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
