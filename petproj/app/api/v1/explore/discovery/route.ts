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
            // Trending hashtags — ranked by the engagement (likes + weighted comments)
            // of the posts using each tag in the last 14 days, so "trending" reflects
            // what people are actually interacting with, not just raw post volume.
            // The +1 per recent post keeps freshly-used tags in the running even before
            // they accumulate likes. Falls back to all-time post_count on ties.
            db.query(`
                SELECT
                    h.tag,
                    h.post_count,
                    COALESCE(SUM(
                        CASE WHEN ph.created_at >= NOW() - INTERVAL '14 days'
                             THEN (COALESCE(p.like_count, 0) + COALESCE(p.comment_count, 0) * 2 + 1)
                             ELSE 0 END
                    ), 0) AS engagement_score,
                    COUNT(ph.post_id) FILTER (WHERE ph.created_at >= NOW() - INTERVAL '14 days') AS recent_count
                FROM hashtags h
                JOIN post_hashtags ph ON ph.hashtag_id = h.hashtag_id
                JOIN social_posts p ON p.post_id = ph.post_id
                    AND p.is_deleted = false AND p.is_hidden = false
                WHERE h.post_count > 0
                GROUP BY h.hashtag_id, h.tag, h.post_count
                ORDER BY engagement_score DESC, recent_count DESC, h.post_count DESC
                LIMIT 15
            `),

            // Media grid — "most interacted media" first. Ranked purely by a
            // time-decayed engagement score (likes/comments/reposts weighted, with a
            // gravity decay so the grid stays fresh instead of pinning all-time hits
            // forever). Scoped to the last year so the scan stays bounded; excludes
            // private and blocked authors.
            db.query(`
                WITH candidate_posts AS (
                    SELECT
                        p.post_id, p.content, p.like_count, p.comment_count, p.repost_count, p.created_at,
                        u.user_id, u.name AS author_name,
                        u.social_username, u.profile_image_url AS author_image,
                        (
                            ((COALESCE(p.like_count, 0) * 2)
                             + (COALESCE(p.comment_count, 0) * 3)
                             + (COALESCE(p.repost_count, 0) * 4) + 1)
                            / POWER((EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0) + 2, 1.15)
                        ) AS rank_score
                    FROM social_posts p
                    JOIN users u ON u.user_id = p.user_id
                    WHERE p.is_deleted = false
                      AND p.is_hidden = false
                      AND u.is_private = false
                      AND p.created_at >= NOW() - INTERVAL '365 days'
                      AND EXISTS (SELECT 1 FROM social_post_media m WHERE m.post_id = p.post_id)
                      AND NOT EXISTS (
                          SELECT 1 FROM user_blocks b
                          WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                             OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                      )
                )
                SELECT
                    cp.post_id, cp.content, cp.like_count, cp.comment_count, cp.repost_count, cp.created_at,
                    cp.user_id, cp.author_name, cp.social_username, cp.author_image,
                    (SELECT json_agg(m.* ORDER BY m.ordering) FROM social_post_media m WHERE m.post_id = cp.post_id) AS media
                FROM candidate_posts cp
                ORDER BY cp.rank_score DESC, cp.created_at DESC, cp.post_id DESC
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
                engagement_score: Number(r.engagement_score) || 0,
                recent_count: Number(r.recent_count) || 0,
            })),
            media_posts: mediaPostsRes.rows,
            trending_breeds: breedsRes.rows,
        });

    } catch (error) {
        console.error("V1 Explore Discovery error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
