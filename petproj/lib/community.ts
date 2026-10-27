import { db } from "@/db/index";
import { breedGuide, speciesGuide, type CommunityGuide } from "@/lib/breedGuides";

/**
 * Web communities (PALTU-71, scope PALTU-68).
 *
 * There is no communities table. Every species below, and every breed in the
 * `breeds` table (PALTU-70) of kind breed/street/mixed, is a community. Posts
 * are the app's existing social_posts — nothing is copied. A post lands in a
 * community through:
 *   - a species content tag (post_content_tags → content_tags.category='species'), or
 *   - a tagged pet (post_pet_tags → pet_profiles): its breed's species, or its
 *     typed species when it has no breed, and its breed. A child breed
 *     ("Persian mix") counts in its parent's community. "Not sure" and "Other"
 *     place the post at species level only.
 *
 * Only public content is ever shown: see PUBLIC_POST and PUBLIC_COMMENT.
 */

export type CommunitySpecies = {
    slug: string;
    /** content_tags.slug, and the lower-cased pet_category / pet_profiles.species name. */
    key: string;
    name: string;
    singular: string;
    hasBreeds: boolean;
};

export const COMMUNITY_SPECIES: CommunitySpecies[] = [
    { slug: "cats", key: "cat", name: "Cats", singular: "Cat", hasBreeds: true },
    { slug: "dogs", key: "dog", name: "Dogs", singular: "Dog", hasBreeds: true },
    { slug: "birds", key: "bird", name: "Birds", singular: "Bird", hasBreeds: true },
    { slug: "rabbits", key: "rabbit", name: "Rabbits", singular: "Rabbit", hasBreeds: false },
    { slug: "fish", key: "fish", name: "Fish", singular: "Fish", hasBreeds: false },
    { slug: "reptiles", key: "reptile", name: "Reptiles", singular: "Reptile", hasBreeds: false },
];

/** Below this many posts a community page is thin: it renders, but is noindex and kept out of the sitemap. */
export const MIN_POSTS_TO_INDEX = 3;

const FEED_LIMIT = 36;

export function findSpecies(slug: string): CommunitySpecies | undefined {
    return COMMUNITY_SPECIES.find((s) => s.slug === slug.toLowerCase());
}

export function speciesByKey(key: string | null | undefined): CommunitySpecies | undefined {
    if (!key) return undefined;
    return COMMUNITY_SPECIES.find((s) => s.key === key.toLowerCase());
}

// ─── SQL building blocks ─────────────────────────────────────────────────────

/** Visible to everyone in the app's public feed, by an author whose content may be public. */
const PUBLIC_POST = `
    sp.is_deleted = false
    AND COALESCE(sp.is_hidden, false) = false
    AND COALESCE(sp.is_shadow_hidden, false) = false
    AND COALESCE(sp.moderation_state, 'none') = 'none'
    AND COALESCE(sp.is_repost, false) = false
    AND sp.post_type <> 'repost'
    AND COALESCE(sp.has_trigger_warning, false) = false
    AND sp.content_notice_reason IS NULL
    AND (LENGTH(TRIM(COALESCE(sp.content, ''))) > 0
         OR EXISTS (SELECT 1 FROM social_post_media m0 WHERE m0.post_id = sp.post_id AND m0.url IS NOT NULL))
    AND COALESCE(u.is_private, false) = false
    AND COALESCE(u.is_suspended, false) = false`;

const PUBLIC_COMMENT = `
    c.is_deleted = false
    AND COALESCE(c.is_shadow_hidden, false) = false
    AND COALESCE(c.moderation_state, 'none') = 'none'
    AND LENGTH(TRIM(COALESCE(c.content, ''))) > 0
    AND COALESCE(u.is_private, false) = false
    AND COALESCE(u.is_suspended, false) = false`;

const SPECIES_VALUES = COMMUNITY_SPECIES.map((s) => `('${s.slug}', '${s.key}')`).join(", ");

