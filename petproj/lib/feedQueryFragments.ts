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
 * True when the viewer currently has access to the original post a repost/
 * quote points at: no original at all, the viewer IS the original author, the
 * original author is public, or the viewer follows them (accepted). This is
 * evaluated live on every read against the original author's CURRENT
 * is_private flag — not the flag's value at repost time — so a repost of a
 * once-public post correctly loses visibility if that author later goes
 * private, without needing to touch the repost row itself.
 *
 * Requires `op`/`ou` (LEFT JOIN social_posts/users on p.original_post_id) and
 * `p` to be in scope. `viewerParam` is the bound param placeholder for the
 * viewer id (callers differ: most use $1, profile routes use $2).
 */
export function originalPostAccessibleExpr(viewerParam: string = '$1'): string {
    return `(
        p.original_post_id IS NULL
        OR op.user_id = ${viewerParam}
        OR ou.is_private = false
        OR EXISTS (
            SELECT 1 FROM social_follows f
            WHERE f.follower_id = ${viewerParam} AND f.following_id = op.user_id AND f.status = 'accepted'
        )
    )`;
}

/**
 * WHERE-clause fragment enforcing original-post visibility, with one
 * carve-out: the reposting user (p.user_id = viewer) always keeps their own
 * repost row even once the original becomes inaccessible, so their profile
 * doesn't silently lose the entry — the row is redacted instead (see
 * redactUnavailableOriginals) and rendered as a placeholder client-side.
 * Blocks are NOT carved out — a block from either side still fully hides
 * the row, even from the reposting user.
 */
export function originalPostVisibilityFilter(viewerParam: string = '$1'): string {
    return `AND (p.original_post_id IS NULL OR (
        NOT EXISTS (
            SELECT 1 FROM user_blocks b
            WHERE (b.blocker_id = ${viewerParam} AND b.blocked_id = op.user_id)
               OR (b.blocker_id = op.user_id AND b.blocked_id = ${viewerParam})
        )
        AND (${originalPostAccessibleExpr(viewerParam)} OR p.user_id = ${viewerParam})
    ))`;
}

/**
 * Strips the original-post fields from rows kept only via the reposting-user
 * carve-out above (original_available = false) — the reposting user can see
 * that they reposted something, but not the now-inaccessible content itself.
 * Mutates and returns the same array.
 */
export function redactUnavailableOriginals(rows: any[]): any[] {
    for (const row of rows) {
        if (row.original_post_id && row.original_available === false) {
            const isPlainRepost = row.is_repost && (row.content === null || row.content === undefined);
            row.original_content = null;
            row.original_media = [];
            row.original_author_name = null;
            row.original_social_username = null;
            row.original_author_verified = null;
            row.original_author_founding_club = null;
            row.original_author_image = null;
            if (isPlainRepost) {
                row.like_count = 0;
                row.comment_count = 0;
                row.view_count = 0;
            }
        }
    }
    return rows;
}

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
        u.is_private         AS author_is_private,
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
        ou.is_private        AS original_author_is_private,
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
      ${originalPostVisibilityFilter('$1')}
      AND NOT EXISTS (
          SELECT 1 FROM hidden_posts hp WHERE hp.user_id = $1 AND hp.post_id = p.post_id
      )
`;
