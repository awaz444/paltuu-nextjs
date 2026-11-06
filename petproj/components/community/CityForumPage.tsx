import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MIN_POSTS_TO_INDEX, findCity, getCityCounts, listCommunityPosts } from "@/lib/community";
import { breadcrumbJsonLd, collectionJsonLd, listingMetadata } from "@/lib/communitySeo";
import {
    AboutCard,
    AppCta,
    CommunityLayout,
    FeatureCards,
    Feed,
    ForumHeader,
    JsonLd,
    type Crumb,
} from "./CommunityChrome";

/** Shared by the static routes app/karachi, app/lahore and app/islamabad, which sit next to app/[species]. */
export async function cityMetadata(slug: string): Promise<Metadata> {
    const city = findCity(slug);
    if (!city) return { title: "Not Found" };
    const counts = await getCityCounts();

    return listingMetadata({
        title: `Pets in ${city.name}: Photos and Advice from Local Owners`,
        description: `${city.intro} See what owners near you are sharing on Paltuu.`,
        path: `/${city.slug}`,
        indexable: (counts[city.slug] ?? 0) >= MIN_POSTS_TO_INDEX,
        keywords: [
            `pet owners ${city.slug}`,
            `pets in ${city.slug}`,
            `pet community ${city.slug}`,
            `cats in ${city.slug}`,
            `dogs in ${city.slug}`,
        ],
    });
}

export default async function CityForumPage({ slug }: { slug: string }) {
    const city = findCity(slug);
    if (!city) notFound();

    const posts = await listCommunityPosts({ city: city.slug });
    const path = `/${city.slug}`;
    const crumbs: Crumb[] = [{ name: "Home", href: "/home" }, { name: city.name }];
    const nearby = [
        { label: `Adopt in ${city.name}`, href: `/adopt/${city.slug}` },
        { label: "Cats for adoption", href: `/adopt/cats/${city.slug}` },
        { label: "Dogs for adoption", href: `/adopt/dogs/${city.slug}` },
        { label: `Vets in ${city.name}`, href: `/pet-care/${city.slug}` },
        { label: "Lost & found", href: "/lost-and-found" },
    ];

    return (
        <main className="min-h-screen bg-gray-100">
            <JsonLd data={collectionJsonLd({ name: `Pets in ${city.name}`, description: city.intro, path, posts })} />
            <JsonLd data={breadcrumbJsonLd(crumbs, path)} />

            <ForumHeader speciesSlug={city.slug} name={`Pets in ${city.name}`} intro={city.intro} />

            <CommunityLayout
                nav={{ activeCity: city.slug }}
                aside={
                    <>
                        <AboutCard title={`About ${city.name}`} intro={city.intro} topics={city.topics}>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Posts here come from owners who set {city.name} as their city on their Paltuu profile.
                            </p>
                        </AboutCard>
                        <FeatureCards />
                        <AppCta />
                    </>
                }
            >
                <div className="mb-4 flex flex-wrap gap-2">
                    {nearby.map((n) => (
                        <Link
                            key={n.href}
                            href={n.href}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-400"
                        >
                            {n.label}
                        </Link>
                    ))}
                </div>
                <Feed
                    posts={posts}
                    empty={{
                        title: `No posts from ${city.name} yet`,
                        body: `Be the first: set ${city.name} as your city on your Paltuu profile and share a photo in the app.`,
                    }}
                />
            </CommunityLayout>
        </main>
    );
}
