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

        const [hashtagsRes, usersRes, breedsRes] = await Promise.all([
            // Trending hashtags — top 15 by recent activity in last 7 days
            db.query(`
                SELECT
                    h.tag,
                    h.post_count,
                    COUNT(ph.post_id) AS recent_count
                FROM post_hashtags ph
                JOIN hashtags h ON h.hashtag_id = ph.hashtag_id
                WHERE ph.created_at >= NOW() - INTERVAL '7 days'
                GROUP BY h.hashtag_id, h.tag, h.post_count
                ORDER BY recent_count DESC
                LIMIT 15
            `),

            // Suggested users — mutual follows first, then follower count
            db.query(`
                WITH my_following AS (
                    SELECT following_id FROM social_follows WHERE follower_id = $1
                ),
                mutual AS (
                    SELECT
                        sf.following_id AS user_id,
                        COUNT(*) AS mutual_count
                    FROM social_follows sf
                    WHERE sf.follower_id IN (SELECT following_id FROM my_following)
                      AND sf.following_id != $1
                      AND sf.following_id NOT IN (SELECT following_id FROM my_following)
                    GROUP BY sf.following_id
                )
                SELECT
                    u.user_id,
                    u.name,
                    u.social_username,
                    u.profile_image_url,
                    u.follower_count,
                    COALESCE(m.mutual_count, 0) AS mutual_follows,
                    false AS is_following
                FROM users u
                LEFT JOIN mutual m ON m.user_id = u.user_id
                WHERE u.user_id != $1
                  AND u.is_deleted = false
                  AND u.user_id NOT IN (SELECT following_id FROM my_following)
                ORDER BY mutual_follows DESC, u.follower_count DESC
                LIMIT 10
            `, [userId]),

            // Trending breeds — derived from pets + adoption_listings
            db.query(`
                SELECT breed, 
                       COUNT(*) FILTER (WHERE source='pet') AS pet_count,
                       COUNT(*) FILTER (WHERE source='adoption') AS adoption_count
                FROM (
                    SELECT pet_breed AS breed, 'pet' AS source FROM pets WHERE is_deleted = false
                    UNION ALL
                    SELECT pet_breed AS breed, 'adoption' FROM pets WHERE listing_type = 'adoption' AND is_deleted = false
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
            suggested_users: usersRes.rows,
            trending_breeds: breedsRes.rows,
        });

    } catch (error) {
        console.error("V1 Explore Discovery error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
