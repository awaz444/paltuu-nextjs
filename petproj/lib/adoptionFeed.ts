/**
 * Adoption feed ranking (PALTU-102).
 *
 * Strict newest-first buried every listing within a few days at current volume.
 * Instead each page interleaves two pools in a fixed F F O F F O … pattern:
 *
 *   F (fresh): listed or renewed within FRESH_DAYS, newest first.
 *   O (older): everything else, in a pseudo-random order reshuffled once a day
 *              (seeded by pet_id + current_date), so every older pet gets
 *              page-1 time over the course of a week.
 *
 * The order is deterministic within a day, so paging through doesn't repeat or
 * skip pets. When one pool runs out the other simply continues.
 *
 * "Listed" means COALESCE(bumped_at, created_at): an owner confirming the pet is
 * still available puts it back in the fresh pool.
 */

export const ADOPTION_FRESH_DAYS = 3;

/** After this long without a renewal the owner is asked "still available?". */
export const AVAILABILITY_CHECK_AFTER_DAYS = 14;

/** If the owner doesn't answer the check within this long, the listing is paused. */
export const AVAILABILITY_GRACE_DAYS = 7;

/**
 * ORDER BY body for an available-pets query. `alias` is the pets table alias.
 * Uses window functions, which Postgres evaluates after WHERE/JOIN, so the
 * interleave is computed over the filtered result set.
 */
export function adoptionFeedOrderBy(alias = "pets"): string {
    const listed = `COALESCE(${alias}.bumped_at, ${alias}.created_at)`;
    const fresh = `(${listed} > now() - interval '${ADOPTION_FRESH_DAYS} days')`;
    const rn = `ROW_NUMBER() OVER (
        PARTITION BY ${fresh}
        ORDER BY CASE WHEN ${fresh} THEN ${listed} END DESC NULLS LAST,
                 md5(${alias}.pet_id::text || current_date::text),
                 ${alias}.pet_id
    )`;
    // Fresh rows land on slots 1,2,4,5,7,8…; older rows on 3,6,9… — no ties.
    return `CASE WHEN ${fresh} THEN ${rn} + (${rn} - 1) / 2 ELSE ${rn} * 3 END, ${alias}.pet_id DESC`;
}
