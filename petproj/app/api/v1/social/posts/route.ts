import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { fanOutPostToFollowers } from "@/lib/redis";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import {
    resolveBucket,
    ensureBucketAssigned,
    logFeedImpressions,
    RANKING_WEIGHTS,
    type ExperimentBucket,
} from "@/lib/feedExperiment";
import {
    parseMentions,
    validateMentions,
    persistMentions,
    notifyNewMentions,
    MAX_MENTIONS_PER_CONTENT,
    type ParsedMention,
} from "@/lib/mentions";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts
 * Fetch social feed
 * Modes:
 *   ?mode=following    (default) — algorithmic ranked feed from followed users + self
 *   ?mode=global       — algorithmic ranked feed from all users
 *   ?mode=personalized — "For You": base ranking blended with interest affinity
 *                        (A/B: control = base only, treatment = 0.70·base + 0.30·affinity)
 *   ?mode=chronological — pure newest-first (no ranking)
 *
 * global + personalized exclude quarantined posts; following keeps them visible.
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
        const limit   = Math.min(30, parseInt(searchParams.get("limit")  || "20", 10));
        const offset  = Math.min(1000, Math.max(0, parseInt(searchParams.get("cursor") || "0", 10))); // cursor = page offset
        const mode    = searchParams.get("mode") || "following";

        const isChronological = mode === "chronological";
        const isPersonalized  = mode === "personalized";
        const isGlobal        = mode === "global";
        const viewerId        = userId || 0;

        // Quarantined posts are excluded from global + personalized feeds, but stay
        // visible in the following feed (still shown to followers). See plan §8.
        const quarantineFilter = (isGlobal || isPersonalized)
            ? `AND (p.moderation_state IS NULL OR p.moderation_state <> 'quarantined')`
            : ``;

        // ── Personalized "For You" feed (plan §11) — A/B experiment surface ────────
        // Resolve the viewer's experiment arm; control ranks on base_score only,
        // treatment blends interest affinity. Falls through to the algorithmic query
        // for everyone else.
        if (isPersonalized && userId) {
            const viewerIdNum = parseInt(String(userId), 10);
            const bucketRow = await db.query(
                `SELECT feed_experiment_bucket, feed_experiment_assigned
                   FROM users WHERE user_id = $1`,
                [viewerId]
            );
            const bucket: ExperimentBucket = resolveBucket(
                viewerIdNum,
                bucketRow.rows[0]?.feed_experiment_assigned === true,
                bucketRow.rows[0]?.feed_experiment_bucket ?? null
            );
            // Persist the deterministic default on first serve (non-blocking).
            ensureBucketAssigned(viewerIdNum).catch(() => {});

            const { base: baseW, affinity: affW } = RANKING_WEIGHTS[bucket];

            const personalizedQuery = `
                WITH following_set AS (
                    SELECT following_id FROM social_follows WHERE follower_id = $1
                ),
                post_media AS (
                    SELECT post_id, json_agg(m ORDER BY m.ordering) AS media
                    FROM social_post_media m
                    GROUP BY post_id
                ),
                user_max_interest AS (
                    SELECT COALESCE(MAX(score), 0.01) AS max_score
                    FROM user_interest_scores
                    WHERE user_id = $1
                ),
                post_affinity AS (
                    SELECT
                        pct.post_id,
                        AVG(uis.score) FILTER (WHERE pct.role = 'primary') AS avg_primary_interest,
                        COUNT(*) FILTER (WHERE pct.role = 'primary')        AS primary_count
                    FROM post_content_tags pct
                    LEFT JOIN user_interest_scores uis
                        ON uis.tag_id = pct.tag_id AND uis.user_id = $1
                    GROUP BY pct.post_id
                    HAVING COUNT(*) FILTER (WHERE pct.role = 'primary') BETWEEN 1 AND 3
                ),
                scored AS (
                    SELECT
                        p.*,
                        u.name               AS author_name,
                        u.profile_image_url  AS author_image,
                        u.social_username,
                        false                AS is_blocked_by_me,
                        false                AS is_blocking_me,
                        COALESCE(pm.media, '[]'::json)  AS media,
                        COALESCE(
                            (SELECT json_agg(json_build_object(
                                'pet_profile_id', pp.pet_profile_id,
                                'name', pp.name,
                                'avatar_url', pp.avatar_url,
                                'species', pp.species
                             ))
                             FROM post_pet_tags ppt
                             JOIN pet_profiles pp ON pp.pet_profile_id = ppt.pet_profile_id
                             WHERE ppt.post_id = p.post_id),
                            '[]'::json
                        ) AS tagged_pets,
                        op.content           AS original_content,
                        op.user_id           AS original_user_id,
                        ou.name              AS original_author_name,
                        ou.social_username   AS original_social_username,
                        ou.profile_image_url AS original_author_image,
                        false                AS original_author_is_blocked_by_me,
                        false                AS original_author_is_blocking_me,
                        COALESCE(opm.media, '[]'::json) AS original_media,
                        (sl.post_id IS NOT NULL)  AS is_liked,
                        (sr.post_id IS NOT NULL)  AS is_reposted,
                        EXISTS(SELECT 1 FROM social_comments WHERE post_id = p.post_id AND user_id = $1 AND is_deleted = false) AS is_commented,
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
                        ) AS base_score,
                        CASE
                            WHEN pa.avg_primary_interest IS NOT NULL
                                THEN pa.avg_primary_interest / umi.max_score
                            ELSE 0
                        END AS score_affinity
                    FROM social_posts p
                    JOIN users u ON u.user_id = p.user_id
                    LEFT JOIN following_set fs  ON fs.following_id = p.user_id
                    LEFT JOIN post_media pm     ON pm.post_id  = p.post_id
                    LEFT JOIN social_posts op   ON op.post_id  = p.original_post_id
                    LEFT JOIN users ou          ON ou.user_id  = op.user_id
                    LEFT JOIN post_media opm    ON opm.post_id = op.post_id
                    LEFT JOIN social_likes   sl ON sl.post_id = p.post_id AND sl.user_id = $1
                    LEFT JOIN social_reposts sr ON sr.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sr.user_id = $1
                    LEFT JOIN saved_posts sp ON sp.post_id = p.post_id AND sp.user_id = $1
                    LEFT JOIN post_affinity pa  ON pa.post_id = p.post_id
                    CROSS JOIN user_max_interest umi
                    WHERE p.is_deleted = false AND (p.is_hidden = false OR p.user_id = $1)
                    AND (p.moderation_state IS NULL OR p.moderation_state <> 'quarantined')
                    AND NOT EXISTS (
                        SELECT 1 FROM user_blocks b
                        WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                           OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                    )
                    AND (p.original_post_id IS NULL OR NOT EXISTS (
                        SELECT 1 FROM user_blocks b
                        WHERE (b.blocker_id = $1 AND b.blocked_id = op.user_id)
                           OR (b.blocker_id = op.user_id AND b.blocked_id = $1)
                    ))
                )
                SELECT *,
                    ($4 * base_score + $5 * score_affinity) AS relevance_score
                FROM scored
                ORDER BY relevance_score DESC, created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(personalizedQuery, [viewerId, limit, offset, baseW, affW]);
            const posts  = result.rows;

            // Log impressions for the A/B experiment (fire-and-forget).
            logFeedImpressions(
                viewerIdNum,
                bucket,
                posts.map((row, idx) => ({
                    post_id: row.post_id,
                    score_base: Number(row.base_score) || 0,
                    score_affinity: Number(row.score_affinity) || 0,
                    score_final: Number(row.relevance_score) || 0,
                    position: offset + idx,
                }))
            ).catch(() => {});

            const nextCursor = posts.length === limit ? String(offset + limit) : null;
            return NextResponse.json({
                posts,
                next_cursor:       nextCursor,
                has_more:          nextCursor !== null,
                mode:              "personalized",
                experiment_bucket: bucket,
            });
        }

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
                    false                AS is_blocked_by_me,
                    false                AS is_blocking_me,
                    COALESCE(pm.media, '[]'::json)  AS media,
                    COALESCE(
                        (SELECT json_agg(json_build_object(
                            'pet_profile_id', pp.pet_profile_id,
                            'name', pp.name,
                            'avatar_url', pp.avatar_url,
                            'species', pp.species
                         ))
                         FROM post_pet_tags ppt
                         JOIN pet_profiles pp ON pp.pet_profile_id = ppt.pet_profile_id
                         WHERE ppt.post_id = p.post_id),
                        '[]'::json
                    ) AS tagged_pets,
                    op.content           AS original_content,
                    op.user_id           AS original_user_id,
                    ou.name              AS original_author_name,
                    ou.social_username   AS original_social_username,
                    ou.profile_image_url AS original_author_image,
                    false                AS original_author_is_blocked_by_me,
                    false                AS original_author_is_blocking_me,
                    COALESCE(opm.media, '[]'::json) AS original_media,
                    (sl.post_id IS NOT NULL)  AS is_liked,
                    (sr.post_id IS NOT NULL)  AS is_reposted,
                    EXISTS(SELECT 1 FROM social_comments WHERE post_id = p.post_id AND user_id = $1 AND is_deleted = false) AS is_commented,
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
                LEFT JOIN social_reposts sr ON sr.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sr.user_id = $1
                LEFT JOIN saved_posts sp ON sp.post_id = p.post_id AND sp.user_id = $1
                WHERE p.is_deleted = false AND (p.is_hidden = false OR p.user_id = $1)
                AND NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                       OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                )
                AND (p.original_post_id IS NULL OR NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = $1 AND b.blocked_id = op.user_id)
                       OR (b.blocker_id = op.user_id AND b.blocked_id = $1)
                ))
                ${quarantineFilter}
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
                        false                AS is_blocked_by_me,
                        false                AS is_blocking_me,
                        COALESCE(pm.media, '[]'::json)  AS media,
                        COALESCE(
                            (SELECT json_agg(json_build_object(
                                'pet_profile_id', pp.pet_profile_id,
                                'name', pp.name,
                                'avatar_url', pp.avatar_url,
                                'species', pp.species
                             ))
                             FROM post_pet_tags ppt
                             JOIN pet_profiles pp ON pp.pet_profile_id = ppt.pet_profile_id
                             WHERE ppt.post_id = p.post_id),
                            '[]'::json
                        ) AS tagged_pets,
                        op.content           AS original_content,
                        op.user_id           AS original_user_id,
                        ou.name              AS original_author_name,
                        ou.social_username   AS original_social_username,
                        ou.profile_image_url AS original_author_image,
                        false                AS original_author_is_blocked_by_me,
                        false                AS original_author_is_blocking_me,
                        COALESCE(opm.media, '[]'::json) AS original_media,
                        (sl.post_id IS NOT NULL)  AS is_liked,
                        (sr.post_id IS NOT NULL)  AS is_reposted,
                        EXISTS(SELECT 1 FROM social_comments WHERE post_id = p.post_id AND user_id = $1 AND is_deleted = false) AS is_commented,
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
                    LEFT JOIN social_reposts sr ON sr.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sr.user_id = $1
                    LEFT JOIN saved_posts sp ON sp.post_id = p.post_id AND sp.user_id = $1
                    WHERE p.is_deleted = false AND (p.is_hidden = false OR p.user_id = $1)
                    AND NOT EXISTS (
                        SELECT 1 FROM user_blocks b
                        WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                           OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                    )
                    AND (p.original_post_id IS NULL OR NOT EXISTS (
                        SELECT 1 FROM user_blocks b
                        WHERE (b.blocker_id = $1 AND b.blocked_id = op.user_id)
                           OR (b.blocker_id = op.user_id AND b.blocked_id = $1)
                    ))
                    ${quarantineFilter}
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
        const { post_type, content, media = [], pet_profile_tags = [] } = body;

        if (!post_type || (!content && media.length === 0)) {
            return NextResponse.json({ error: "Post content or media is required" }, { status: 400 });
        }

        let parsedMentions: ParsedMention[] = [];

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            // 1. Create Post
            const postRes = await client.query(`
                INSERT INTO social_posts (user_id, post_type, content)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [userId, post_type, content]);
            const post = postRes.rows[0];

            // 2. Add Media — collect inserted rows so we can return media_id to the client
            const insertedMedia: any[] = [];
            for (let i = 0; i < media.length; i++) {
                const m = media[i];
                // For video rows, set video_status = 'pending' so the status endpoint
                // reflects the correct state before MediaConvert is triggered.
                const videoStatus = m.media_type === 'video' ? 'pending' : 'ready';
                const mediaRes = await client.query(
                    `INSERT INTO social_post_media
                         (post_id, media_type, url, thumbnail_url, ordering, video_status)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING media_id, media_type, url, thumbnail_url, ordering, video_status, hls_url`,
                    [post.post_id, m.media_type, m.url, m.thumbnail_url || null, i, videoStatus]
                );
                insertedMedia.push(mediaRes.rows[0]);
            }

            // 3. Increment Post Count
            await client.query("UPDATE users SET post_count = post_count + 1 WHERE user_id = $1", [userId]);

            // 4. Parse & upsert hashtags from content
            if (content) {
                const tagMatches = content.match(/#([a-zA-Z0-9_]+)/g) || [];
                const uniqueTags = [...new Set(tagMatches.map((t: string) => t.slice(1).toLowerCase()))];
                for (const tag of uniqueTags) {
                    // Upsert: insert tag if new, increment post_count if exists
                    const tagRes = await client.query(`
                        INSERT INTO hashtags (tag, post_count)
                        VALUES ($1, 1)
                        ON CONFLICT (tag) DO UPDATE
                            SET post_count = hashtags.post_count + 1
                        RETURNING hashtag_id
                    `, [tag]);
                    const hashtagId = tagRes.rows[0].hashtag_id;
                    // Link post → hashtag (ignore duplicate if somehow re-run)
                    await client.query(`
                        INSERT INTO post_hashtags (post_id, hashtag_id)
                        VALUES ($1, $2)
                        ON CONFLICT DO NOTHING
                    `, [post.post_id, hashtagId]);
                }
            }

            // 4.5. Parse, validate & persist @mentions from content
            if (content) {
                parsedMentions = parseMentions(content);
                if (parsedMentions.length > MAX_MENTIONS_PER_CONTENT) {
                    throw new Error(`A post can mention at most ${MAX_MENTIONS_PER_CONTENT} users/pets`);
                }
                await validateMentions(client, parsedMentions, userId);
                await persistMentions(client, { postId: post.post_id }, parsedMentions, userId);
            }

            // 5. Tag personal pet profiles (not adoption listings)
            if (Array.isArray(pet_profile_tags) && pet_profile_tags.length > 0) {
                const tagIds = pet_profile_tags
                    .map((id: any) => parseInt(String(id), 10))
                    .filter((id: number) => !isNaN(id));

                if (tagIds.length > 0) {
                    // Validate all tagged pet_profile_ids belong to the posting user
                    const ownerCheck = await client.query(
                        `SELECT COUNT(*) FROM pet_profiles
                         WHERE pet_profile_id = ANY($1::int[]) AND owner_id = $2`,
                        [tagIds, userId]
                    );
                    if (parseInt(ownerCheck.rows[0].count, 10) !== tagIds.length) {
                        throw new Error('One or more tagged pet profiles do not belong to you');
                    }

                    for (const profileId of tagIds) {
                        await client.query(
                            `INSERT INTO post_pet_tags (post_id, pet_profile_id)
                             VALUES ($1, $2)
                             ON CONFLICT DO NOTHING`,
                            [post.post_id, profileId]
                        );
                    }
                }
            }

            await client.query('COMMIT');

            // Fan-out to follower feed caches (fire and forget — non-blocking)
            fanOutPostToFollowers(post.post_id, userId, post.created_at, db)
                .catch(() => {}); // never block the response

            // Notify mentioned users/pet-owners (fire and forget — non-blocking)
            if (parsedMentions.length > 0) {
                const authorRes = await db.query(`SELECT name FROM users WHERE user_id = $1`, [userId]);
                notifyNewMentions(parsedMentions, {
                    mentionerId: userId,
                    mentionerName: authorRes.rows[0]?.name || 'User',
                    postId: Number(post.post_id),
                    isComment: false,
                    postImageUrl: media[0]?.url,
                    preview: content,
                }).catch(() => {});
            }

            // Return post + media[] so the mobile app can read media_id for the
            // MediaConvert confirm step (confirmVideoUpload needs media_id).
            return NextResponse.json({ ...post, media: insertedMedia }, { status: 201 });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("V1 Social Posts POST error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const isValidationError =
            message.includes('do not belong to you') ||
            message.includes('do not exist') ||
            message.includes('mention at most');
        return NextResponse.json(
            { error: message },
            { status: isValidationError ? 400 : 500 }
        );
    }
}
