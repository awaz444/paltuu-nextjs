import { COMMUNITY_SPECIES, findSpecies, speciesByKey } from "@/lib/community";

/**
 * Direct forum placement (PALTU-97), stored in `post_forums`.
 *
 * A post is in a forum through any of: a species content tag, a tagged pet's
 * breed (both in lib/community.ts), or a post_forums row. The row's `source`
 * sets precedence: an admin row overrides everything else; an author row
 * (posted from inside a forum) beats an auto row; auto rows come from the text.
 */

type Queryable = { query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number | null }> };

export type ForumSource = "admin" | "author" | "auto";
export type ForumPlacement = { species: string; breedId: number | null };

const RANK: Record<ForumSource, number> = { auto: 1, author: 2, admin: 3 };
const rankSql = (col: string) => `CASE ${col} WHEN 'admin' THEN 3 WHEN 'author' THEN 2 ELSE 1 END`;

/** Breeds that are their own forum: what the /<species>/<breed> pages list. */
const FORUM_BREEDS_SQL = `
    SELECT b.breed_id, b.slug, b.name, b.kind, b.aliases, LOWER(pc.category_name) AS species
      FROM breeds b
      JOIN pet_category pc ON pc.category_id = b.category_id
     WHERE b.kind IN ('breed', 'street', 'mixed') AND b.parent_breed_id IS NULL AND b.is_active`;

export type ForumOption = { species: string; key: string; speciesName: string; breeds: { slug: string; name: string }[] };

/** Every forum a post can be placed in, for pickers. */
export async function listForumOptions(q: Queryable): Promise<ForumOption[]> {
    const res = await q.query(`${FORUM_BREEDS_SQL} ORDER BY b.sort_order, b.name`);
    return COMMUNITY_SPECIES.map((s) => ({
        species: s.slug,
        key: s.key,
        speciesName: s.name,
        breeds: s.hasBreeds
            ? res.rows.filter((r) => r.species === s.key).map((r) => ({ slug: r.slug, name: r.name }))
            : [],
    }));
}

/** Resolve a forum given as a species slug ("cats") and an optional breed slug ("siamese"). */
export async function resolveForum(
    q: Queryable,
    input: { species?: unknown; breed?: unknown }
): Promise<ForumPlacement | null> {
    const species = typeof input.species === "string" ? findSpecies(input.species) ?? speciesByKey(input.species) : undefined;
    if (!species) return null;
    if (input.breed == null || input.breed === "") return { species: species.key, breedId: null };
    if (typeof input.breed !== "string" || !species.hasBreeds) return null;
    const res = await q.query(`${FORUM_BREEDS_SQL} AND LOWER(pc.category_name) = $1 AND b.slug = $2 LIMIT 1`, [
        species.key,
        input.breed.toLowerCase(),
    ]);
    return res.rows[0] ? { species: species.key, breedId: res.rows[0].breed_id } : null;
}

const normalize = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

/**
 * Breed names and aliases that are ordinary words in posts ("trying to bully
 * him", "golden hour", cats yelling at pigeons). Fine in breed pickers, too
 * loose for reading free text.
 */
const NOT_A_BREED_IN_TEXT = new Set(["bully", "golden", "pigeon", "pigeons", "kabutar"]);

/**
 * The forum a post's text is clearly about: exactly one named breed, by name
 * or alias. Only real breeds count. Street/mixed aliases ("local", "orange",
 * "desi") are everyday words, so those forums need the full name ("street cat").
 * Two different breeds named, or none: no placement.
 */
export async function inferForum(q: Queryable, text: string | null | undefined): Promise<ForumPlacement | null> {
    if (!text) return null;
    const haystack = normalize(text);
    const res = await q.query(FORUM_BREEDS_SQL);
    const hits = new Map<number, string>();
    for (const r of res.rows) {
        if (!speciesByKey(r.species)?.hasBreeds) continue;
        const terms = r.kind === "breed" ? [r.name, ...(r.aliases ?? [])] : [r.name];
        const named = terms
            .map((t: string) => normalize(t))
            .some((t: string) => t.trim().length >= 4 && !NOT_A_BREED_IN_TEXT.has(t.trim()) && haystack.includes(t));
        if (named) hits.set(r.breed_id, r.species);
    }
    if (hits.size !== 1) return null;
    const [[breedId, species]] = Array.from(hits.entries());
    return { species, breedId };
}

/**
 * Place a post. A lower-precedence source never replaces a higher one, so an
 * auto guess can't undo an admin's move. Returns whether the row was written.
 */
export async function setPostForum(
    q: Queryable,
    postId: number | string,
    placement: ForumPlacement,
    source: ForumSource,
    setBy: number | null
): Promise<boolean> {
    if (!(source in RANK)) throw new Error(`Unknown forum source ${source}`);
    const res = await q.query(
        `INSERT INTO post_forums (post_id, species, breed_id, source, set_by, set_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (post_id) DO UPDATE
            SET species = EXCLUDED.species, breed_id = EXCLUDED.breed_id, source = EXCLUDED.source,
                set_by = EXCLUDED.set_by, set_at = NOW()
          WHERE ${rankSql("EXCLUDED.source")} >= ${rankSql("post_forums.source")}`,
        [postId, placement.species, placement.breedId, source, setBy]
    );
    return (res.rowCount ?? 0) > 0;
}

/** Remove a post's direct placement; it falls back to pet-tag and species-tag placement. */
export async function clearPostForum(q: Queryable, postId: number | string): Promise<void> {
    await q.query(`DELETE FROM post_forums WHERE post_id = $1`, [postId]);
}
