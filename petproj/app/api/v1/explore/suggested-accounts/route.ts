import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit } from "@/utils/rateLimit";

export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json({ error: { code, message, status } }, { status });
}

/**
 * GET /api/v1/explore/suggested-accounts
 * Accounts the viewer doesn't follow yet, ranked by a blend of
 * popularity, mutual follows, shared interest tags, and same-city bonus.
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);

        const userId = parseInt(String(userIdRaw), 10);

        const rl = await rateLimit(`explore_suggested:${userId}`, 30, 60);
        if (!rl.success) {
            return errorResponse("RATE_LIMITED", "Too many requests, slow down", 429);
        }

        const { searchParams } = new URL(req.url);
        const limit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));

        const result = await db.query(`
            WITH me AS (
                SELECT city_id FROM users WHERE user_id = $1
            ),
            viewer_following AS (
                SELECT following_id FROM social_follows WHERE follower_id = $1
            ),
            viewer_top_tags AS (
                SELECT tag_id FROM user_interest_scores
                WHERE user_id = $1
                ORDER BY score DESC
                LIMIT 10
            ),
            -- The viewer's own posts, so we can find who's been interacting with them
            my_posts AS (
                SELECT post_id FROM social_posts
                WHERE user_id = $1 AND is_deleted = false
            ),
            -- Top interactors: people who liked/commented on the viewer's posts in the
            -- last 45 days (comments weighted heavier than likes). These are the
            -- strongest "follow back" candidates.
            interactors AS (
                SELECT actor_id, SUM(weight) AS interactions_with_me
                FROM (
                    SELECT sl.user_id AS actor_id, COUNT(*)::numeric AS weight
                    FROM social_likes sl
                    JOIN my_posts mp ON mp.post_id = sl.post_id
                    WHERE sl.user_id <> $1
                      AND sl.created_at >= NOW() - INTERVAL '45 days'
                    GROUP BY sl.user_id
                    UNION ALL
                    SELECT sc.user_id AS actor_id, (COUNT(*) * 2)::numeric AS weight
                    FROM social_comments sc
                    JOIN my_posts mp ON mp.post_id = sc.post_id
                    WHERE sc.user_id <> $1
                      AND sc.is_deleted = false
                      AND sc.created_at >= NOW() - INTERVAL '45 days'
                    GROUP BY sc.user_id
                ) x
                GROUP BY actor_id
            ),
            -- Candidate pool = popular accounts UNION everyone who interacts with the
            -- viewer, so top interactors are always considered even with few followers.
            candidate_pool AS (
                SELECT user_id FROM (
                    SELECT u.user_id
                    FROM users u
                    ORDER BY u.follower_count DESC NULLS LAST
                    LIMIT 500
                ) top_pop
                UNION
                SELECT actor_id AS user_id FROM interactors
            ),
            candidates AS (
                SELECT
                    u.user_id,
                    u.name,
                    u.social_username,
                    u.profile_image_url,
                    u.bio,
                    COALESCE(u.follower_count, 0) AS follower_count,
                    COALESCE(u.is_private, false) AS is_private,
                    COALESCE(i.interactions_with_me, 0) AS interactions_with_me,
                    (
                        SELECT COUNT(*) FROM social_follows sf
                        WHERE sf.following_id = u.user_id
                          AND sf.follower_id IN (SELECT following_id FROM viewer_following)
                    ) AS mutual_follows,
                    (
                        SELECT COUNT(DISTINCT pct.tag_id)
                        FROM social_posts p2
                        JOIN post_content_tags pct ON pct.post_id = p2.post_id
                        WHERE p2.user_id = u.user_id
                          AND p2.is_deleted = false
                          AND pct.tag_id IN (SELECT tag_id FROM viewer_top_tags)
                    ) AS interest_overlap,
                    -- How much engagement this account's own recent posts attract,
                    -- so "who to follow" leans toward accounts people actually engage with.
                    (
                        SELECT COALESCE(SUM(COALESCE(p3.like_count, 0) + COALESCE(p3.comment_count, 0)), 0)
                        FROM social_posts p3
                        WHERE p3.user_id = u.user_id
                          AND p3.is_deleted = false
                          AND p3.created_at >= NOW() - INTERVAL '30 days'
                    ) AS recent_engagement,
                    (u.city_id IS NOT NULL AND u.city_id = (SELECT city_id FROM me)) AS same_city
                FROM users u
                JOIN candidate_pool cp ON cp.user_id = u.user_id
                LEFT JOIN interactors i ON i.actor_id = u.user_id
                WHERE u.user_id <> $1
                  AND NOT EXISTS (
                      SELECT 1 FROM viewer_following vf WHERE vf.following_id = u.user_id
                  )
                  AND NOT EXISTS (
                      SELECT 1 FROM user_blocks b
                      WHERE (b.blocker_id = $1 AND b.blocked_id = u.user_id)
                         OR (b.blocker_id = u.user_id AND b.blocked_id = $1)
                  )
            )
            SELECT
                user_id,
                name,
                social_username,
                profile_image_url,
                bio,
                follower_count,
                is_private,
                mutual_follows,
                interactions_with_me,
                recent_engagement,
                (
                    LOG(1 + follower_count) * 1.0
                    + mutual_follows * 3.0
                    + interest_overlap * 2.0
                    + interactions_with_me * 4.0
                    + LOG(1 + recent_engagement) * 1.5
                    + CASE WHEN same_city THEN 2.0 ELSE 0 END
                ) AS suggestion_score
            FROM candidates
            WHERE (NOT is_private) OR mutual_follows > 0 OR interactions_with_me > 0
            ORDER BY suggestion_score DESC, follower_count DESC, user_id DESC
            LIMIT $2
        `, [userId, limit]);

        return NextResponse.json({
            accounts: result.rows.map((r) => ({
                user_id: r.user_id,
                name: r.name,
                social_username: r.social_username,
                profile_image_url: r.profile_image_url,
                bio: r.bio,
                follower_count: Number(r.follower_count),
                is_private: r.is_private,
                mutual_follows: Number(r.mutual_follows),
                interactions_with_me: Number(r.interactions_with_me) || 0,
                recent_engagement: Number(r.recent_engagement) || 0,
                is_following: false,
                // Candidates are pulled from `viewer_following`-excluded rows (any
                // status), so nobody with an existing pending request ever reaches
                // this list — always false from the server; flips true optimistically
                // client-side the moment the viewer taps Follow.
                has_pending_request: false,
            })),
        });

    } catch (error) {
        console.error("V1 Suggested Accounts error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
