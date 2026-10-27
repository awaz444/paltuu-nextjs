import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
    COMMUNITY_SPECIES,
    MIN_POSTS_TO_INDEX,
    findSpecies,
    getBreedCommunities,
    getSpeciesCounts,
    listCommunityPosts,
    speciesIntro,
} from "@/lib/community";
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
} from "@/components/community/CommunityChrome";

export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
    return COMMUNITY_SPECIES.map((s) => ({ species: s.slug }));
}

export async function generateMetadata({ params }: { params: { species: string } }): Promise<Metadata> {
    const species = findSpecies(params.species);
    if (!species) return { title: "Not Found" };
    const counts = await getSpeciesCounts();
    const lower = species.name.toLowerCase();

    return listingMetadata({
        title: `${species.name}: Photos and Questions from Owners in Pakistan`,
        description: `${speciesIntro(species).intro} Photos, questions and advice from ${lower} owners on Paltuu.`,
        path: `/${species.slug}`,
        indexable: (counts[species.slug] ?? 0) >= MIN_POSTS_TO_INDEX,
        keywords: [
            `${species.singular.toLowerCase()} owners pakistan`,
            `${lower} community pakistan`,
            `${species.singular.toLowerCase()} care pakistan`,
            `${lower} forum`,
        ],
    });
}

export default async function SpeciesForumPage({ params }: { params: { species: string } }) {
    const species = findSpecies(params.species);
    if (!species) notFound();

    const [posts, breeds] = await Promise.all([
        listCommunityPosts({ species: species.slug }),
        getBreedCommunities(species),
    ]);
    const guide = speciesIntro(species);
    const path = `/${species.slug}`;
    const crumbs: Crumb[] = [{ name: "Home", href: "/home" }, { name: species.name }];
    const activeBreeds = breeds.filter((b) => b.postCount > 0);
    const noun = species.singular.toLowerCase();

    return (
        <main className="min-h-screen bg-gray-100">
            <JsonLd data={collectionJsonLd({ name: species.name, description: guide.intro, path, posts })} />
            <JsonLd data={breadcrumbJsonLd(crumbs, path)} />

            <ForumHeader speciesSlug={species.slug} name={species.name} intro={guide.intro} />

            <CommunityLayout
                nav={{ activeSpecies: species.slug, breeds }}
                aside={
                    <>
                        <AboutCard title={`About ${species.name}`} intro={guide.intro} topics={guide.topics}>
                            <Link href={`/adopt/${species.slug}`} className="text-sm font-semibold text-primary hover:underline">
                                {species.name} for adoption →
                            </Link>
                        </AboutCard>
                        <FeatureCards />
                        <AppCta />
                    </>
                }
            >
                {activeBreeds.length > 0 && (
                    <div className="mb-4 hidden flex-wrap gap-2 lg:flex">
                        {activeBreeds.map((b) => (
                            <Link
                                key={b.slug}
                                href={`${path}/${b.slug}`}
                                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-400"
                            >
                                {b.communityName}
                            </Link>
                        ))}
                    </div>
                )}
                <Feed
                    posts={posts}
                    empty={{
                        title: `No ${species.name.toLowerCase()} posts yet`,
                        body: `Be the first: share a photo of your ${noun} in the Paltuu app and tag their pet profile.`,
                    }}
                />
            </CommunityLayout>
        </main>
    );
}
