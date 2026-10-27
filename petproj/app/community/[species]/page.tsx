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
    AppCta,
    CommunityHeader,
    CommunityNav,
    JsonLd,
    TopicList,
    type Crumb,
} from "@/components/community/CommunityChrome";
import PostGrid from "@/components/community/PostGrid";

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
        title: `${species.name} Community — ${species.singular} Owners in Pakistan`,
        description: `${speciesIntro(species).intro} Photos, questions and advice from ${lower} owners on Paltuu.`,
        path: `/community/${species.slug}`,
        indexable: (counts[species.slug] ?? 0) >= MIN_POSTS_TO_INDEX,
        keywords: [
            `${species.singular.toLowerCase()} owners pakistan`,
            `${lower} community pakistan`,
            `${species.singular.toLowerCase()} care pakistan`,
            `${lower} forum`,
            "paltuu community",
        ],
    });
}

export default async function SpeciesCommunityPage({ params }: { params: { species: string } }) {
    const species = findSpecies(params.species);
    if (!species) notFound();

    const [posts, breeds, counts] = await Promise.all([
        listCommunityPosts({ species: species.slug }),
        getBreedCommunities(species),
        getSpeciesCounts(),
    ]);
    const guide = speciesIntro(species);
    const count = counts[species.slug] ?? 0;
    const path = `/community/${species.slug}`;
    const crumbs: Crumb[] = [
        { name: "Home", href: "/" },
        { name: "Community", href: "/community" },
        { name: species.name },
    ];
    const activeBreeds = breeds.filter((b) => b.postCount > 0);

    return (
        <main className="bg-gray-100">
            <JsonLd
                data={collectionJsonLd({ name: `${species.name} community`, description: guide.intro, path, posts })}
            />
            <JsonLd data={breadcrumbJsonLd(crumbs, path)} />

            <CommunityHeader
                crumbs={crumbs}
                title={<>{species.name} <span className="text-primary">Community</span></>}
                intro={guide.intro}
                stat={count > 0 ? `${count} ${count === 1 ? "post" : "posts"} from ${species.name.toLowerCase()} owners` : undefined}
            />

            <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
                <div className="flex flex-col gap-6 lg:flex-row">
                    <CommunityNav activeSpecies={species.slug} breeds={breeds} speciesCounts={counts} />

                    <div className="min-w-0 flex-1 space-y-8">
                        {activeBreeds.length > 0 && (
                            <section aria-labelledby="breeds-heading">
                                <h2 id="breeds-heading" className="mb-3 text-lg font-bold text-gray-900">
                                    Active {species.singular.toLowerCase()} communities
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {activeBreeds.map((b) => (
                                        <Link
                                            key={b.slug}
                                            href={`${path}/${b.slug}`}
                                            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
                                        >
                                            {b.communityName} <span className="text-gray-400">· {b.postCount}</span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section aria-labelledby="posts-heading">
                            <h2 id="posts-heading" className="mb-4 text-xl font-bold text-gray-900">
                                Latest posts about {species.name.toLowerCase()}
                            </h2>
                            <PostGrid
                                posts={posts}
                                emptyTitle={`No ${species.name.toLowerCase()} posts yet`}
                                emptyBody={`Be the first: share a photo of your ${species.singular.toLowerCase()} in the Paltuu app and tag their pet profile.`}
                            />
                        </section>

                        <TopicList title={`What ${species.singular.toLowerCase()} owners talk about`} topics={guide.topics} />

                        <div className="lg:hidden">
                            <AppCta communityName={`the ${species.name} community`} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
