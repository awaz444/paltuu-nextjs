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
            -- Cheap popularity pre-filter so the scoring below never scans the full user table
            candidate_pool AS (
                SELECT u.user_id
                FROM users u
                WHERE u.user_id <> $1
                  AND NOT EXISTS (
                      SELECT 1 FROM viewer_following vf WHERE vf.following_id = u.user_id
                  )
                  AND NOT EXISTS (
                      SELECT 1 FROM user_blocks b
                      WHERE (b.blocker_id = $1 AND b.blocked_id = u.user_id)
                         OR (b.blocker_id = u.user_id AND b.blocked_id = $1)
                  )
                ORDER BY u.follower_count DESC NULLS LAST
                LIMIT 500
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
                    (u.city_id IS NOT NULL AND u.city_id = (SELECT city_id FROM me)) AS same_city
                FROM users u
                JOIN candidate_pool cp ON cp.user_id = u.user_id
            )
            SELECT
                user_id,
                name,
                social_username,
                profile_image_url,
                bio,
                follower_count,
                mutual_follows,
                (
                    LOG(1 + follower_count) * 1.0
                    + mutual_follows * 3.0
                    + interest_overlap * 2.0
                    + CASE WHEN same_city THEN 2.0 ELSE 0 END
                ) AS suggestion_score
            FROM candidates
            WHERE (NOT is_private) OR mutual_follows > 0
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
                mutual_follows: Number(r.mutual_follows),
                is_following: false,
            })),
        });

    } catch (error) {
        console.error("V1 Suggested Accounts error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
