import { db } from "@/db/index";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatAge } from "@/utils/formatAge";
import { SITE_URL } from "@/lib/site";
import {
    getTaxonomy,
    getAllSpecies,
    getAllCitiesFull,
    SpeciesEntry,
    CityEntry,
} from "@/lib/adoptTaxonomy";
import { VET_CITIES } from "@/lib/vetCities";

// Listings change as pets are added/adopted, but not per-request — rebuild hourly.
export const revalidate = 3600;

// ─── Slug resolution ─────────────────────────────────────────────────────────
// Species and cities are no longer hardcoded here — pet_category and cities
// disagreed with a fixed list in both directions (categories beyond Cat/Dog
// exist; cities with real listings, like Mian Channu and Hyderabad, weren't
// in the old 6-city list while Rawalpindi/Multan, which have zero listings,
// were). See lib/adoptTaxonomy.ts.

function toTitleCase(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Resolves against the FULL species/city lists (incl. zero-listing ones) so an
 *  already-indexed or freshly-listed slug always resolves to a real page (200 +
 *  empty state) instead of a 404. Only a genuinely unknown slug 404s. */
async function parseSlug(slug: string[] | undefined) {
    const parts = (slug || []).filter(Boolean);
    if (parts.length === 0 || parts.length > 2) return null;

    const [allSpecies, allCities] = await Promise.all([getAllSpecies(), getAllCitiesFull()]);
    const findSpecies = (s: string) => allSpecies.find((sp) => sp.slug === s.toLowerCase());
    const findCity = (s: string) => allCities.find((c) => c.slug === s.toLowerCase());

    const species = findSpecies(parts[0]);
    if (species) {
        if (parts.length === 1) return { species, city: undefined as CityEntry | undefined };
        const city = findCity(parts[1]);
        return city ? { species, city } : null;
    }

    if (parts.length === 1) {
        const city = findCity(parts[0]);
        return city ? { species: undefined as SpeciesEntry | undefined, city } : null;
    }
    return null;
}

function pathFor(species?: SpeciesEntry, city?: CityEntry) {
    return `/adopt/${[species?.slug, city?.slug].filter(Boolean).join("/")}`;
}

// ─── Static params ───────────────────────────────────────────────────────────
// Pre-render exactly the combinations that have real listings today (mirrors
// app/sitemap.ts). Everything else — a category or city with zero listings —
// still resolves via parseSlug()'s full lookup above and renders on demand
// (dynamicParams defaults to true), so it's never a hard 404, just uncached
// until first visit.

export async function generateStaticParams() {
    const { species, cities, combos } = await getTaxonomy();
    const params: { slug: string[] }[] = [];

    for (const sp of species) {
        params.push({ slug: [sp.slug] });
        for (const city of cities) {
            if (combos.get(`${sp.categoryId}|${city.name}`)) {
                params.push({ slug: [sp.slug, city.slug] });
            }
        }
    }
    for (const city of cities) params.push({ slug: [city.slug] });

    return params;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
    { params }: { params: { slug?: string[] } }
): Promise<Metadata> {
    const parsed = await parseSlug(params.slug);
    if (!parsed) return { title: "Not Found" };

    const { species: sp, city } = parsed;
    const place = city?.name || "Pakistan";
    const young = sp ? (sp.young || sp.plural.toLowerCase()) : undefined;
    const canonical = `${SITE_URL}${pathFor(sp, city)}`;

    // The root layout applies `template: "%s | Paltuu"` and /adopt has no
    // intermediate layout resetting it (unlike app/pet-care/layout.tsx), so no
    // brand suffix belongs here — adding one renders "... | Paltuu.pk | Paltuu".
    // Kept short so the keyword survives SERP truncation (~60 chars incl. suffix).
    const title = sp
        ? `${sp.name} Adoption in ${place} — Adopt ${sp.plural} & ${toTitleCase(young!)}`
        : `Pet Adoption in ${place} — Adopt Dogs & Cats`;

    const description = sp
        ? `Adopt ${sp.plural.toLowerCase()} in ${place}. Browse verified ${sp.plural.toLowerCase()} and ${young} for adoption from shelters, rescues and owners${city ? ` in ${place}` : " across Pakistan"}. Free to browse on Paltuu.pk — Pakistan's #1 pet adoption platform.`
        : `Adopt a pet in ${place}. Browse verified dogs, cats, puppies and kittens for adoption from trusted shelters, rescues and owners on Paltuu.pk.`;

    const low = city?.name.toLowerCase();
    const keywords = sp
        ? [
            `${sp.name.toLowerCase()} adoption`,
            `${sp.plural.toLowerCase()} for adoption`,
            `${sp.name.toLowerCase()} for adoption`,
            `adopt a ${sp.name.toLowerCase()}`,
            `${young} for adoption`,
            `online ${sp.name.toLowerCase()} adoption`,
            ...(low ? [
                `${sp.name.toLowerCase()} adoption ${low}`,
                `${sp.plural.toLowerCase()} for adoption ${low}`,
                `${sp.plural.toLowerCase()} for adoption in ${low}`,
                `free ${sp.name.toLowerCase()} adoption in ${low}`,
                `${sp.name.toLowerCase()} adoption in ${low}`,
            ] : [`${sp.name.toLowerCase()} adoption pakistan`]),
            "paltuu",
        ]
        : [
            `pet adoption ${place.toLowerCase()}`,
            "pet adoption", "adopt a pet", "pets for adoption",
            "dog adoption", "cat adoption", "paltuu",
        ];

    return {
        title,
        description,
        keywords,
        openGraph: { title, description, url: canonical, type: "website", siteName: "Paltuu.pk" },
        twitter: { card: "summary_large_image", title, description },
        alternates: { canonical },
    };
}

// ─── Data ────────────────────────────────────────────────────────────────────

type PetRow = {
    pet_id: number;
    pet_name: string;
    pet_breed: string | null;
    age_months: number;
    sex: string | null;
    listing_type: string | null;
    city: string;
    image_url: string | null;
};

async function getPets(species?: SpeciesEntry, city?: CityEntry): Promise<PetRow[]> {
    // Mirrors the availability filters in app/api/v1/browse-pets/route.ts so
    // these pages never surface a pet /browse-pets wouldn't.
    const conds = ["p.adoption_status = 'available'", "p.approved = true"];
    const vals: any[] = [];
    let i = 1;

    if (species) {
        conds.push(`p.pet_type = $${i++}`);
        vals.push(species.categoryId);
    }
    if (city) {
        conds.push(`c.city_name = $${i++}`);
        vals.push(city.name);
    }

    try {
        const res = await db.query(
            `SELECT p.pet_id, p.pet_name, p.pet_breed, p.age_months, p.sex, p.listing_type,
                    c.city_name AS city,
                    (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url
             FROM pets p
             JOIN users u ON p.owner_id = u.user_id
             JOIN cities c ON p.city_id = c.city_id
             WHERE ${conds.join(" AND ")}
             ORDER BY p.created_at DESC
             LIMIT 48`,
            vals
        );
        return res.rows;
    } catch (e) {
        console.error("Adopt page: pet query failed", e);
        return [];
    }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdoptPage({ params }: { params: { slug?: string[] } }) {
    const parsed = await parseSlug(params.slug);
    if (!parsed) notFound();

    const { species: sp, city } = parsed;
    const place = city?.name || "Pakistan";
    const noun = sp ? sp.plural : "Pets";
    const young = sp ? (sp.young || sp.plural.toLowerCase()) : undefined;
    const url = `${SITE_URL}${pathFor(sp, city)}`;

    // Cross-link lists: cap to the busiest handful so the page doesn't sprawl
    // into a directory of one-listing towns; the full set lives on /adopt.
    const { species: allSpecies, cities: allCities } = await getTaxonomy();
    const otherCities = allCities.filter((c) => c.name !== city?.name).slice(0, 8);
    const otherSpecies = allSpecies.filter((s) => s.categoryId !== sp?.categoryId);

    const pets = await getPets(sp, city);

    const heading = `${noun} for Adoption in ${place}`;
    const intro = sp
        ? `Meet ${sp.plural.toLowerCase()} and ${young} looking for a home${city ? ` in ${place}` : " across Pakistan"}. Every listing is posted by a verified shelter, rescue partner or owner on Paltuu — browsing and applying is always free.`
        : `Meet dogs, cats and other pets looking for a home${city ? ` in ${place}` : " across Pakistan"}. Every listing is posted by a verified shelter, rescue partner or owner on Paltuu — browsing and applying is always free.`;

    const jsonLdItemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: heading,
        numberOfItems: pets.length,
        itemListElement: pets.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/browse-pets/${p.pet_id}`,
            name: `${p.pet_name}${p.pet_breed ? ` – ${p.pet_breed}` : ""}`,
        })),
    };

    const jsonLdBreadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Adopt", item: `${SITE_URL}/adopt` },
            ...(sp ? [{ "@type": "ListItem", position: 3, name: sp.plural, item: `${SITE_URL}${pathFor(sp)}` }] : []),
            ...(city ? [{ "@type": "ListItem", position: sp ? 4 : 3, name: place, item: url }] : []),
        ],
    };

    const faqs = [
        {
            q: `How do I adopt a ${sp ? sp.name.toLowerCase() : "pet"}${city ? ` in ${place}` : " in Pakistan"}?`,
            a: `Browse the listings on this page, open the one you're interested in, and message the shelter, rescue or owner directly through Paltuu. You can arrange to meet the ${sp ? sp.name.toLowerCase() : "pet"} before deciding.`,
        },
        {
            q: `Is ${sp ? sp.name.toLowerCase() : "pet"} adoption free on Paltuu?`,
            a: `Yes. Browsing listings and applying to adopt is completely free on Paltuu. Some shelters and rescues ask for a small rehoming or vaccination contribution, which is set by them and shown on the listing.`,
        },
        ...(city ? [{
            q: `Are these ${noun.toLowerCase()} located in ${place}?`,
            a: `Yes. Every listing on this page is from an owner, shelter or rescue partner based in ${place}, so you can meet the ${sp ? sp.name.toLowerCase() : "pet"} in person before adopting.`,
        }] : []),
    ];

    const jsonLdFaq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };

    return (
        <main className="bg-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdItemList) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

            {/* Header */}
            <section className="py-14 px-6 lg:px-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-primary">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href="/adopt" className="hover:text-primary">Adopt</Link>
                        {sp && (
                            <>
                                <span className="mx-2">/</span>
                                <Link href={pathFor(sp)} className="hover:text-primary">{sp.plural}</Link>
                            </>
                        )}
                        {city && (<><span className="mx-2">/</span><span className="text-gray-700">{place}</span></>)}
                    </nav>

                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        {noun} for Adoption in <span className="text-primary">{place}</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl">{intro}</p>
                </div>
            </section>

            {/* Listings */}
            <section className="py-14 px-6 lg:px-20 bg-primary">
                <div className="max-w-6xl mx-auto">
                    {pets.length > 0 ? (
                        <>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                                {pets.length} {pets.length === 1 ? "pet" : "pets"} available now
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pets.map((pet) => (
                                    <Link key={pet.pet_id} href={`/browse-pets/${pet.pet_id}`}>
                                        <article className="bg-white rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 h-full">
                                            <div className="relative aspect-square overflow-hidden">
                                                <img
                                                    src={pet.image_url || "/dog-placeholder.png"}
                                                    alt={`${pet.pet_name}${pet.pet_breed ? ` – ${pet.pet_breed}` : ""} available for adoption in ${pet.city}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                {pet.listing_type === "rescue" && (
                                                    <span className="absolute top-2 right-2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                                                        + Rescue
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{pet.pet_name}</h3>
                                                <p className="text-gray-500 text-sm mb-2 truncate">
                                                    {formatAge(pet.age_months)}
                                                    {pet.pet_breed ? ` · ${pet.pet_breed}` : ""}
                                                </p>
                                                <p className="text-gray-500 text-sm">{pet.city}</p>
                                            </div>
                                        </article>
                                    </Link>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                No {noun.toLowerCase()} listed in {place} right now
                            </h2>
                            <p className="text-white/80 max-w-2xl mx-auto mb-8">
                                New pets are added every week. Browse everything currently available, or check a nearby city below.
                            </p>
                        </div>
                    )}

                    <div className="text-center mt-10">
                        <Link
                            href="/browse-pets"
                            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
                        >
                            Browse All Adoptable Pets →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Cross-links */}
            <section className="py-14 px-6 lg:px-20 bg-white">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {sp ? `${sp.plural} by city` : "Adopt by city"}
                        </h2>
                        <ul className="space-y-2 text-sm">
                            {otherCities.map((c) => (
                                <li key={c.name}>
                                    <Link href={pathFor(sp, c)} className="text-gray-600 hover:text-primary">
                                        {noun} for adoption in {c.name}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/adopt" className="text-gray-600 hover:text-primary font-medium">
                                    View all cities →
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Other pets</h2>
                        <ul className="space-y-2 text-sm">
                            {otherSpecies.map((s) => (
                                <li key={s.categoryId}>
                                    <Link href={pathFor(s, city)} className="text-gray-600 hover:text-primary">
                                        {s.plural} for adoption{city ? ` in ${place}` : " in Pakistan"}
                                    </Link>
                                </li>
                            ))}
                            {sp && (
                                <li>
                                    <Link href={pathFor(undefined, city)} className="text-gray-600 hover:text-primary">
                                        All pets for adoption{city ? ` in ${place}` : " in Pakistan"}
                                    </Link>
                                </li>
                            )}
                            {/* Only link to a vet city page for cities that actually have
                                clinic coverage — see lib/vetCities.ts. */}
                            {city && (VET_CITIES as readonly string[]).includes(city.name) && (
                                <li>
                                    <Link href={`/pet-care/${city.slug}`} className="text-gray-600 hover:text-primary">
                                        Vets in {place}
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Common questions</h2>
                        <dl className="space-y-4">
                            {faqs.map((f) => (
                                <div key={f.q}>
                                    <dt className="font-semibold text-gray-900 text-sm mb-1">{f.q}</dt>
                                    <dd className="text-gray-600 text-sm leading-relaxed">{f.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </section>
        </main>
    );
}