/** CTEs placing posts in communities. Every query below starts with this. */
const PLACEMENT_CTES = `
    species_map(slug, key) AS (VALUES ${SPECIES_VALUES}),
    post_species AS (
        SELECT pct.post_id, sm.slug AS species
          FROM post_content_tags pct
          JOIN content_tags ct ON ct.tag_id = pct.tag_id AND ct.category = 'species'
          JOIN species_map sm ON sm.key = ct.slug
        UNION
        SELECT ppt.post_id, sm.slug AS species
          FROM post_pet_tags ppt
          JOIN pet_profiles pp ON pp.pet_profile_id = ppt.pet_profile_id
          LEFT JOIN breeds b ON b.breed_id = pp.breed_id
          LEFT JOIN pet_category pc ON pc.category_id = b.category_id
          JOIN species_map sm ON sm.key = LOWER(COALESCE(pc.category_name, pp.species))
    ),
    post_breeds AS (
        SELECT DISTINCT ppt.post_id, cb.breed_id, cb.slug, cb.name, sm.slug AS species
          FROM post_pet_tags ppt
          JOIN pet_profiles pp ON pp.pet_profile_id = ppt.pet_profile_id
          JOIN breeds b ON b.breed_id = pp.breed_id
          JOIN breeds cb ON cb.breed_id = COALESCE(b.parent_breed_id, b.breed_id)
          JOIN pet_category pc ON pc.category_id = cb.category_id
          JOIN species_map sm ON sm.key = LOWER(pc.category_name)
         WHERE cb.kind IN ('breed', 'street', 'mixed') AND cb.is_active
    )`;

const POST_COLUMNS = `
    sp.post_id, sp.content, sp.post_type, sp.like_count, sp.comment_count, sp.repost_count, sp.created_at, sp.updated_at,
    u.name AS author_name, u.social_username AS author_username,
    u.profile_image_url AS author_avatar, COALESCE(u.verified, false) AS author_verified,
    (SELECT json_agg(json_build_object('type', m.media_type, 'url', m.url, 'thumb', m.thumbnail_url)
                     ORDER BY m.ordering)
       FROM social_post_media m WHERE m.post_id = sp.post_id AND m.url IS NOT NULL) AS media,
    (SELECT json_agg(DISTINCT ps.species) FROM post_species ps WHERE ps.post_id = sp.post_id) AS species,
    (SELECT json_agg(json_build_object('slug', pb.slug, 'name', pb.name, 'species', pb.species))
       FROM post_breeds pb WHERE pb.post_id = sp.post_id) AS breeds`;

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostMedia = { type: string; url: string; thumb: string | null };
export type PostPlace = { species: string; breedSlug?: string; breedName?: string };

export type CommunityPost = {
    id: number;
    content: string;
    postType: string;
    likeCount: number;
    commentCount: number;
    repostCount: number;
    createdAt: string;
    updatedAt: string;
    author: { name: string; username: string | null; avatar: string | null; verified: boolean };
    media: PostMedia[];
    species: string[];
    breeds: { slug: string; name: string; species: string }[];
};

export type CommunityComment = {
    id: number;
    parentId: number | null;
    rootId: number | null;
    content: string;
    likeCount: number;
    createdAt: string;
    author: { name: string; username: string | null; avatar: string | null; verified: boolean };
    replies: CommunityComment[];
};

export type BreedCommunity = {
    breedId: number;
    slug: string;
    name: string;
    communityName: string;
    postCount: number;
};

