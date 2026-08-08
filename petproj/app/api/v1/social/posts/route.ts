import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { fanOutPostToFollowers, getCachedFeedIds } from "@/lib/redis";
import { hydratePostsByIds } from "@/lib/feedHydration";
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
import {
    INFERRED_AFFINITY_MULTIPLIER,
    personalizedAffinityCtes,
} from "@/lib/tagInference";
import { validateSocialMediaPayload } from "@/lib/giphyMedia";
import { hasSevereMatch, redactSevereWords } from "@/lib/moderation/badWords";
import {
    TAGGED_PETS_AGG_CTE,
    SAVED_COLLECTIONS_AGG_CTE,
    VIEWER_COMMENTS_CTE,
    originalPostAccessibleExpr,
    originalPostVisibilityFilter,
    shadowHiddenFilter,
    redactUnavailableOriginals,
} from "@/lib/feedQueryFragments";
import { redactModerationFields } from "@/lib/moderationRedaction";
import { getReportSettings } from "@/lib/reportScoring";
import { getSurfaceableComment } from "@/lib/commentSurfacing";
import { getSurfacedCommentIds, markCommentSurfaced } from "@/lib/redis";
import { interleaveFeedInjections } from "@/lib/feedInjection";

export const dynamic = "force-dynamic";

/**
 * The one deliberate exception to private-post visibility: a popular reply
 * left by someone the viewer follows can surface as its own card, without
 * exposing the private post itself (see lib/commentSurfacing.ts). Only
 * attempted on a cold page-1 load — never mid-scroll — and deduped per
 * viewer via Redis so the same comment doesn't repeat on every app open.
 * Fails closed: any error here is swallowed and the normal feed is returned
 * untouched, since this is a rare embellishment, not core feed functionality.
 */
