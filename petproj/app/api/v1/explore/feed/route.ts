import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/explore/feed
 * Discovery feed for the Explore screen.
 *
 * Logic:
 *  - Exclude followed accounts & self.
 *  - Last 30 days only.
 *  - Ranking: (likes * 2) + (comments * 3) + recency_bonus.
 *  - recency_bonus = max(0, 10 - hours_since_posted).
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(40, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = searchParams.get("cursor"); // Use created_at or rank score for cursor

        // Ranking score calculation in SQL
        // recency_bonus: GREATEST(0, 10 - EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600)
        const result = await db.query(`
            SELECT
                p.post_id,
                p.content,
                p.like_count,
                p.comment_count,
                p.created_at,
                u.name              AS author_name,
                u.profile_image_url AS author_image,
                u.user_id           AS author_id,
                COALESCE(
                    (SELECT json_agg(m.* ORDER BY m.ordering)
                     FROM social_post_media m WHERE m.post_id = p.post_id),
                    '[]'::json
                ) AS media,
                (
                    (p.like_count * 2) +
                    (p.comment_count * 3) +
                    GREATEST(0, 10 - EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600)
                ) AS rank_score
            FROM social_posts p
            JOIN users u ON u.user_id = p.user_id
            WHERE p.is_deleted = false
              AND p.is_hidden = false
              AND p.user_id != $1
              AND p.user_id NOT IN (SELECT following_id FROM social_follows WHERE follower_id = $1)
              AND p.created_at >= NOW() - INTERVAL '30 days'
            ORDER BY rank_score DESC, p.created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, cursor ? parseInt(cursor, 10) : 0]);

        const nextCursor = result.rows.length === limit
            ? String((cursor ? parseInt(cursor, 10) : 0) + limit)
            : null;

        return NextResponse.json({
            posts: result.rows,
            next_cursor: nextCursor
        });

    } catch (error) {
        console.error("V1 Explore Feed error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
