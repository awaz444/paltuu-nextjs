import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { fanOutPostToFollowers } from "@/lib/redis";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts
 * Fetch social feed
 * Modes:
 *   ?mode=following    (default) — algorithmic ranked feed from followed users + self
 *   ?mode=global       — algorithmic ranked feed from all users
 *   ?mode=chronological — pure newest-first (no ranking)
 *
 * Cursor-based pagination using the relevance score.
 *
 * Algorithm scoring (computed in SQL):
 *   Recency    40% — EXP decay, half-life = 6 hours
 *   Engagement 40% — (likes×1 + comments×2 + reposts×3) normalized
 *   Relationship 20% — following = +0.2 boost, own post = +0.4 boost
 */
export async function GET(req: NextRequest) {
    try {
        const limited = await rateLimit(req, LIMITS.FEED);
        if (limited) return limited;

        const userId = await getUserIdFromRequest(req);
        const { searchParams } = new URL(req.url);
        const limit   = Math.min(50, parseInt(searchParams.get("limit")  || "20", 10));
        const offset  = Math.max(0,  parseInt(searchParams.get("cursor") || "0",  10)); // cursor = page offset
        const mode    = searchParams.get("mode") || "following";

        const isChronological = mode === "chronological";
        const isGlobal        = mode === "global";
        const viewerId        = userId || 0;

        /*
         * Strategy: use a CTE so:
         *  1. The following-set is materialised once (not re-queried per row)
         *  2. Media is joined once via json_agg GROUP BY (no correlated subquery)
         *  3. Likes / reposts are left-joined (no correlated EXISTS per row)
         *  4. Cursor = plain integer OFFSET — stable across page loads
         *     (score-based cursor breaks because recency decays every second)
         */
        let feedQuery: string;
        let queryParams: any[];

        if (isChronological) {
            // ── Chronological (simple, fast) ──────────────────────────────
            feedQuery = `
                WITH post_media AS (
                    SELECT post_id, json_agg(m ORDER BY m.ordering) AS media
                    FROM social_post_media m
                    GROUP BY post_id
                )
                SELECT
                    p.*,
                    u.name               AS author_name,
                    u.profile_image_url  AS author_image,
                    u.social_username,
                    COALESCE(pm.media, '[]'::json)  AS media,
                    op.content           AS original_content,
                    op.user_id           AS original_user_id,
                    ou.name              AS original_author_name,
                    ou.social_username   AS original_social_username,
                    ou.profile_image_url AS original_author_image,
                    COALESCE(opm.media, '[]'::json) AS original_media,
                    (sl.post_id IS NOT NULL)  AS is_liked,
                    (sr.post_id IS NOT NULL)  AS is_reposted,
                    (sp.save_id IS NOT NULL)  AS is_saved,
                    COALESCE(
                      (SELECT json_agg(sc.collection_id)
                       FROM collection_posts cp
                       JOIN save_collections sc ON sc.collection_id = cp.collection_id
                       WHERE cp.save_id = sp.save_id),
                      '[]'::json
                    ) AS saved_to_collections,
                    EXISTS(
                        SELECT 1 FROM social_follows f
                        WHERE f.follower_id = $1 AND f.following_id = p.user_id
                    ) AS is_following
                FROM social_posts p
                JOIN users u ON u.user_id = p.user_id
                LEFT JOIN post_media pm  ON pm.post_id  = p.post_id
                LEFT JOIN social_posts op  ON op.post_id = p.original_post_id
                LEFT JOIN users ou         ON ou.user_id = op.user_id
                LEFT JOIN post_media opm   ON opm.post_id = op.post_id
                LEFT JOIN social_likes  sl ON sl.post_id = p.post_id AND sl.user_id = $1
                LEFT JOIN social_reposts sr ON sr.post_id = p.post_id AND sr.user_id = $1
                LEFT JOIN saved_posts sp ON sp.post_id = p.post_id AND sp.user_id = $1
                WHERE p.is_deleted = false AND p.is_hidden = false
                ${!isGlobal && userId ? `AND (
                    p.user_id = $1
                    OR p.user_id IN (SELECT following_id FROM social_follows WHERE follower_id = $1)
                )` : ""}
                ORDER BY p.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            queryParams = [viewerId, limit, offset];

            
        } else {
            // ── Algorithmic ───────────────────────────────────────────────
            // Score = recency 40% + engagement 40% + relationship 20%
            // Relationship is pre-computed via CTE to avoid per-row EXISTS
            feedQuery = `
                WITH following_set AS (
                    SELECT following_id FROM social_follows WHERE follower_id = $1
                ),
                post_media AS (
                    SELECT post_id, json_agg(m ORDER BY m.ordering) AS media
                    FROM social_post_media m
                    GROUP BY post_id
                ),
                scored AS (
                    SELECT
                        p.*,
                        u.name               AS author_name,
                        u.profile_image_url  AS author_image,
                        u.social_username,
                        COALESCE(pm.media, '[]'::json)  AS media,
                        op.content           AS original_content,
                        op.user_id           AS original_user_id,
                        ou.name              AS original_author_name,
                        ou.social_username   AS original_social_username,
                        ou.profile_image_url AS original_author_image,
                        COALESCE(opm.media, '[]'::json) AS original_media,
                        (sl.post_id IS NOT NULL)  AS is_liked,
                        (sr.post_id IS NOT NULL)  AS is_reposted,
                        (sp.save_id IS NOT NULL)  AS is_saved,
                        COALESCE(
                          (SELECT json_agg(sc.collection_id)
                           FROM collection_posts cp
                           JOIN save_collections sc ON sc.collection_id = cp.collection_id
                           WHERE cp.save_id = sp.save_id),
                          '[]'::json
                        ) AS saved_to_collections,
                        (fs.following_id IS NOT NULL) AS is_following,
                        (
                            EXP(-EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 21600.0) * 0.4
                            + LEAST(
                                LOG(1 + p.like_count * 1.0
                                      + p.comment_count * 2.0
                                      + p.repost_count  * 3.0) / 10.0,
                                0.4
                              ) * 0.4
                            + CASE
                                WHEN p.user_id = $1              THEN 0.4
                                WHEN fs.following_id IS NOT NULL THEN 0.2
                                ELSE 0.0
                              END * 0.2
                        ) AS relevance_score
                    FROM social_posts p
                    JOIN users u ON u.user_id = p.user_id
                    LEFT JOIN following_set fs  ON fs.following_id = p.user_id
                    LEFT JOIN post_media pm     ON pm.post_id  = p.post_id
                    LEFT JOIN social_posts op   ON op.post_id  = p.original_post_id
                    LEFT JOIN users ou          ON ou.user_id  = op.user_id
                    LEFT JOIN post_media opm    ON opm.post_id = op.post_id
                    LEFT JOIN social_likes   sl ON sl.post_id = p.post_id AND sl.user_id = $1
                    LEFT JOIN social_reposts sr ON sr.post_id = p.post_id AND sr.user_id = $1
                    LEFT JOIN saved_posts sp ON sp.post_id = p.post_id AND sp.user_id = $1
                    WHERE p.is_deleted = false AND p.is_hidden = false
                    ${!isGlobal && userId ? `AND (
                        p.user_id = $1
                        OR fs.following_id IS NOT NULL
                    )` : ""}
                )
                SELECT * FROM scored
                ORDER BY relevance_score DESC, created_at DESC
                LIMIT $2 OFFSET $3
            `;
            queryParams = [viewerId, limit, offset];
        }

        const result = await db.query(feedQuery, queryParams);
        const posts  = result.rows;

        // Cursor = next offset (null when we got fewer rows than requested)
        const nextCursor = posts.length === limit ? String(offset + limit) : null;

        return NextResponse.json({
            posts,
            next_cursor: nextCursor,
            has_more:    nextCursor !== null,
            mode:        isChronological ? "chronological" : "algorithmic",
        });

    } catch (error) {
        console.error("V1 Social Posts GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/social/posts
 * Create a new social post
 */
export async function POST(req: NextRequest) {
    try {
        const limited = await rateLimit(req, LIMITS.POST_CREATE);
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const body = await req.json();
        const { pet_id, post_type, content, media = [] } = body;

        if (!post_type || (!content && media.length === 0)) {
            return NextResponse.json({ error: "Post content or media is required" }, { status: 400 });
        }

        await db.query('BEGIN');
        try {
            // 1. Create Post
            const postRes = await db.query(`
                INSERT INTO social_posts (user_id, pet_id, post_type, content)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [userId, pet_id || null, post_type, content]);
            const post = postRes.rows[0];

            // 2. Add Media
            for (let i = 0; i < media.length; i++) {
                const m = media[i];
                await db.query(`
                    INSERT INTO social_post_media (post_id, media_type, url, thumbnail_url, ordering)
                    VALUES ($1, $2, $3, $4, $5)
                `, [post.post_id, m.media_type, m.url, m.thumbnail_url || null, i]);
            }

            // 3. Increment Post Count
            await db.query("UPDATE users SET post_count = post_count + 1 WHERE user_id = $1", [userId]);
            if (pet_id) {
                await db.query("UPDATE pets SET post_count = post_count + 1 WHERE pet_id = $1", [pet_id]);
            }

            // 4. Parse & upsert hashtags from content
            if (content) {
                const tagMatches = content.match(/#([a-zA-Z0-9_]+)/g) || [];
                const uniqueTags = [...new Set(tagMatches.map((t: string) => t.slice(1).toLowerCase()))];
                for (const tag of uniqueTags) {
                    // Upsert: insert tag if new, increment post_count if exists
                    const tagRes = await db.query(`
                        INSERT INTO hashtags (tag, post_count)
                        VALUES ($1, 1)
                        ON CONFLICT (tag) DO UPDATE
                            SET post_count = hashtags.post_count + 1
                        RETURNING hashtag_id
                    `, [tag]);
                    const hashtagId = tagRes.rows[0].hashtag_id;
                    // Link post → hashtag (ignore duplicate if somehow re-run)
                    await db.query(`
                        INSERT INTO post_hashtags (post_id, hashtag_id)
                        VALUES ($1, $2)
                        ON CONFLICT DO NOTHING
                    `, [post.post_id, hashtagId]);
                }
            }

            await db.query('COMMIT');

            // Fan-out to follower feed caches (fire and forget — non-blocking)
            fanOutPostToFollowers(post.post_id, userId, post.created_at, db)
                .catch(() => {}); // never block the response

            return NextResponse.json(post, { status: 201 });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Posts POST error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