async function maybeInjectSurfacedComment(
    viewerId: number,
    offset: number,
    posts: any[]
): Promise<any[]> {
    if (offset !== 0 || !viewerId) return posts;
    try {
        const settings = await getReportSettings();
        if (!settings.comment_surface_enabled) return posts;

        const excludeIds = await getSurfacedCommentIds(viewerId);
        const candidate = await getSurfaceableComment(viewerId, settings, excludeIds);
        if (!candidate) return posts;

        markCommentSurfaced(viewerId, candidate.comment_id, settings.comment_surface_cooldown_days).catch(() => {});

        const insertAt = Math.min(2, posts.length);
        return [...posts.slice(0, insertAt), candidate, ...posts.slice(insertAt)];
    } catch (err) {
        console.error("[comment-surfacing] injection failed:", err);
        return posts;
    }
}

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
        // Feed reads are high-volume and low-risk — check the limit best-effort
        // (fire-and-forget) instead of blocking every request on the Redis round-trip.
        const limited = await rateLimit(req, LIMITS.FEED, undefined, { blocking: false });
        if (limited) return limited;

        const userId = await getUserIdFromRequest(req);
        const { searchParams } = new URL(req.url);
        const limit   = Math.min(30, parseInt(searchParams.get("limit")  || "20", 10));
        const offset  = Math.min(1000, Math.max(0, parseInt(searchParams.get("cursor") || "0", 10))); // cursor = page offset
        const mode    = searchParams.get("mode") || "following";

        // Device GPS coords for the adoption/lost-found cards interleaved into
        // the feed (see lib/feedInjection.ts) — "near you" is now based on
        // where the phone actually is, not the viewer's stored city_id (most
        // accounts don't have one set). Falls back to no distance sort when
        // the client hasn't sent coords (e.g. location permission denied).
        const lat = parseFloat(searchParams.get("lat") || "");
        const lng = parseFloat(searchParams.get("lng") || "");
        const coords =
            Number.isFinite(lat) && Number.isFinite(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
                ? { lat, lng }
                : null;

        // ── BETA OVERRIDE ────────────────────────────────────────────────
        // For the beta test we want every tester looking at the same simple
        // feed: all public posts, newest first — no following/personalized/
        // algorithmic ranking to muddy feedback while the beta is running.
        // So we ignore the requested `mode` and force chronological+global
        // regardless of what the client asked for. Revert to reading `mode`
        // (the three lines below) once the beta wraps and per-mode ranking
        // should come back.
        const isChronological = true;
        const isPersonalized  = false;
        const isGlobal        = true;
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
                    SELECT following_id FROM social_follows WHERE follower_id = $1 AND status = 'accepted'
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
                ${TAGGED_PETS_AGG_CTE},
                ${SAVED_COLLECTIONS_AGG_CTE},
                ${VIEWER_COMMENTS_CTE},
                ${personalizedAffinityCtes()},
                scored AS (
                    SELECT
                        p.*,
                        u.name               AS author_name,
                        u.profile_image_url  AS author_image,
                        u.social_username,
                        u.verified     AS author_verified,
                        u.founding_club AS author_founding_club,
                        u.is_private   AS author_is_private,
                        false                AS is_blocked_by_me,
                        false                AS is_blocking_me,
                        COALESCE(pm.media, '[]'::json)  AS media,
                        COALESCE(tpa.tagged_pets, '[]'::json) AS tagged_pets,
                        op.content           AS original_content,
                        op.user_id           AS original_user_id,
                        ou.name              AS original_author_name,
                        ou.social_username   AS original_social_username,
                        ou.verified   AS original_author_verified,
                        ou.founding_club AS original_author_founding_club,
                        ou.profile_image_url AS original_author_image,
                        ou.is_private AS original_author_is_private,
                        false                AS original_author_is_blocked_by_me,
                        false                AS original_author_is_blocking_me,
                        ${originalPostAccessibleExpr('$1')} AS original_available,
                        COALESCE(opm.media, '[]'::json) AS original_media,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.like_count    ELSE p.like_count    END AS like_count,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.comment_count ELSE p.comment_count END AS comment_count,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.view_count    ELSE p.view_count    END AS view_count,
                        (sl.post_id IS NOT NULL)  AS is_liked,
                        (sr.post_id IS NOT NULL)  AS is_reposted,
                        (vc.post_id IS NOT NULL)  AS is_commented,
                        (sp.save_id IS NOT NULL)  AS is_saved,
                        COALESCE(sca.collection_ids, '[]'::json) AS saved_to_collections,
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
                    LEFT JOIN social_likes   sl ON sl.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sl.user_id = $1
                    LEFT JOIN social_reposts sr ON sr.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sr.user_id = $1
                    LEFT JOIN saved_posts sp ON sp.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sp.user_id = $1
                    LEFT JOIN post_affinity pa  ON pa.post_id = p.post_id
                    LEFT JOIN tagged_pets_agg tpa ON tpa.post_id = p.post_id
                    LEFT JOIN saved_collections_agg sca ON sca.save_id = sp.save_id
                    LEFT JOIN viewer_comments vc ON vc.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END
                    CROSS JOIN user_max_interest umi
                    WHERE p.is_deleted = false AND (p.is_hidden = false OR p.user_id = $1)
                    AND (p.moderation_state IS NULL OR p.moderation_state <> 'quarantined')
                    AND NOT EXISTS (
                        SELECT 1 FROM user_blocks b
                        WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                           OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                    )
                    AND (p.user_id = $1 OR u.is_private = false OR fs.following_id IS NOT NULL)
                    ${shadowHiddenFilter('$1')}
                    ${originalPostVisibilityFilter('$1')}
                    AND NOT EXISTS (
                        SELECT 1 FROM hidden_posts hp WHERE hp.user_id = $1 AND hp.post_id = p.post_id
                    )
                )
                SELECT *,
                    ($4 * base_score + $5 * score_affinity) AS relevance_score
                FROM scored
                ORDER BY relevance_score DESC, created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(personalizedQuery, [
                viewerId,
                limit,
                offset,
                baseW,
                affW,
                INFERRED_AFFINITY_MULTIPLIER,
            ]);
            const posts  = result.rows;
            redactUnavailableOriginals(posts);
            // Never let the shadow-hide flag reach the app — an author who could
            // see it would know their post had been moderated.
            redactModerationFields(posts);

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

            // Cursor is based on the real page length — computed BEFORE the
            // surfaced-comment card (if any) is spliced in, so pagination stays
            // correct regardless of whether a card was injected.
            const nextCursor = posts.length === limit ? String(offset + limit) : null;
            const postsWithInjections = await interleaveFeedInjections(posts, viewerIdNum, offset, coords);
            const postsWithSurfaced = await maybeInjectSurfacedComment(viewerIdNum, offset, postsWithInjections);

            return NextResponse.json({
                posts: postsWithSurfaced,
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
        // Cache-first path: chronological mode's ordering is pure recency,
        // which matches the feed:{userId} ZSET populated by fanOutPostToFollowers
        // on post create — so a page-1 request can skip Postgres entirely on a
        // cache hit. Only intercept offset === 0 (true cold start); paginated
        // requests (cursor present) always go to Postgres. Any length mismatch
        // after hydration (a cached post got deleted/hidden/blocked since) falls
        // through to the full query below rather than returning a partial list.
        // BETA: this cache holds each user's *following* feed (populated by
        // fanOutPostToFollowers), not the public/global feed — with mode
        // forced global above, `isGlobal` guards us from ever serving it.
        if (isChronological && !isGlobal && userId && offset === 0) {
            const viewerIdNum = parseInt(String(viewerId), 10);
            const cachedIds = await getCachedFeedIds(viewerIdNum, null, limit);
            if (cachedIds && cachedIds.length > 0) {
                const hydrated = await hydratePostsByIds(cachedIds, viewerIdNum);
                if (hydrated.length === cachedIds.length) {
                    const hydratedWithInjections = await interleaveFeedInjections(hydrated, viewerIdNum, offset, coords);
                    const hydratedWithSurfaced = await maybeInjectSurfacedComment(viewerIdNum, offset, hydratedWithInjections);
                    return NextResponse.json({
                        posts: hydratedWithSurfaced,
                        next_cursor: String(limit),
                        has_more: true,
                        mode: "chronological",
                        source: "cache",
                    });
                }
                // Partial hydration failure — fall through to the Postgres query.
            }
        }

        let feedQuery: string;
        let queryParams: any[];

        if (isChronological) {
            // ── Chronological (simple, fast) ──────────────────────────────
            feedQuery = `
                WITH post_media AS (
                    SELECT post_id, json_agg(m ORDER BY m.ordering) AS media
                    FROM social_post_media m
                    GROUP BY post_id
                ),
                ${TAGGED_PETS_AGG_CTE},
                ${SAVED_COLLECTIONS_AGG_CTE},
                ${VIEWER_COMMENTS_CTE}
                SELECT
                    p.*,
                    u.name               AS author_name,
                    u.profile_image_url  AS author_image,
                    u.social_username,
                        u.verified     AS author_verified,
                        u.founding_club AS author_founding_club,
                        u.is_private   AS author_is_private,
                    false                AS is_blocked_by_me,
                    false                AS is_blocking_me,
                    COALESCE(pm.media, '[]'::json)  AS media,
                    COALESCE(tpa.tagged_pets, '[]'::json) AS tagged_pets,
                    op.content           AS original_content,
                    op.user_id           AS original_user_id,
                    ou.name              AS original_author_name,
                    ou.social_username   AS original_social_username,
                        ou.verified   AS original_author_verified,
                        ou.founding_club AS original_author_founding_club,
                    ou.profile_image_url AS original_author_image,
                        ou.is_private AS original_author_is_private,
                    false                AS original_author_is_blocked_by_me,
                    false                AS original_author_is_blocking_me,
                    ${originalPostAccessibleExpr('$1')} AS original_available,
                    COALESCE(opm.media, '[]'::json) AS original_media,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.like_count    ELSE p.like_count    END AS like_count,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.comment_count ELSE p.comment_count END AS comment_count,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.view_count    ELSE p.view_count    END AS view_count,
                    (sl.post_id IS NOT NULL)  AS is_liked,
                    (sr.post_id IS NOT NULL)  AS is_reposted,
                    (vc.post_id IS NOT NULL)  AS is_commented,
                    (sp.save_id IS NOT NULL)  AS is_saved,
                    COALESCE(sca.collection_ids, '[]'::json) AS saved_to_collections,
                    EXISTS(
                        SELECT 1 FROM social_follows f
                        WHERE f.follower_id = $1 AND f.following_id = p.user_id AND f.status = 'accepted'
                    ) AS is_following
                FROM social_posts p
                JOIN users u ON u.user_id = p.user_id
                LEFT JOIN post_media pm  ON pm.post_id  = p.post_id
                LEFT JOIN social_posts op  ON op.post_id = p.original_post_id
                LEFT JOIN users ou         ON ou.user_id = op.user_id
                LEFT JOIN post_media opm   ON opm.post_id = op.post_id
                LEFT JOIN social_likes  sl ON sl.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sl.user_id = $1
                LEFT JOIN social_reposts sr ON sr.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sr.user_id = $1
                LEFT JOIN saved_posts sp ON sp.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sp.user_id = $1
                LEFT JOIN tagged_pets_agg tpa ON tpa.post_id = p.post_id
                LEFT JOIN saved_collections_agg sca ON sca.save_id = sp.save_id
                LEFT JOIN viewer_comments vc ON vc.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END
                WHERE p.is_deleted = false AND (p.is_hidden = false OR p.user_id = $1)
                AND NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                       OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                )
                AND (p.user_id = $1 OR u.is_private = false OR EXISTS (
                    SELECT 1 FROM social_follows f WHERE f.follower_id = $1 AND f.following_id = p.user_id AND f.status = 'accepted'
                ))
                ${shadowHiddenFilter('$1')}
                ${originalPostVisibilityFilter('$1')}
                AND NOT EXISTS (
                    SELECT 1 FROM hidden_posts hp WHERE hp.user_id = $1 AND hp.post_id = p.post_id
                )
                ${quarantineFilter}
                ${!isGlobal && userId ? `AND (
                    p.user_id = $1
                    OR p.user_id IN (SELECT following_id FROM social_follows WHERE follower_id = $1 AND status = 'accepted')
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
                    SELECT following_id FROM social_follows WHERE follower_id = $1 AND status = 'accepted'
                ),
                post_media AS (
                    SELECT post_id, json_agg(m ORDER BY m.ordering) AS media
                    FROM social_post_media m
                    GROUP BY post_id
                ),
                ${TAGGED_PETS_AGG_CTE},
                ${SAVED_COLLECTIONS_AGG_CTE},
                ${VIEWER_COMMENTS_CTE},
                scored AS (
                    SELECT
                        p.*,
                        u.name               AS author_name,
                        u.profile_image_url  AS author_image,
                        u.social_username,
                        u.verified     AS author_verified,
                        u.founding_club AS author_founding_club,
                        u.is_private   AS author_is_private,
                        false                AS is_blocked_by_me,
                        false                AS is_blocking_me,
                        COALESCE(pm.media, '[]'::json)  AS media,
                        COALESCE(tpa.tagged_pets, '[]'::json) AS tagged_pets,
                        op.content           AS original_content,
                        op.user_id           AS original_user_id,
                        ou.name              AS original_author_name,
                        ou.social_username   AS original_social_username,
                        ou.verified   AS original_author_verified,
                        ou.founding_club AS original_author_founding_club,
                        ou.profile_image_url AS original_author_image,
                        ou.is_private AS original_author_is_private,
                        false                AS original_author_is_blocked_by_me,
                        false                AS original_author_is_blocking_me,
                        ${originalPostAccessibleExpr('$1')} AS original_available,
                        COALESCE(opm.media, '[]'::json) AS original_media,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.like_count    ELSE p.like_count    END AS like_count,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.comment_count ELSE p.comment_count END AS comment_count,
                        CASE WHEN p.is_repost AND p.content IS NULL THEN op.view_count    ELSE p.view_count    END AS view_count,
                        (sl.post_id IS NOT NULL)  AS is_liked,
                        (sr.post_id IS NOT NULL)  AS is_reposted,
                        (vc.post_id IS NOT NULL)  AS is_commented,
                        (sp.save_id IS NOT NULL)  AS is_saved,
                        COALESCE(sca.collection_ids, '[]'::json) AS saved_to_collections,
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
                    LEFT JOIN social_likes   sl ON sl.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sl.user_id = $1
                    LEFT JOIN social_reposts sr ON sr.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sr.user_id = $1
                    LEFT JOIN saved_posts sp ON sp.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sp.user_id = $1
                    LEFT JOIN tagged_pets_agg tpa ON tpa.post_id = p.post_id
                    LEFT JOIN saved_collections_agg sca ON sca.save_id = sp.save_id
                    LEFT JOIN viewer_comments vc ON vc.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END
                    WHERE p.is_deleted = false AND (p.is_hidden = false OR p.user_id = $1)
                    AND NOT EXISTS (
                        SELECT 1 FROM user_blocks b
                        WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                           OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
                    )
                    AND (p.user_id = $1 OR u.is_private = false OR fs.following_id IS NOT NULL)
                    ${shadowHiddenFilter('$1')}
                    ${originalPostVisibilityFilter('$1')}
                    AND NOT EXISTS (
                        SELECT 1 FROM hidden_posts hp WHERE hp.user_id = $1 AND hp.post_id = p.post_id
                    )
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
        redactUnavailableOriginals(posts);
        // Never let the shadow-hide flag reach the app — an author who could
        // see it would know their post had been moderated.
        redactModerationFields(posts);

        // Cursor = next offset (null when we got fewer rows than requested)
        const nextCursor = posts.length === limit ? String(offset + limit) : null;
        const viewerIdNum = userId ? parseInt(String(userId), 10) : null;
        const postsWithInjections = await interleaveFeedInjections(posts, viewerIdNum, offset, coords);
        const postsWithSurfaced = await maybeInjectSurfacedComment(parseInt(String(viewerId), 10), offset, postsWithInjections);

        return NextResponse.json({
            posts: postsWithSurfaced,
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

        const suspendedCheck = await db.query('SELECT is_suspended FROM users WHERE user_id = $1', [userId]);
        if (suspendedCheck.rows[0]?.is_suspended) {
            return NextResponse.json({ error: "This account has been suspended for violating our Community Guidelines." }, { status: 403 });
        }

        const body = await req.json();
        const { post_type, content, media = [], pet_profile_tags = [] } = body;

        if (!post_type || (!content && media.length === 0)) {
            return NextResponse.json({ error: "Post content or media is required" }, { status: 400 });
        }

        const mediaError = validateSocialMediaPayload(media);
        if (mediaError) {
            return NextResponse.json({ error: mediaError }, { status: 400 });
        }

        let parsedMentions: ParsedMention[] = [];

        // Auto-moderation: a SEVERE match (slurs — see lib/moderation/badWords.ts)
        // REDACTS the post rather than shadow-hiding it. The post stays visible
        // and fans out normally; only the offending word is covered (grey chip,
        // rendered by the client from the marker lib/moderationRedaction.ts
        // substitutes on read). Mirrors the comment path, where hiding outright
        // would break the reply tree. MILD matches are a client-side nudge only
        // and never affect the server.
        //
        // Full shadow-hide stays available to admins via the moderate endpoint
        // for posts where covering a word isn't enough.
        const autoRedact = content ? hasSevereMatch(content) : false;
        // Raw text is stored (admins review the original; restoring to 'none'
        // must bring the real wording back); everything leaving this request
        // uses the censored copy.
        const publicContent = autoRedact ? redactSevereWords(content) : content;

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            // 1. Create Post
            const postRes = await client.query(`
                INSERT INTO social_posts (user_id, post_type, content, moderation_state, is_shadow_hidden)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [userId, post_type, content, autoRedact ? 'redacted' : 'none', false]);
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

            if (autoRedact) {
                // Logged for the admin queue so a human can review the original
                // wording and escalate if covering a word wasn't enough. The
                // post still fans out below — it's visible, just censored.
                db.query(
                    `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
                     VALUES (NULL, 'auto_redact:severe_word_match', $1, 'successful')`,
                    [`post:${post.post_id}`]
                ).catch(() => {});
            }

            // Fan-out to follower feed caches (fire and forget — non-blocking)
            fanOutPostToFollowers(post.post_id, userId, post.created_at, db)
                .catch(() => {}); // never block the response

            // Notify mentioned users/pet-owners (fire and forget — non-blocking).
            if (parsedMentions.length > 0) {
                const authorRes = await db.query(`SELECT name FROM users WHERE user_id = $1`, [userId]);
                notifyNewMentions(parsedMentions, {
                    mentionerId: userId,
                    mentionerName: authorRes.rows[0]?.name || 'User',
                    postId: Number(post.post_id),
                    isComment: false,
                    postImageUrl: media[0]?.url,
                    preview: publicContent,
                }).catch(() => {});
            }

            // Return post + media[] so the mobile app can read media_id for the
            // MediaConvert confirm step (confirmVideoUpload needs media_id).
            // Censored in place when redacted, and carries moderation_state so
            // the composer can warn the author their wording was covered.
            const responsePost = { ...post, media: insertedMedia };
            redactModerationFields(responsePost);
            return NextResponse.json(responsePost, { status: 201 });

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
