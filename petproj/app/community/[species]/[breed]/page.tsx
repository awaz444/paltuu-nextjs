import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
    COMMUNITY_SPECIES,
    MIN_POSTS_TO_INDEX,
    findBreed,
    findSpecies,
    getBreedCommunities,
    getSpeciesCounts,
    listCommunityPosts,
} from "@/lib/community";
import { breedGuide } from "@/lib/breedGuides";
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
// Breeds come from the database, so a breed added later still resolves on first visit.
export const dynamicParams = true;

type Params = { species: string; breed: string };

export async function generateStaticParams() {
    const params: Params[] = [];
    for (const species of COMMUNITY_SPECIES) {
        for (const b of await getBreedCommunities(species)) params.push({ species: species.slug, breed: b.slug });
    }
    return params;
}

async function resolve(params: Params) {
    const species = findSpecies(params.species);
    if (!species) return null;
    const found = await findBreed(species, params.breed);
    if (!found) return null;
    return { species, found };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const r = await resolve(params);
    if (!r || r.found.kind !== "community") return { title: "Not Found" };
    const { species, found: { community } } = r;
    const guide = breedGuide(species.slug, community.slug, community.name, species.name);
    const name = community.communityName;

    return listingMetadata({
        title: `${name} Community — ${community.name} Owners in Pakistan`,
        description: `${guide.intro} Photos and questions from ${community.name} owners on Paltuu.`,
        path: `/community/${species.slug}/${community.slug}`,
        indexable: community.postCount >= MIN_POSTS_TO_INDEX,
        keywords: [
            `${community.name.toLowerCase()} pakistan`,
            `${community.name.toLowerCase()} ${species.singular.toLowerCase()} pakistan`,
            `${community.name.toLowerCase()} owners`,
            `${community.name.toLowerCase()} care`,
            `${community.name.toLowerCase()} community`,
        ],
    });
}

export default async function BreedCommunityPage({ params }: { params: Params }) {
    const r = await resolve(params);
    if (!r) notFound();
    const { species, found } = r;
    // "Persian mix" posts live in the Persian community.
    if (found.kind === "child") permanentRedirect(`/community/${species.slug}/${found.parentSlug}`);
    const community = found.community;

    const [posts, breeds, counts] = await Promise.all([
        listCommunityPosts({ breedId: community.breedId }),
        getBreedCommunities(species),
        getSpeciesCounts(),
    ]);
    const guide = breedGuide(species.slug, community.slug, community.name, species.name);
    const path = `/community/${species.slug}/${community.slug}`;
    const crumbs: Crumb[] = [
        { name: "Home", href: "/" },
        { name: "Community", href: "/community" },
        { name: species.name, href: `/community/${species.slug}` },
        { name: community.communityName },
    ];
    const speciesNoun = species.singular.toLowerCase();

    return (
        <main className="bg-gray-100">
            <JsonLd
                data={collectionJsonLd({ name: `${community.communityName} community`, description: guide.intro, path, posts })}
            />
            <JsonLd data={breadcrumbJsonLd(crumbs, path)} />

            <CommunityHeader
                crumbs={crumbs}
                title={<>{community.communityName} <span className="text-primary">Community</span></>}
                intro={guide.intro}
                stat={
                    community.postCount > 0
                        ? `${community.postCount} ${community.postCount === 1 ? "post" : "posts"} from owners`
                        : undefined
                }
            />

            <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
                <div className="flex flex-col gap-6 lg:flex-row">
                    <CommunityNav
                        activeSpecies={species.slug}
                        activeBreed={community.slug}
                        breeds={breeds}
                        speciesCounts={counts}
                    />

                    <div className="min-w-0 flex-1 space-y-8">
                        <section aria-labelledby="posts-heading">
                            <h2 id="posts-heading" className="mb-4 text-xl font-bold text-gray-900">
                                Latest {community.communityName} posts
                            </h2>
                            <PostGrid
                                posts={posts}
                                showPlace={false}
                                emptyTitle={`No ${community.communityName} posts yet`}
                                emptyBody={`Have a ${community.name}? Share a photo in the Paltuu app and tag your ${speciesNoun}'s pet profile, and it will show up here.`}
                            />
                            {posts.length < MIN_POSTS_TO_INDEX && (
                                <p className="mt-4 text-sm text-gray-500">
                                    Meanwhile, see what all {species.name.toLowerCase()} owners are sharing in the{" "}
                                    <Link href={`/community/${species.slug}`} className="font-medium text-primary hover:underline">
                                        {species.name} community
                                    </Link>
                                    .
                                </p>
                            )}
                        </section>

                        <TopicList title={`What ${community.name} owners talk about`} topics={guide.topics} />

                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="mb-2 text-lg font-bold text-gray-900">Looking to adopt a {speciesNoun}?</h2>
                            <p className="mb-4 text-sm text-gray-600">
                                Owners, shelters and rescues across Pakistan list {species.name.toLowerCase()} for adoption on Paltuu.
                            </p>
                            <Link
                                href={`/adopt/${species.slug}`}
                                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                            >
                                {species.name} for adoption →
                            </Link>
                        </div>

                        <div className="lg:hidden">
                            <AppCta communityName={`the ${community.communityName} community`} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
