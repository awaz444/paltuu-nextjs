import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * Helper to encode cursor: base64(JSON.stringify({ score, id }))
 */
function encodeCursor(score: number, id: number) {
    const data = JSON.stringify({ score, id });
    return Buffer.from(data).toString("base64");
}

/**
 * Helper to decode cursor
 */
function decodeCursor(cursor: string | null) {
    if (!cursor) return null;
    try {
        const decoded = Buffer.from(cursor, "base64").toString("utf8");
        return JSON.parse(decoded) as { score: number; id: number };
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
 * GET /api/v1/explore/feed
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);
        const userId = parseInt(String(userIdRaw), 10);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(40, parseInt(searchParams.get("limit") || "20", 10));
        const cursorStr = searchParams.get("cursor");
        const cursor = decodeCursor(cursorStr);

        // Ranking score formula: (likes * 2) + (comments * 3) + max(0, 10 - hours_since_posted)
        // SQL: ((p.like_count * 2) + (p.comment_count * 3) + GREATEST(0, 10 - EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600))
        
        let query = `
            SELECT
                p.post_id, p.content, p.like_count, p.comment_count, p.created_at,
                u.name AS author_name, u.profile_image_url AS author_image, u.user_id AS author_id,
                false AS is_blocked_by_me, false AS is_blocking_me,
                COALESCE((SELECT json_agg(m.* ORDER BY m.ordering) FROM social_post_media m WHERE m.post_id = p.post_id), '[]'::json) AS media,
                ((p.like_count * 2) + (p.comment_count * 3) + GREATEST(0, 10 - EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600)) AS rank_score
            FROM social_posts p
            JOIN users u ON u.user_id = p.user_id
            WHERE p.is_deleted = false
              AND p.is_hidden = false
              AND p.user_id != $1
              AND u.is_private = false -- Rule: No private posts in explore
              AND p.user_id NOT IN (SELECT following_id FROM social_follows WHERE follower_id = $1) -- Rule: Exclude followed
              AND p.created_at >= NOW() - INTERVAL '30 days'
              AND NOT EXISTS (
                  SELECT 1 FROM user_blocks b 
                  WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                     OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
              )
        `;
        const params: any[] = [userId, limit + 1];

        if (cursor) {
            query += ` AND ((p.like_count * 2) + (p.comment_count * 3) + GREATEST(0, 10 - EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600), p.post_id) < ($3, $4)`;
            params.push(cursor.score, cursor.id);
        }

        query += ` ORDER BY rank_score DESC, p.post_id DESC LIMIT $2`;

        const result = await db.query(query, params);
        
        const hasMore = result.rows.length > limit;
        const posts = hasMore ? result.rows.slice(0, limit) : result.rows;
        
        let nextCursor = null;
        if (hasMore) {
            const lastItem = posts[posts.length - 1];
            nextCursor = encodeCursor(lastItem.rank_score, lastItem.post_id);
        }

        return NextResponse.json({
            posts,
            next_cursor: nextCursor
        });

    } catch (error) {
        console.error("V1 Explore Feed error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
