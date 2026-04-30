import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/explore/discovery
 * Returns idle-state data for the explore screen:
 *   - trending_hashtags  (last 7 days, top 15)
 *   - suggested_users    (not followed, ranked by mutual follows then follower_count, top 10)
 *
 * Cache: 5 minutes (handled by client via React Query staleTime)
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const [hashtagsRes, usersRes] = await Promise.all([
            // Trending hashtags — posts tagged in the last 7 days
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

            // Suggested users — not followed, not self, ranked by mutual follows then follower_count
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
                    u.bio,
                    COALESCE(m.mutual_count, 0) AS mutual_follows,
                    false AS is_following
                FROM users u
                LEFT JOIN mutual m ON m.user_id = u.user_id
                WHERE u.user_id != $1
                  AND u.user_id NOT IN (SELECT following_id FROM my_following)
                ORDER BY mutual_follows DESC, u.follower_count DESC
                LIMIT 10
            `, [userId]),
        ]);

        return NextResponse.json({
            trending_hashtags: hashtagsRes.rows.map((r) => ({
                tag: r.tag,
                post_count: r.post_count,
            })),
            suggested_users: usersRes.rows,
        });

    } catch (error) {
        console.error("V1 Explore Discovery error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
