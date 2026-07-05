import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

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
 * GET /api/v1/explore/discovery
 * Returns idle-state data for the explore screen
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);
        const userId = parseInt(String(userIdRaw), 10);

        const [hashtagsRes, mediaPostsRes, breedsRes] = await Promise.all([
            // Trending hashtags — ranked by activity in the last 7 days, falling back
            // to all-time post_count when there's no recent activity yet
            db.query(`
                SELECT
                    h.tag,
                    h.post_count,
                    COUNT(ph.post_id) FILTER (WHERE ph.created_at >= NOW() - INTERVAL '7 days') AS recent_count
                FROM hashtags h
                LEFT JOIN post_hashtags ph ON ph.hashtag_id = h.hashtag_id
                WHERE h.post_count > 0
                GROUP BY h.hashtag_id, h.tag, h.post_count
                ORDER BY recent_count DESC, h.post_count DESC
                LIMIT 15
            `),

            // Media grid — trending posts (last 7 days, ranked by engagement) first,
            // then older posts with media to fill the grid, newest first; excludes blocked users
            db.query(`
                WITH candidate_posts AS (
                    SELECT
                        p.post_id, p.content, p.like_count, p.comment_count, p.created_at,
                        u.user_id, u.name AS author_name,
                        u.social_username, u.profile_image_url AS author_image,
                        (p.created_at >= NOW() - INTERVAL '7 days') AS is_trending,
                        ((p.like_count * 2) + (p.comment_count * 3)) AS rank_score
                    FROM social_posts p
                    JOIN users u ON u.user_id = p.user_id
                    WHERE p.is_deleted = false
                      AND p.is_hidden = false
                      AND u.is_private = false
                      AND EXISTS (SELECT 1 FROM social_post_media m WHERE m.post_id = p.post_id)
                      AND NOT EXISTS (
                          SELECT 1 FROM user_blocks b
                          WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                             OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                      )
                )
                SELECT
                    cp.post_id, cp.content, cp.like_count, cp.comment_count, cp.created_at,
                    cp.user_id, cp.author_name, cp.social_username, cp.author_image,
                    (SELECT json_agg(m.* ORDER BY m.ordering) FROM social_post_media m WHERE m.post_id = cp.post_id) AS media
                FROM candidate_posts cp
                ORDER BY cp.is_trending DESC, cp.rank_score DESC, cp.created_at DESC, cp.post_id DESC
                LIMIT 30
            `, [userId]),

            // Trending breeds — derived from pets + adoption_listings
            db.query(`
                SELECT breed,
                       COUNT(*) FILTER (WHERE source='pet') AS pet_count,
                       COUNT(*) FILTER (WHERE source='adoption') AS adoption_count
                FROM (
                    SELECT pet_breed AS breed, 'pet' AS source FROM pets WHERE approved = true
                    UNION ALL
                    SELECT pet_breed AS breed, 'adoption' FROM pets WHERE listing_type = 'adoption' AND approved = true
                ) t
                WHERE breed IS NOT NULL
                GROUP BY breed
                ORDER BY COUNT(*) DESC
                LIMIT 10
            `),
        ]);

        return NextResponse.json({
            trending_hashtags: hashtagsRes.rows.map((r) => ({
                tag: r.tag,
                post_count: r.post_count,
            })),
            media_posts: mediaPostsRes.rows,
            trending_breeds: breedsRes.rows,
        });

    } catch (error) {
        console.error("V1 Explore Discovery error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
