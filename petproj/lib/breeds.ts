/**
 * Breed list + free-text matcher.
 *
 * Breeds used to be typed by hand (pets.pet_breed, pet_profiles.breed), so one
 * breed exists under a dozen spellings. The `breeds` table (db/breeds_migration.ts)
 * is the picked list that replaces that, and BREED_SEED below is what it is
 * seeded from. Display names are English only — Urdu/local spellings people
 * actually type (desi, bully kutta, kabootar) live in `aliases`, which are only
 * ever used for matching, never shown.
 *
 * Lists are short on purpose and ordered most common first: most cat owners in
 * Pakistan don't know their cat's breed, so the cat list leads with Street cat
 * and always offers Not sure. Dog owners usually do know, so dogs get more.
 *
 * matchBreed() is pure (no DB) so the backfill and, later, the API — which keeps
 * receiving typed breeds from old app versions — share one implementation.
 */

export type BreedKind = "breed" | "street" | "mixed" | "not_sure" | "other";

export type BreedSeed = {
    slug: string;
    name: string;
    kind: BreedKind;
    aliases: string[];
    /** Slug of the breed whose community this one counts in ("Persian mix" → persian). */
    parent?: string;
};

/** Keyed by pet_category.category_name. Array order = sort order shown to users. */
export const BREED_SEED: Record<string, BreedSeed[]> = {
    Cat: [
        {
            slug: "street-cat", name: "Street cat", kind: "street",
            aliases: [
                "stray", "stary", "stray cat", "street", "desi", "desi cat", "local", "local cat", "pakistani",
                "domestic short hair", "domestic shorthair", "domestic shorthair mix", "domestic long hair",
                "domestic longhair", "dsh", "dlh", "tabby", "tebby", "calico", "tebby calico", "ginger",
                "ginger cat", "orange", "black cat", "white cat", "tortoise shell", "tortoiseshell", "tortie",
            ],
        },
        {
            slug: "persian", name: "Persian", kind: "breed",
            aliases: ["persian cat", "pershian", "pershion", "persion", "pwrsin", "parsian", "persain", "persian doll face", "pikie face persian", "peke face persian", "punch face persian"],
        },
        {
            slug: "persian-mix", name: "Persian mix", kind: "breed", parent: "persian",
            aliases: ["persian mix", "mix persian", "persian cross", "semi persian", "half persian", "persian mixed"],
        },
        { slug: "siamese", name: "Siamese", kind: "breed", aliases: ["siamese cat", "siamis", "siamies"] },
        { slug: "himalayan", name: "Himalayan", kind: "breed", aliases: ["himalayan persian", "himaliyan", "himalian"] },
        { slug: "khao-manee", name: "Khao Manee", kind: "breed", aliases: ["khao mani", "kao manee", "khao manee short haired"] },
        { slug: "turkish-angora", name: "Turkish Angora", kind: "breed", aliases: ["turkish agora", "angora", "turkish angoora"] },
        { slug: "not-sure", name: "Not sure", kind: "not_sure", aliases: ["unsure", "not sure", "dont know", "don t know", "idk", "unknown", "no idea", "no clue"] },
        {
            slug: "other", name: "Other", kind: "other",
            aliases: [
                "russian blue", "ragdoll", "regdol", "maine coon", "british shorthair", "british short hair",
                "american shorthair", "american short hair", "amarican short hair", "bengal", "scottish fold",
                "sphynx", "exotic shorthair",
            ],
        },
    ],
    Dog: [
        { slug: "german-shepherd", name: "German Shepherd", kind: "breed", aliases: ["gsd", "german shephard", "german shepard", "german shepherd dog", "alsatian"] },
        { slug: "labrador", name: "Labrador", kind: "breed", aliases: ["lab", "labrador retriever", "labra", "labrador dog"] },
        { slug: "golden-retriever", name: "Golden Retriever", kind: "breed", aliases: ["golden", "golden retriver"] },
        { slug: "husky", name: "Husky", kind: "breed", aliases: ["siberian husky", "huskey", "huski"] },
        { slug: "rottweiler", name: "Rottweiler", kind: "breed", aliases: ["rotweiler", "rottwieler", "rott"] },
        { slug: "pomeranian-spitz", name: "Pomeranian and Spitz", kind: "breed", aliases: ["pomeranian", "pom", "spitz", "indian spitz", "japanese spitz"] },
        { slug: "shih-tzu", name: "Shih Tzu", kind: "breed", aliases: ["shihtzu", "shih tzu", "shitzu", "shitsu"] },
        { slug: "poodle", name: "Poodle", kind: "breed", aliases: ["toy poodle", "pudel"] },
        { slug: "pug", name: "Pug", kind: "breed", aliases: [] },
        { slug: "belgian-malinois", name: "Belgian Malinois", kind: "breed", aliases: ["malinois"] },
        { slug: "pakistani-mastiff", name: "Pakistani Mastiff", kind: "breed", aliases: ["bully kutta", "bully kuta", "bully", "pakistani bully", "pakistani bully kutta"] },
        { slug: "himalayan-sheepdog", name: "Himalayan Sheepdog", kind: "breed", aliases: ["gaddi", "gaddi kutta", "gaddi dog"] },
        { slug: "beagle", name: "Beagle", kind: "breed", aliases: [] },
        { slug: "street-dog", name: "Street dog", kind: "street", aliases: ["stray", "stray dog", "street", "desi", "desi dog", "local", "local dog"] },
        { slug: "mixed", name: "Mixed", kind: "mixed", aliases: ["mix", "mixed breed", "cross", "cross breed", "crossbreed"] },
        { slug: "not-sure", name: "Not sure", kind: "not_sure", aliases: ["unsure", "not sure", "dont know", "don t know", "idk", "unknown", "no idea", "no clue"] },
        { slug: "other", name: "Other", kind: "other", aliases: ["poochon", "doberman", "dobermann", "dalmatian", "chihuahua", "maltese", "bulldog", "french bulldog", "cocker spaniel", "great dane", "boxer", "pitbull", "pit bull"] },
    ],
    Bird: [
        { slug: "budgie", name: "Budgie", kind: "breed", aliases: ["budgies", "budgerigar", "australian parrot", "australian parrots"] },
        { slug: "cockatiel", name: "Cockatiel", kind: "breed", aliases: ["cockatail", "cocktail", "cockatiels"] },
        { slug: "lovebird", name: "Lovebird", kind: "breed", aliases: ["love bird", "lovebirds", "love birds"] },
        { slug: "ringneck", name: "Ringneck", kind: "breed", aliases: ["ring neck", "indian ringneck", "rose ringed parakeet"] },
        { slug: "alexandrine", name: "Alexandrine", kind: "breed", aliases: ["alexandrine parakeet", "alexandrine parrot", "raw parrot", "raw tota"] },
        { slug: "african-grey", name: "African Grey", kind: "breed", aliases: ["african gray", "grey parrot", "gray parrot"] },
        { slug: "pigeon", name: "Pigeon", kind: "breed", aliases: ["pigeons", "kabootar", "kabutar"] },
        { slug: "not-sure", name: "Not sure", kind: "not_sure", aliases: ["unsure", "not sure", "dont know", "don t know", "idk", "unknown", "no idea"] },
        { slug: "other", name: "Other", kind: "other", aliases: ["macaw", "blue and gold macaw", "cockatoo", "finch", "canary", "conure", "sun conure", "parrot"] },
    ],
};

