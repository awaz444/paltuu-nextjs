import { db } from "@/db/index";
import { Metadata } from "next";
import Link from "next/link";
import ClinicCard from "@/components/ClinicCard";
import VetDetailsClient from "./VetDetailsClient";

// ─── Constants ───────────────────────────────────────────────────────────────

const KNOWN_CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"];

function isCitySlug(slug: string) {
    return KNOWN_CITIES.some((c) => c.toLowerCase() === slug.toLowerCase());
}

function toTitleCase(slug: string) {
    return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
    return KNOWN_CITIES.map((city) => ({ slug: city.toLowerCase() }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata> {
    const { slug } = params;

    // City page metadata
    if (isCitySlug(slug)) {
        const cityName = toTitleCase(slug);
        const title = `Vets in ${cityName} — Verified Vet Clinics | Paltuu.pk`;
        const description = `Find verified veterinary clinics in ${cityName}. Browse trusted vets for dogs, cats, and all pets in ${cityName}. Direct contact, no booking fees. Paltuu.pk — Pakistan's #1 pet care platform.`;

        return {
            title,
            description,
            keywords: [
                `vet in ${cityName.toLowerCase()}`,
                `vet clinic ${cityName.toLowerCase()}`,
                `veterinarian ${cityName.toLowerCase()}`,
                `pet doctor ${cityName.toLowerCase()}`,
                `animal clinic ${cityName.toLowerCase()}`,
                `dog vet ${cityName.toLowerCase()}`,
                `cat vet ${cityName.toLowerCase()}`,
                `best vet ${cityName.toLowerCase()}`,
                "paltuu",
            ],
            openGraph: {
                title,
                description,
                url: `https://www.paltuu.pk/pet-care/${slug}`,
                type: "website",
                images: [
                    {
                        url: "https://www.paltuu.pk/paltu_logo.svg",
                        width: 800,
                        height: 400,
                        alt: `Vets in ${cityName} — Paltuu.pk`,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
            },
            alternates: { canonical: `https://www.paltuu.pk/pet-care/${slug}` },
        };
    }

    // Vet page metadata
    const vet = await getVet(slug);

    if (!vet) {
        return {
            title: "Vet Not Found | Paltuu.pk",
            description: "Find and connect with trusted veterinarians across Pakistan on Paltuu.pk.",
        };
    }

    const title = `${vet.vet_name} — Vet${vet.city ? ` in ${vet.city}` : ""} | Paltuu.pk`;
    const description = vet.bio
        ? `${vet.bio.slice(0, 150)}…`
        : `Connect with ${vet.vet_name}${vet.clinic_name ? ` at ${vet.clinic_name}` : ""}${vet.city ? ` in ${vet.city}` : ""} on Paltuu.pk — Pakistan's #1 pet care platform.`;

    return {
        title,
        description,
        keywords: [
            "vet pakistan",
            "veterinarian pakistan",
            vet.city ? `vet ${vet.city.toLowerCase()}` : "",
            vet.clinic_name || "",
            "pet care pakistan",
            "paltuu",
        ].filter(Boolean),
        openGraph: {
            title,
            description,
            url: `https://www.paltuu.pk/pet-care/${slug}`,
            type: "profile",
            images: vet.profile_image_url
                ? [{ url: vet.profile_image_url, width: 400, height: 400, alt: vet.vet_name }]
                : [],
        },
        twitter: {
            card: "summary",
            title,
            description,
            images: vet.profile_image_url ? [vet.profile_image_url] : [],
        },
        alternates: {
            canonical: `https://www.paltuu.pk/pet-care/${slug}`,
        },
    };
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getVet(vetId: string) {
    try {
        const vetResult = await db.query(
            `SELECT
                v.vet_id,
                v.user_id,
                cl.clinic_id,
                cl.slug         AS clinic_slug,
                v.minimum_fee,
                v.contact_details,
                v.created_at,
                v.bio,
                v.schedule,
                v.qualifications,
                u.name         AS vet_name,
                u.dob,
                u.email,
                u.profile_image_url,
                cl.name        AS clinic_name,
                cl.address     AS location,
                cl.whatsapp_number AS clinic_whatsapp,
                cl.google_maps_link,
                cl.is_paltuu_partner,
                cl.is_verified,
                c.city_name    AS city
            FROM vets v
            JOIN users u  ON v.user_id   = u.user_id
            LEFT JOIN LATERAL (
                SELECT cv.clinic_id
                FROM clinic_vets cv
                WHERE cv.vet_id = v.vet_id
                ORDER BY cv.is_primary_location DESC NULLS LAST, cv.created_at ASC
                LIMIT 1
            ) primary_cv ON true
            LEFT JOIN clinics cl ON primary_cv.clinic_id = cl.clinic_id
            LEFT JOIN cities  c  ON u.city_id    = c.city_id
            WHERE v.vet_id = $1 AND v.is_active = true`,
            [vetId]
        );

        if (vetResult.rowCount === 0) return null;
        const vet = vetResult.rows[0];

        const reviewsResult = await db.query(
            `SELECT
                vr.review_id,
                vr.rating,
                vr.review_content,
                vr.review_date,
                u.profile_image_url AS review_maker_profile_image_url,
                u.name              AS review_maker_name
            FROM vet_reviews vr
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.vet_id = $1
            ORDER BY vr.review_date DESC`,
            [vetId]
        );

        return { ...vet, reviews: reviewsResult.rows };
    } catch (e) {
        console.error("Vet SSR fetch error:", e);
        return null;
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SlugPage({
    params,
}: {
    params: { slug: string };
}) {
    const { slug } = params;

    // ── City view ────────────────────────────────────────────────────────────
    if (isCitySlug(slug)) {
        const cityName = toTitleCase(slug);

        let clinics: any[] = [];
        try {
            const result = await db.query(
                `SELECT c.*, COUNT(cv.vet_id)::int AS vet_count
                 FROM clinics c
                 LEFT JOIN clinic_vets cv ON c.clinic_id = cv.clinic_id
                 WHERE LOWER(c.city) = LOWER($1) AND c.logo_url IS NOT NULL
                   AND (c.listing_type = 'clinic' OR c.listing_type IS NULL)
                 GROUP BY c.clinic_id
                 ORDER BY c.rating DESC NULLS LAST, c.created_at DESC`,
                [cityName]
            );
            clinics = result.rows;
        } catch {
            clinics = [];
        }

        const jsonLdItemList = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Veterinary Clinics in ${cityName}`,
            numberOfItems: clinics.length,
            itemListElement: clinics.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                    "@type": "VeterinaryCare",
                    name: c.name,
                    address: {
                        "@type": "PostalAddress",
                        streetAddress: c.address,
                        addressLocality: c.city,
                        addressCountry: "PK",
                    },
                    url: `https://www.paltuu.pk/pet-care/clinic/${c.slug || c.clinic_id}`,
                    ...(c.rating
                        ? {
                              aggregateRating: {
                                  "@type": "AggregateRating",
                                  ratingValue: c.rating,
                                  reviewCount: c.total_reviews || 1,
                              },
                          }
                        : {}),
                    ...(c.latitude && c.longitude
                        ? { geo: { "@type": "GeoCoordinates", latitude: c.latitude, longitude: c.longitude } }
                        : {}),
                },
            })),
        };

        const jsonLdBreadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paltuu.pk" },
                { "@type": "ListItem", position: 2, name: "Pet Care", item: "https://www.paltuu.pk/pet-care" },
                {
                    "@type": "ListItem",
                    position: 3,
                    name: `Vets in ${cityName}`,
                    item: `https://www.paltuu.pk/pet-care/${slug}`,
                },
            ],
        };

        const jsonLdFaq = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: `How many vet clinics are in ${cityName}?`,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: `There are ${clinics.length} verified veterinary clinics listed on Paltuu in ${cityName}. Browse all clinics above to find the right vet for your pet.`,
                    },
                },
                {
                    "@type": "Question",
                    name: `Which is the best vet clinic in ${cityName}?`,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text:
                            clinics.length > 0
                                ? `${clinics[0].name} is one of the top-rated vet clinics in ${cityName} on Paltuu. Browse all verified listings to find the best match for your pet's needs.`
                                : `Browse verified vet clinics in ${cityName} on Paltuu to find the best match for your pet.`,
                    },
                },
                {
                    "@type": "Question",
                    name: `How do I contact a vet in ${cityName}?`,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: `Click on any clinic above to view their phone number, WhatsApp, address, and operating hours. Paltuu connects you directly — no platform fees or middlemen.`,
                    },
                },
                {
                    "@type": "Question",
                    name: `Are vet clinics in ${cityName} open on weekends?`,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: `Many vet clinics in ${cityName} are open on weekends. Check the operating hours on each clinic's page on Paltuu for accurate timings.`,
                    },
                },
            ],
        };

        const faqs = [
            {
                q: `How many vet clinics are in ${cityName}?`,
                a: `There are ${clinics.length} verified clinics in ${cityName} on Paltuu. Browse them above.`,
            },
            {
                q: `Which is the best vet clinic in ${cityName}?`,
                a:
                    clinics.length > 0
                        ? `${clinics[0].name} is one of the top-rated clinics in ${cityName}. Browse all listings to find the right fit.`
                        : `Browse the verified clinics above to find the best match for your pet.`,
            },
            {
                q: `How do I contact a vet in ${cityName}?`,
                a: `Click any clinic above to see their phone number, WhatsApp, and address. Paltuu connects you directly — no booking fees.`,
            },
            {
                q: `Are vet clinics in ${cityName} open on weekends?`,
                a: `Many clinics in ${cityName} are open on weekends. Check each clinic's page for accurate hours.`,
            },
        ];

        return (
            <main className="min-h-screen bg-gray-100">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdItemList) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
                />

                <div className="bg-white border-b border-gray-100">
                    <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-6 px-4 md:px-8">
                        <nav
                            aria-label="Breadcrumb"
                            className="text-xs text-gray-400 mb-3 flex items-center gap-1"
                        >
                            <Link href="/" className="hover:text-primary">Home</Link>
                            <span>/</span>
                            <Link href="/pet-care" className="hover:text-primary">Pet Care</Link>
                            <span>/</span>
                            <span className="text-gray-600">Vets in {cityName}</span>
                        </nav>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Veterinary Clinics in {cityName}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {clinics.length > 0
                                ? `${clinics.length} verified clinic${clinics.length !== 1 ? "s" : ""} — direct contact, no booking fees`
                                : `Trusted vets in ${cityName} — verified by Paltuu`}
                        </p>
                    </div>
                </div>

                <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-8 px-4 md:px-8">
                    {clinics.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
                            <p className="text-gray-500 text-sm">No clinics listed in {cityName} yet.</p>
                            <Link
                                href="/pet-care"
                                className="mt-4 inline-block text-primary text-sm font-medium hover:underline"
                            >
                                Browse all cities →
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {clinics.map((clinic) => (
                                    <ClinicCard key={clinic.clinic_id} clinic={clinic} />
                                ))}
                            </div>

                            <div className="mt-10">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                    Browse Other Cities
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {KNOWN_CITIES.filter(
                                        (c) => c.toLowerCase() !== slug.toLowerCase()
                                    ).map((c) => (
                                        <Link
                                            key={c}
                                            href={`/pet-care/${c.toLowerCase()}`}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors shadow-sm"
                                        >
                                            Vets in {c}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <section className="mt-12" aria-labelledby="faq-heading">
                                <h2
                                    id="faq-heading"
                                    className="text-xl font-bold text-gray-900 mb-5"
                                >
                                    Frequently Asked Questions
                                </h2>
                                <div className="space-y-3">
                                    {faqs.map(({ q, a }) => (
                                        <div
                                            key={q}
                                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                                        >
                                            <p className="font-semibold text-gray-800 mb-1 text-sm">{q}</p>
                                            <p className="text-gray-500 text-sm">{a}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="mt-8 text-center">
                                <Link
                                    href="/pet-care"
                                    className="text-sm text-primary font-medium hover:underline"
                                >
                                    ← Browse all clinics
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </main>
        );
    }

    // ── Vet view ─────────────────────────────────────────────────────────────
    const vet = await getVet(slug);

    const vetJsonLd = vet
        ? {
              "@context": "https://schema.org",
              "@type": ["Veterinarian", "MedicalBusiness"],
              name: vet.vet_name,
              description: vet.bio || `Veterinarian at ${vet.clinic_name || "a clinic"} in ${vet.city || "Pakistan"}`,
              image: vet.profile_image_url || undefined,
              url: `https://www.paltuu.pk/pet-care/${slug}`,
              telephone: vet.contact_details || undefined,
              email: vet.email || undefined,
              priceRange: vet.minimum_fee ? `PKR ${vet.minimum_fee}+` : "PKR",
              address: {
                  "@type": "PostalAddress",
                  streetAddress: vet.location || undefined,
                  addressLocality: vet.city || undefined,
                  addressCountry: "PK",
              },
              ...(vet.clinic_name && {
                  parentOrganization: {
                      "@type": "MedicalClinic",
                      name: vet.clinic_name,
                      ...(vet.google_maps_link && { hasMap: vet.google_maps_link }),
                  },
              }),
              knowsAbout: ["Veterinary medicine", "Pet care", "Animal health"],
              areaServed: {
                  "@type": "City",
                  name: vet.city || "Pakistan",
              },
              ...(vet.reviews?.length > 0 && {
                  aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: (
                          vet.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
                          vet.reviews.length
                      ).toFixed(1),
                      reviewCount: vet.reviews.length,
                      bestRating: 5,
                      worstRating: 1,
                  },
              }),
          }
        : null;

    return (
        <>
            {vetJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(vetJsonLd) }}
                />
            )}
            <VetDetailsClient slug={slug} initialVet={vet ?? undefined} />
        </>
    );
}
