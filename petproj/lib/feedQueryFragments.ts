/**
 * Shared CTE fragments used by the feed (personalized/chronological/algorithmic)
 * and profile post queries. Replaces per-row correlated subqueries with a single
 * pre-aggregated CTE joined once via LEFT JOIN, so the cost is paid once per
 * query instead of once per output row.
 *
 * viewer_comments is scoped to $1 (the viewer id) — every caller must bind $1
 * to the viewer's user id, matching the existing convention in these queries.
 */

export const TAGGED_PETS_AGG_CTE = `tagged_pets_agg AS (
    SELECT ppt.post_id,
           json_agg(json_build_object(
               'pet_profile_id', pp.pet_profile_id,
               'name', pp.name,
               'avatar_url', pp.avatar_url,
               'species', pp.species
           )) AS tagged_pets
    FROM post_pet_tags ppt
    JOIN pet_profiles pp ON pp.pet_profile_id = ppt.pet_profile_id
    GROUP BY ppt.post_id
)`;

export const SAVED_COLLECTIONS_AGG_CTE = `saved_collections_agg AS (
    SELECT cp.save_id,
           json_agg(sc.collection_id) AS collection_ids
    FROM collection_posts cp
    JOIN save_collections sc ON sc.collection_id = cp.collection_id
    GROUP BY cp.save_id
)`;

export const VIEWER_COMMENTS_CTE = `viewer_comments AS (
    SELECT DISTINCT post_id FROM social_comments WHERE user_id = $1 AND is_deleted = false
)`;

/**
 * Batched row-hydration query for a known list of post IDs (e.g. IDs pulled
 * from the Redis feed:{userId} ZSET on a cache hit). Re-applies the same
 * visibility filters (deleted/hidden/blocked) as the live chronological feed
 * query so a post that became invisible after being cached is correctly
 * dropped rather than served stale. $1 = viewer id, $2 = post id array.
 */
export const HYDRATE_POSTS_BY_IDS_QUERY = `
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
        u.verified           AS author_verified,
        false                AS is_blocked_by_me,
        false                AS is_blocking_me,
        COALESCE(pm.media, '[]'::json)  AS media,
        COALESCE(tpa.tagged_pets, '[]'::json) AS tagged_pets,
        op.content           AS original_content,
        op.user_id           AS original_user_id,
        ou.name              AS original_author_name,
        ou.social_username   AS original_social_username,
        ou.verified          AS original_author_verified,
        ou.profile_image_url AS original_author_image,
        false                AS original_author_is_blocked_by_me,
        false                AS original_author_is_blocking_me,
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
    LEFT JOIN post_media opm  ON opm.post_id = op.post_id
    LEFT JOIN social_likes  sl ON sl.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sl.user_id = $1
    LEFT JOIN social_reposts sr ON sr.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sr.user_id = $1
    LEFT JOIN saved_posts sp ON sp.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sp.user_id = $1
    LEFT JOIN tagged_pets_agg tpa ON tpa.post_id = p.post_id
    LEFT JOIN saved_collections_agg sca ON sca.save_id = sp.save_id
    LEFT JOIN viewer_comments vc ON vc.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END
    WHERE p.post_id = ANY($2::bigint[])
      AND p.is_deleted = false AND (p.is_hidden = false OR p.user_id = $1)
      AND NOT EXISTS (
          SELECT 1 FROM user_blocks b
          WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
             OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
      )
      AND (p.user_id = $1 OR u.is_private = false OR EXISTS (
          SELECT 1 FROM social_follows f WHERE f.follower_id = $1 AND f.following_id = p.user_id AND f.status = 'accepted'
      ))
      AND (p.original_post_id IS NULL OR (
          NOT EXISTS (
              SELECT 1 FROM user_blocks b
              WHERE (b.blocker_id = $1 AND b.blocked_id = op.user_id)
                 OR (b.blocker_id = op.user_id AND b.blocked_id = $1)
          )
          AND (op.user_id = $1 OR ou.is_private = false OR EXISTS (
              SELECT 1 FROM social_follows f WHERE f.follower_id = $1 AND f.following_id = op.user_id AND f.status = 'accepted'
          ))
      ))
      AND NOT EXISTS (
          SELECT 1 FROM hidden_posts hp WHERE hp.user_id = $1 AND hp.post_id = p.post_id
      )
`;