/** A breed row as the matcher needs it (from the DB or straight from BREED_SEED). */
export type BreedForMatch = {
    breed_id: number;
    slug: string;
    name: string;
    kind: BreedKind;
    aliases: string[];
    parent_breed_id: number | null;
};

export type BreedMatch = {
    breed_id: number | null;
    method: "exact" | "contains" | "fuzzy" | "blank" | "junk" | "none";
    /** The phrase that decided it, for the review file. */
    via?: string;
};

// Placeholder/test values seen in real rows. These are never guessed at.
const JUNK = /\b(test|dummy|asda|asdf|qwe|xyz|lorem)\b|^(breed|cat|dog|bird|male|female|none|na|n a)$/;
const MIX_WORDS = /\b(mix|mixed|mixture|cross|semi|half|and)\b/;

export function normalizeBreedText(s: string | null | undefined): string {
    return (s ?? "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9 ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function phrasesOf(b: BreedForMatch): string[] {
    return [b.name, ...b.aliases].map(normalizeBreedText).filter(Boolean);
}

function containsPhrase(text: string, phrase: string): boolean {
    return ` ${text} `.includes(` ${phrase} `);
}

function levenshtein(a: string, b: string): number {
    const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        let diag = prev[0];
        prev[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = prev[j];
            prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
            diag = tmp;
        }
    }
    return prev[b.length];
}

/**
 * Map one typed breed to a row of `breeds` (all rows passed in must belong to
 * the pet's species). Returns breed_id null when nothing is confident — those
 * rows are left for a person to settle rather than guessed.
 *
 *   1. exact — the whole text is a name or alias.
 *   2. contains — a name or alias appears as whole words. A real breed beats a
 *      street/colour word ("tortoise shell persian" → Persian), then the longest
 *      phrase wins; mix words then move a breed to its mix child ("persian
 *      cross" → Persian mix).
 *   3. fuzzy — one typo away from a name or alias of 6+ letters (two for 9+).
 */
export function matchBreed(raw: string | null | undefined, breeds: BreedForMatch[]): BreedMatch {
    const text = normalizeBreedText(raw);
    if (!text) return { breed_id: null, method: "blank" };
    if (JUNK.test(text) || text.length <= 2 || !/[a-z]/.test(text)) return { breed_id: null, method: "junk" };

    for (const b of breeds) {
        if (phrasesOf(b).includes(text)) return { breed_id: b.breed_id, method: "exact", via: text };
    }

    const hits: { b: BreedForMatch; phrase: string }[] = [];
    for (const b of breeds) {
        for (const p of phrasesOf(b)) if (containsPhrase(text, p)) hits.push({ b, phrase: p });
    }
    if (hits.length) {
        hits.sort((x, y) =>
            Number(y.b.kind === "breed") - Number(x.b.kind === "breed") || y.phrase.length - x.phrase.length
        );
        let best = hits[0].b;
        if (MIX_WORDS.test(text)) {
            const mixChild = breeds.find((c) => c.parent_breed_id === best.breed_id);
            if (mixChild) best = mixChild;
        }
        return { breed_id: best.breed_id, method: "contains", via: hits[0].phrase };
    }

    for (const b of breeds) {
        for (const p of phrasesOf(b)) {
            if (p.length < 6) continue;
            const d = levenshtein(text, p);
            if (d === 1 || (d === 2 && p.length >= 9)) return { breed_id: b.breed_id, method: "fuzzy", via: p };
        }
    }

    return { breed_id: null, method: "none" };
}