/** The app stores mentions as {@}[name](user:123) / {@}[name](pet:9). Show them as @name. */
export function renderMentions(text: string | null | undefined): string {
    return (text ?? "").replace(/\{([@#])\}\[([^\]]+)\]\((?:user|pet|tag|hashtag):\d+\)/g, "$1$2").trim();
}

function toPost(r: any): CommunityPost {
    return {
        id: Number(r.post_id),
        content: renderMentions(r.content),
        postType: r.post_type,
        likeCount: r.like_count ?? 0,
        commentCount: r.comment_count ?? 0,
        repostCount: r.repost_count ?? 0,
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at ?? r.created_at).toISOString(),
        author: {
            name: r.author_name || r.author_username || "Paltuu member",
            username: r.author_username || null,
            avatar: r.author_avatar || null,
            verified: Boolean(r.author_verified),
        },
        media: (r.media ?? []).filter((m: PostMedia) => m && m.url),
        species: r.species ?? [],
        breeds: r.breeds ?? [],
    };
}

// ─── Feeds ───────────────────────────────────────────────────────────────────

type FeedFilter = { species?: string; breedId?: number; excludePostId?: number; limit?: number; requireMedia?: boolean };

/**
 * Latest public posts, optionally limited to one community. Listing pages are
 * statically generated, so a DB failure degrades to an empty feed rather than
 * failing the build (same rule as lib/recentPets.ts).
 */
export async function listCommunityPosts(filter: FeedFilter = {}): Promise<CommunityPost[]> {
    const conds: string[] = [PUBLIC_POST];
    const vals: any[] = [];
    if (filter.species) {
        vals.push(filter.species);
        conds.push(`EXISTS (SELECT 1 FROM post_species ps WHERE ps.post_id = sp.post_id AND ps.species = $${vals.length})`);
    }
    if (filter.breedId) {
        vals.push(filter.breedId);
        conds.push(`EXISTS (SELECT 1 FROM post_breeds pb WHERE pb.post_id = sp.post_id AND pb.breed_id = $${vals.length})`);
    }
    if (filter.requireMedia) {
        conds.push(`EXISTS (SELECT 1 FROM social_post_media m1 WHERE m1.post_id = sp.post_id AND m1.url IS NOT NULL)`);
    }
    if (filter.excludePostId) {
        vals.push(filter.excludePostId);
        conds.push(`sp.post_id <> $${vals.length}`);
    }
    vals.push(filter.limit ?? FEED_LIMIT);

    try {
        const res = await db.query(
            `WITH ${PLACEMENT_CTES}
             SELECT ${POST_COLUMNS}
               FROM social_posts sp
               JOIN users u ON u.user_id = sp.user_id
              WHERE ${conds.join(" AND ")}
              ORDER BY sp.created_at DESC
              LIMIT $${vals.length}`,
            vals
        );
        return res.rows.map(toPost);
    } catch (e) {
        console.error("community: listCommunityPosts failed", e);
        return [];
    }
}

/** Public post counts per species slug. */
export async function getSpeciesCounts(): Promise<Record<string, number>> {
    try {
        const res = await db.query(
            `WITH ${PLACEMENT_CTES}
             SELECT ps.species, COUNT(DISTINCT sp.post_id)::int AS n
               FROM social_posts sp
               JOIN users u ON u.user_id = sp.user_id
               JOIN post_species ps ON ps.post_id = sp.post_id
              WHERE ${PUBLIC_POST}
              GROUP BY ps.species`
        );
        return Object.fromEntries(res.rows.map((r) => [r.species, r.n]));
    } catch (e) {
        console.error("community: getSpeciesCounts failed", e);
        return {};
    }
}

export async function getTotalPublicPosts(): Promise<number> {
    try {
        const res = await db.query(
            `SELECT COUNT(*)::int AS n FROM social_posts sp JOIN users u ON u.user_id = sp.user_id WHERE ${PUBLIC_POST}`
        );
        return res.rows[0]?.n ?? 0;
    } catch (e) {
        console.error("community: getTotalPublicPosts failed", e);
        return 0;
    }
}

/**
 * The breed communities of one species, in the breed list's order, with public
 * post counts. Child breeds (mixes) are folded into their parent.
 */
export async function getBreedCommunities(species: CommunitySpecies): Promise<BreedCommunity[]> {
    if (!species.hasBreeds) return [];
    try {
        const res = await db.query(
            `WITH ${PLACEMENT_CTES},
             counts AS (
                SELECT pb.breed_id, COUNT(DISTINCT sp.post_id)::int AS n
                  FROM social_posts sp
                  JOIN users u ON u.user_id = sp.user_id
                  JOIN post_breeds pb ON pb.post_id = sp.post_id
                 WHERE ${PUBLIC_POST}
                 GROUP BY pb.breed_id
             )
             SELECT b.breed_id, b.slug, b.name, COALESCE(counts.n, 0) AS n
               FROM breeds b
               JOIN pet_category pc ON pc.category_id = b.category_id
               LEFT JOIN counts ON counts.breed_id = b.breed_id
              WHERE LOWER(pc.category_name) = $1
                AND b.kind IN ('breed', 'street', 'mixed')
                AND b.parent_breed_id IS NULL
                AND b.is_active
              ORDER BY b.sort_order, b.name`,
            [species.key]
        );
        return res.rows.map((r) => ({
            breedId: r.breed_id,
            slug: r.slug,
            name: r.name,
            communityName: breedGuide(species.slug, r.slug, r.name, species.name).communityName ?? r.name,
            postCount: r.n,
        }));
    } catch (e) {
        console.error("community: getBreedCommunities failed", e);
        return [];
    }
}

export type BreedLookup =
    | { kind: "community"; community: BreedCommunity }
    | { kind: "child"; parentSlug: string }
    | null;

/** Resolve a breed slug within a species. A child breed resolves to its parent so the route can redirect. */
export async function findBreed(species: CommunitySpecies, breedSlug: string): Promise<BreedLookup> {
    if (!species.hasBreeds) return null;
    const res = await db.query(
        `SELECT b.breed_id, b.slug, b.name, b.kind, p.slug AS parent_slug
           FROM breeds b
           JOIN pet_category pc ON pc.category_id = b.category_id
           LEFT JOIN breeds p ON p.breed_id = b.parent_breed_id
          WHERE LOWER(pc.category_name) = $1 AND b.slug = $2 AND b.is_active
          LIMIT 1`,
        [species.key, breedSlug.toLowerCase()]
    );
    const row = res.rows[0];
    if (!row) return null;
    if (row.parent_slug) return { kind: "child", parentSlug: row.parent_slug };
    if (!["breed", "street", "mixed"].includes(row.kind)) return null;

    const communities = await getBreedCommunities(species);
    const community = communities.find((c) => c.breedId === row.breed_id);
    return community ? { kind: "community", community } : null;
}

// ─── Single post ─────────────────────────────────────────────────────────────

/** A single public post, or null. Throws on DB errors so ISR keeps serving the last good page. */
export async function getCommunityPost(postId: number): Promise<CommunityPost | null> {
    const res = await db.query(
        `WITH ${PLACEMENT_CTES}
         SELECT ${POST_COLUMNS}
           FROM social_posts sp
           JOIN users u ON u.user_id = sp.user_id
          WHERE sp.post_id = $1 AND ${PUBLIC_POST}
          LIMIT 1`,
        [postId]
    );
    return res.rows[0] ? toPost(res.rows[0]) : null;
}

/** Public comments, threaded under their root. Replies whose root isn't public are dropped. */
export async function getCommunityComments(postId: number): Promise<CommunityComment[]> {
    const res = await db.query(
        `SELECT c.comment_id, c.parent_comment_id, c.root_comment_id, c.content, c.like_count, c.created_at,
                u.name AS author_name, u.social_username AS author_username,
                u.profile_image_url AS author_avatar, COALESCE(u.verified, false) AS author_verified
           FROM social_comments c
           JOIN users u ON u.user_id = c.user_id
          WHERE c.post_id = $1 AND ${PUBLIC_COMMENT}
          ORDER BY c.created_at ASC
          LIMIT 300`,
        [postId]
    );

    const all: CommunityComment[] = res.rows.map((r) => ({
        id: Number(r.comment_id),
        parentId: r.parent_comment_id ? Number(r.parent_comment_id) : null,
        rootId: r.root_comment_id ? Number(r.root_comment_id) : null,
        content: renderMentions(r.content),
        likeCount: r.like_count ?? 0,
        createdAt: new Date(r.created_at).toISOString(),
        author: {
            name: r.author_name || r.author_username || "Paltuu member",
            username: r.author_username || null,
            avatar: r.author_avatar || null,
            verified: Boolean(r.author_verified),
        },
        replies: [],
    }));

    const roots = all.filter((c) => !c.parentId);
    const byId = new Map(roots.map((c) => [c.id, c]));
    for (const c of all) {
        if (!c.parentId) continue;
        const root = byId.get(c.rootId ?? c.parentId);
        if (root) root.replies.push(c);
    }
    return roots;
}

// ─── Presentation helpers ────────────────────────────────────────────────────

/** Where a post lives: its first breed community, else its first species. */
export function primaryPlace(post: CommunityPost): PostPlace | null {
    const breed = post.breeds[0];
    if (breed) return { species: breed.species, breedSlug: breed.slug, breedName: breed.name };
    const species = post.species.find((s) => findSpecies(s));
    return species ? { species } : null;
}

export function placeHref(place: PostPlace): string {
    return place.breedSlug ? `/${place.species}/${place.breedSlug}` : `/${place.species}`;
}

export function placeLabel(place: PostPlace): string {
    const species = findSpecies(place.species);
    if (place.breedSlug && species) {
        return breedGuide(species.slug, place.breedSlug, place.breedName ?? place.breedSlug, species.name).communityName
            ?? place.breedName ?? place.breedSlug;
    }
    return species?.name ?? place.species;
}

/** A readable title for a post that has none: its first line, trimmed. */
export function postTitle(post: CommunityPost): string {
    const firstLine = post.content.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
    const clean = firstLine.replace(/\s+/g, " ").replace(/[#@]\S+/g, "").trim();
    const letters = (clean.match(/\p{L}/gu) ?? []).length;
    if (letters >= 6) return clean.length > 80 ? `${clean.slice(0, 77).trimEnd()}…` : clean;

    const place = primaryPlace(post);
    const what = post.postType === "video" ? "Video" : post.media.length ? "Photo" : "Post";
    const where = place ? ` in ${placeLabel(place)}` : "";
    return `${what} by ${post.author.name}${where}`;
}

/** Post text for display under its title: drops the first line when the title is exactly that line. */
export function postBody(post: CommunityPost): string {
    const lines = post.content.split(/\r?\n/);
    const idx = lines.findIndex((l) => l.trim());
    if (idx === -1) return "";
    if (lines[idx].trim().replace(/\s+/g, " ") === postTitle(post)) return lines.slice(idx + 1).join("\n").trim();
    return post.content;
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 60)
        .replace(/-+$/, "");
}

/** /p/123-title-words. The id is what resolves the post; the words are for people and search. */
export function postPath(post: CommunityPost): string {
    const words = slugify(postTitle(post));
    return `/p/${post.id}${words ? `-${words}` : ""}`;
}

export function parsePostParam(param: string): number | null {
    const m = /^(\d{1,18})(?:-|$)/.exec(param);
    if (!m) return null;
    const id = Number(m[1]);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Thin posts render but are noindex: a few words and no photo add nothing for search. */
export function isIndexablePost(post: CommunityPost): boolean {
    const words = post.content.split(/\s+/).filter(Boolean).length;
    return words >= 12 || (post.media.length > 0 && words >= 4);
}

export function speciesIntro(species: CommunitySpecies): CommunityGuide {
    return speciesGuide(species.slug) ?? { intro: `${species.name} owners in Pakistan sharing photos and questions.`, topics: [] };
}

// ─── Pet page panel ──────────────────────────────────────────────────────────

export type PetCommunity = {
    href: string;
    name: string;
    speciesName: string;
    postCount: number;
    posts: CommunityPost[];
};

/** The community a listing's pet belongs to: its breed's, else its species'. */
export async function getCommunityForListing(petId: number): Promise<PetCommunity | null> {
    try {
        const res = await db.query(
            `SELECT pc.category_name, b.breed_id, b.slug, b.kind, p2.slug AS parent_slug
               FROM pets p
               JOIN pet_category pc ON pc.category_id = p.pet_type
               LEFT JOIN breeds b ON b.breed_id = p.breed_id
               LEFT JOIN breeds p2 ON p2.breed_id = b.parent_breed_id
              WHERE p.pet_id = $1`,
            [petId]
        );
        const row = res.rows[0];
        const species = speciesByKey(row?.category_name);
        if (!species) return null;

        const breedSlug = row.parent_slug ?? (["breed", "street", "mixed"].includes(row.kind) ? row.slug : null);
        if (breedSlug) {
            const found = await findBreed(species, breedSlug);
            if (found?.kind === "community") {
                const posts = await listCommunityPosts({ breedId: found.community.breedId, limit: 3 });
                return {
                    href: `/${species.slug}/${found.community.slug}`,
                    name: found.community.communityName,
                    speciesName: species.name,
                    postCount: found.community.postCount,
                    posts,
                };
            }
        }

        const [counts, posts] = await Promise.all([getSpeciesCounts(), listCommunityPosts({ species: species.slug, limit: 3 })]);
        return {
            href: `/${species.slug}`,
            name: species.name,
            speciesName: species.name,
            postCount: counts[species.slug] ?? 0,
            posts,
        };
    } catch (e) {
        console.error("community: getCommunityForListing failed", e);
        return null;
    }
}

// ─── Sitemap ─────────────────────────────────────────────────────────────────

export type CommunitySitemapEntry = { path: string; lastModified: Date };

/** Only pages that pass the thin-content rules above. */
export async function getCommunitySitemapEntries(): Promise<CommunitySitemapEntry[]> {
    const entries: CommunitySitemapEntry[] = [{ path: "/home", lastModified: new Date() }];

    const counts = await getSpeciesCounts();
    for (const species of COMMUNITY_SPECIES) {
        if ((counts[species.slug] ?? 0) >= MIN_POSTS_TO_INDEX) {
            entries.push({ path: `/${species.slug}`, lastModified: new Date() });
        }
        for (const breed of await getBreedCommunities(species)) {
            if (breed.postCount >= MIN_POSTS_TO_INDEX) {
                entries.push({ path: `/${species.slug}/${breed.slug}`, lastModified: new Date() });
            }
        }
    }

    const posts = await listCommunityPosts({ limit: 1000 });
    for (const post of posts) {
        if (isIndexablePost(post)) entries.push({ path: postPath(post), lastModified: new Date(post.updatedAt) });
    }
    return entries;
}
