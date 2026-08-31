import { db } from "@/db/index";

/**
 * Single source of truth for the /adopt landing pages.
 *
 * Everything here is derived from the database rather than hardcoded, because
 * the real data disagreed with our assumptions in both directions: cities we
 * had listed (Multan, Rawalpindi) have no pets at all, while cities we hadn't
 * (Hyderabad, Mian Channu, Sialkot, Quetta, Gujranwala) do. Categories beyond
 * Cat/Dog exist in pet_category and should start working the moment someone
 * lists a rabbit, without a code change.
 */

export type SpeciesEntry = {
    categoryId: number;
    name: string;    // "Cat"
    plural: string;  // "Cats"
    slug: string;    // "cats"
    young?: string;  // "kittens"
    count: number;
};

export type CityEntry = {
    name: string;    // "Mian Channu"
    slug: string;    // "mian-channu"
    count: number;
};

export type Taxonomy = {
    species: SpeciesEntry[];
    cities: CityEntry[];
    /** `${categoryId}|${cityName}` -> count, for combinations that have listings. */
    combos: Map<string, number>;
};

const IRREGULAR_PLURAL: Record<string, string> = { fish: "fish", mouse: "mice", other: "other pets" };
const YOUNG: Record<string, string> = { cat: "kittens", dog: "puppies", rabbit: "kits", horse: "foals" };

export function slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function pluralize(name: string): string {
    const key = name.toLowerCase();
    if (IRREGULAR_PLURAL[key]) {
        // Preserve the original casing style for display ("Fish", "Mice").
        return IRREGULAR_PLURAL[key].replace(/^\w/, (c) => c.toUpperCase());
    }
    if (/(s|x|z|ch|sh)$/.test(key)) return `${name}es`;
    if (/[^aeiou]y$/.test(key)) return `${name.slice(0, -1)}ies`;
    return `${name}s`;
}

/** Availability filters must match app/api/v1/browse-pets/route.ts exactly. */
const AVAILABLE = `p.adoption_status = 'available' AND p.approved = true`;

export async function getTaxonomy(): Promise<Taxonomy> {
    const empty: Taxonomy = { species: [], cities: [], combos: new Map() };

    try {
        // One pass gives species totals, city totals and the combo matrix.
        const res = await db.query(
            `SELECT pc.category_id, pc.category_name, c.city_name, COUNT(*)::int AS n
             FROM pets p
             JOIN users u ON p.owner_id = u.user_id
             JOIN cities c ON p.city_id = c.city_id
             JOIN pet_category pc ON p.pet_type = pc.category_id
             WHERE ${AVAILABLE}
             GROUP BY 1, 2, 3`
        );

        const speciesMap = new Map<number, SpeciesEntry>();
        const cityMap = new Map<string, CityEntry>();
        const combos = new Map<string, number>();

        for (const row of res.rows) {
            const n: number = row.n;
            const name: string = row.category_name;
            const city: string = row.city_name;
            if (!name || !city) continue;

            const existing = speciesMap.get(row.category_id);
            if (existing) {
                existing.count += n;
            } else {
                speciesMap.set(row.category_id, {
                    categoryId: row.category_id,
                    name,
                    plural: pluralize(name),
                    slug: slugify(pluralize(name)),
                    young: YOUNG[name.toLowerCase()],
                    count: n,
                });
            }

            const c = cityMap.get(city);
            if (c) c.count += n;
            else cityMap.set(city, { name: city, slug: slugify(city), count: n });

            combos.set(`${row.category_id}|${city}`, n);
        }

        return {
            species: [...speciesMap.values()].sort((a, b) => b.count - a.count),
            cities: [...cityMap.values()].sort((a, b) => b.count - a.count),
            combos,
        };
    } catch (e) {
        console.error("adoptTaxonomy: query failed", e);
        return empty;
    }
}

/**
 * Every category in pet_category, including ones with no listings yet, so a
 * slug like /adopt/rabbits still resolves to a real (empty) page instead of a
 * 404 the moment it is linked or shared.
 */
export async function getAllSpecies(): Promise<SpeciesEntry[]> {
    try {
        const res = await db.query(
            `SELECT category_id, category_name FROM pet_category ORDER BY category_id`
        );
        return res.rows
            .filter((r: any) => r.category_name)
            .map((r: any) => ({
                categoryId: r.category_id,
                name: r.category_name,
                plural: pluralize(r.category_name),
                slug: slugify(pluralize(r.category_name)),
                young: YOUNG[r.category_name.toLowerCase()],
                count: 0,
            }));
    } catch (e) {
        console.error("adoptTaxonomy: category query failed", e);
        return [];
    }
}

/**
 * Every city in the cities table. Used for slug resolution only: a URL that was
 * once valid must keep returning 200 after its last pet is adopted, rather than
 * turning into a 404 for an already-indexed page. Sitemap/link generation uses
 * getTaxonomy() instead, so empty cities are never advertised.
 */
export async function getAllCitiesFull(): Promise<CityEntry[]> {
    try {
        const res = await db.query(`SELECT city_name FROM cities ORDER BY city_name`);
        return res.rows
            .filter((r: any) => r.city_name)
            .map((r: any) => ({ name: r.city_name, slug: slugify(r.city_name), count: 0 }));
    } catch (e) {
        console.error("adoptTaxonomy: city query failed", e);
        return [];
    }
}

/** Cities that currently have at least one adoptable pet. */
export async function getAllCities(): Promise<CityEntry[]> {
    const { cities } = await getTaxonomy();
    return cities;
}
