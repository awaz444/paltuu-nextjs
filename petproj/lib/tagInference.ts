/**
 * Phase 1 — read-time tag inference for personalized feed affinity.
 *
 * When a post has no admin-assigned primary content tags, we infer tags from:
 *   1. Pet species (post_pet_tags → pet_profiles.species)
 *   2. Hashtags (post_hashtags → content_tags slug/label/aliases)
 *   3. Caption keywords (content text vs content_tags.keyword_aliases)
 *
 * Inferred affinity is discounted vs admin tags (see INFERRED_AFFINITY_MULTIPLIER).
 * Nothing is written to post_content_tags — Phase 2 will persist auto tags.
 */

/** Discount applied to inferred-tag affinity in the personalized feed SQL. */
export const INFERRED_AFFINITY_MULTIPLIER = 0.5;

export interface ContentTagRow {
  tag_id: number;
  slug: string;
  label: string;
  category: string;
  keyword_aliases?: string[];
}

export function normalizeToken(value: string): string {
  return value.toLowerCase().trim().replace(/^#+/, '');
}

/** Mirrors the admin tagging-queue hashtag click matcher. */
export function matchHashtagToTag(
  hashtag: string,
  tags: ContentTagRow[]
): ContentTagRow | undefined {
  const needle = normalizeToken(hashtag);
  if (!needle) return undefined;
  return (
    tags.find((t) => t.slug === needle) ??
    tags.find((t) => t.label.toLowerCase() === needle) ??
    tags.find(
      (t) =>
        needle.length >= 3 &&
        (t.slug.includes(needle) || needle.includes(t.slug))
    ) ??
    tags.find((t) =>
      (t.keyword_aliases ?? []).some((a) => normalizeToken(a) === needle)
    )
  );
}

/** Map a pet profile species string to a species-category content tag. */
export function matchSpeciesToTag(
  species: string,
  tags: ContentTagRow[]
): ContentTagRow | undefined {
  const normalized = normalizeToken(species);
  const slugNeedle = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const speciesTags = tags.filter((t) => t.category === 'species');
  return (
    speciesTags.find((t) => t.slug === slugNeedle) ??
    speciesTags.find((t) => t.label.toLowerCase() === normalized) ??
    speciesTags.find((t) =>
      (t.keyword_aliases ?? []).some((a) => normalizeToken(a) === normalized)
    )
  );
}

/** Return tags whose keyword_aliases appear in post caption (min 3 chars). */
export function matchKeywordsInContent(
  content: string,
  tags: ContentTagRow[],
  max = 3
): ContentTagRow[] {
  const lower = content.toLowerCase();
  const hits: ContentTagRow[] = [];
  for (const tag of tags) {
    if (hits.length >= max) break;
    const matched = (tag.keyword_aliases ?? []).some(
      (alias) => alias.length >= 3 && lower.includes(alias.toLowerCase())
    );
    if (matched) hits.push(tag);
  }
  return hits;
}

/**
 * SQL CTEs for personalized-feed affinity: admin tags first, then inferred
 * fallback at a reduced weight ($6 = INFERRED_AFFINITY_MULTIPLIER).
 */
export function personalizedAffinityCtes(): string {
  return `
                posts_with_admin_primary AS (
                    SELECT DISTINCT post_id
                    FROM post_content_tags
                    WHERE role = 'primary'
                ),
                inferred_tag_candidates AS (
                    -- Pet species (highest priority)
                    SELECT ppt.post_id, ct.tag_id, 1 AS src_priority
                    FROM post_pet_tags ppt
                    JOIN pet_profiles pp ON pp.pet_profile_id = ppt.pet_profile_id
                    JOIN content_tags ct ON ct.is_active = true AND ct.category = 'species'
                    WHERE NOT EXISTS (
                        SELECT 1 FROM posts_with_admin_primary ap WHERE ap.post_id = ppt.post_id
                    )
                    AND (
                        ct.slug = lower(regexp_replace(trim(pp.species), '[^a-zA-Z0-9]+', '-', 'g'))
                        OR lower(ct.label) = lower(trim(pp.species))
                        OR EXISTS (
                            SELECT 1 FROM unnest(ct.keyword_aliases) AS alias(val)
                            WHERE lower(val) = lower(trim(pp.species))
                        )
                    )

                    UNION ALL

                    -- Hashtags
                    SELECT ph.post_id, ct.tag_id, 2 AS src_priority
                    FROM post_hashtags ph
                    JOIN hashtags h ON h.hashtag_id = ph.hashtag_id
                    JOIN content_tags ct ON ct.is_active = true
                    WHERE NOT EXISTS (
                        SELECT 1 FROM posts_with_admin_primary ap WHERE ap.post_id = ph.post_id
                    )
                    AND (
                        ct.slug = lower(regexp_replace(trim(both '#' from h.tag), '[^a-zA-Z0-9]+', '-', 'g'))
                        OR lower(ct.label) = lower(trim(both '#' from h.tag))
                        OR EXISTS (
                            SELECT 1 FROM unnest(ct.keyword_aliases) AS alias(val)
                            WHERE lower(val) = lower(trim(both '#' from h.tag))
                        )
                        OR (
                            length(lower(trim(both '#' from h.tag))) >= 3
                            AND (
                                position(lower(trim(both '#' from h.tag)) in ct.slug) > 0
                                OR position(ct.slug in lower(trim(both '#' from h.tag))) > 0
                            )
                        )
                    )

                    UNION ALL

                    -- Caption keyword_aliases (lowest priority)
                    SELECT p.post_id, ct.tag_id, 3 AS src_priority
                    FROM social_posts p
                    JOIN content_tags ct ON ct.is_active = true
                    WHERE NOT EXISTS (
                        SELECT 1 FROM posts_with_admin_primary ap WHERE ap.post_id = p.post_id
                    )
                    AND COALESCE(p.content, '') <> ''
                    AND EXISTS (
                        SELECT 1 FROM unnest(ct.keyword_aliases) AS alias(val)
                        WHERE length(val) >= 3
                          AND lower(p.content) LIKE '%' || lower(val) || '%'
                    )
                ),
                inferred_primary_tags AS (
                    SELECT post_id, tag_id
                    FROM (
                        SELECT
                            post_id,
                            tag_id,
                            ROW_NUMBER() OVER (
                                PARTITION BY post_id
                                ORDER BY src_priority ASC, tag_id ASC
                            ) AS rn
                        FROM inferred_tag_candidates
                    ) ranked
                    WHERE rn <= 3
                ),
                admin_affinity AS (
                    SELECT
                        pct.post_id,
                        AVG(uis.score) AS avg_primary_interest,
                        COUNT(*)::int AS primary_count
                    FROM post_content_tags pct
                    LEFT JOIN user_interest_scores uis
                        ON uis.tag_id = pct.tag_id AND uis.user_id = $1
                    WHERE pct.role = 'primary'
                    GROUP BY pct.post_id
                    HAVING COUNT(*) BETWEEN 1 AND 3
                ),
                inferred_affinity AS (
                    SELECT
                        ipt.post_id,
                        AVG(uis.score) AS avg_primary_interest,
                        COUNT(*)::int AS primary_count
                    FROM inferred_primary_tags ipt
                    LEFT JOIN user_interest_scores uis
                        ON uis.tag_id = ipt.tag_id AND uis.user_id = $1
                    GROUP BY ipt.post_id
                    HAVING COUNT(*) BETWEEN 1 AND 3
                ),
                post_affinity AS (
                    SELECT post_id, avg_primary_interest, primary_count
                    FROM admin_affinity
                    UNION ALL
                    SELECT
                        ia.post_id,
                        ia.avg_primary_interest * $6::double precision,
                        ia.primary_count
                    FROM inferred_affinity ia
                    WHERE NOT EXISTS (
                        SELECT 1 FROM admin_affinity aa WHERE aa.post_id = ia.post_id
                    )
                )`;
}
