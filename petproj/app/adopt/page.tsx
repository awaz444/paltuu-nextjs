import { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { getTaxonomy } from "@/lib/adoptTaxonomy";

// Listings change as pets are added/adopted, but not per-request — rebuild hourly.
export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Adopt a Pet in Pakistan — Browse by City & Pet Type",
    description:
        "Adopt a dog, cat or other pet in Pakistan. Browse verified listings by city or by pet type from shelters, rescues and owners on Paltuu.pk — always free to browse and apply.",
    keywords: [
        "adopt a pet pakistan", "pet adoption pakistan", "adopt a dog", "adopt a cat",
        "pets for adoption near me", "paltuu",
    ],
    openGraph: {
        title: "Adopt a Pet in Pakistan — Browse by City & Pet Type",
        description: "Browse verified pets for adoption by city or pet type on Paltuu.pk.",
        url: `${SITE_URL}/adopt`,
        type: "website",
        siteName: "Paltuu.pk",
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `${SITE_URL}/adopt` },
};

export default async function AdoptHubPage() {
    const { species, cities } = await getTaxonomy();
    const totalPets = species.reduce((sum, s) => sum + s.count, 0);

    const jsonLdBreadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Adopt", item: `${SITE_URL}/adopt` },
        ],
    };

    const jsonLdCollection = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Adopt a Pet in Pakistan",
        url: `${SITE_URL}/adopt`,
        hasPart: [
            ...species.map((s) => ({
                "@type": "WebPage",
                name: `${s.plural} for Adoption`,
                url: `${SITE_URL}/adopt/${s.slug}`,
            })),
            ...cities.map((c) => ({
                "@type": "WebPage",
                name: `Pet Adoption in ${c.name}`,
                url: `${SITE_URL}/adopt/${c.slug}`,
            })),
        ],
    };

    return (
        <main className="bg-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }} />

            {/* Header */}
            <section className="py-14 px-6 lg:px-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-primary">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-700">Adopt</span>
                    </nav>

                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        Adopt a Pet in <span className="text-primary">Pakistan</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl">
                        {totalPets > 0 ? `${totalPets} verified pets` : "Pets"} looking for a home from shelters,
                        rescue partners and owners nationwide. Browse by pet type or by city — every listing is
                        free to view and apply to.
                    </p>
                </div>
            </section>

            {/* Directory */}
            <section className="py-14 px-6 lg:px-20 bg-primary">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* By pet type */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Browse by Pet Type</h2>
                        {species.length > 0 ? (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {species.map((s) => (
                                    <li key={s.categoryId}>
                                        <Link
                                            href={`/adopt/${s.slug}`}
                                            className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-lg hover:scale-[1.02] transition-transform duration-300"
                                        >
                                            <span className="font-semibold text-gray-900">{s.plural}</span>
                                            <span className="text-sm text-primary font-bold">{s.count}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-white/80">No pets listed yet — check back soon.</p>
                        )}
                    </div>

                    {/* By city */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Browse by City</h2>
                        {cities.length > 0 ? (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {cities.map((c) => (
                                    <li key={c.name}>
                                        <Link
                                            href={`/adopt/${c.slug}`}
                                            className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-lg hover:scale-[1.02] transition-transform duration-300"
                                        >
                                            <span className="font-semibold text-gray-900">{c.name}</span>
                                            <span className="text-sm text-primary font-bold">{c.count}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-white/80">No cities listed yet — check back soon.</p>
                        )}
                    </div>
                </div>

                <div className="text-center mt-12">
                    <Link
                        href="/browse-pets"
                        className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
                    >
                        Browse All Adoptable Pets →
                    </Link>
                </div>
            </section>
        </main>
    );
}
