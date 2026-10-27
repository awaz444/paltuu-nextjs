import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
    COMMUNITY_SPECIES,
    MIN_POSTS_TO_INDEX,
    findBreed,
    findSpecies,
    getBreedCommunities,
    listCommunityPosts,
} from "@/lib/community";
import { breedGuide } from "@/lib/breedGuides";
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
import { speciesEmoji } from "@/components/community/forumMeta";

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

    return listingMetadata({
        title: `${community.communityName}: Photos and Questions from Owners in Pakistan`,
        description: `${guide.intro} Photos and questions from ${community.name} owners on Paltuu.`,
        path: `/${species.slug}/${community.slug}`,
        indexable: community.postCount >= MIN_POSTS_TO_INDEX,
        keywords: [
            `${community.name.toLowerCase()} pakistan`,
            `${community.name.toLowerCase()} ${species.singular.toLowerCase()} pakistan`,
            `${community.name.toLowerCase()} owners`,
            `${community.name.toLowerCase()} care`,
            `${community.name.toLowerCase()} forum`,
        ],
    });
}

export default async function BreedForumPage({ params }: { params: Params }) {
    const r = await resolve(params);
    if (!r) notFound();
    const { species, found } = r;
    // "Persian mix" posts live in the Persian forum.
    if (found.kind === "child") permanentRedirect(`/${species.slug}/${found.parentSlug}`);
    const community = found.community;

    const [posts, breeds] = await Promise.all([
        listCommunityPosts({ breedId: community.breedId }),
        getBreedCommunities(species),
    ]);
    const guide = breedGuide(species.slug, community.slug, community.name, species.name);
    const path = `/${species.slug}/${community.slug}`;
    const name = community.communityName;
    const crumbs: Crumb[] = [
        { name: "Home", href: "/home" },
        { name: species.name, href: `/${species.slug}` },
        { name },
    ];
    const noun = species.singular.toLowerCase();

    return (
        <main className="min-h-screen bg-gray-100">
            <JsonLd data={collectionJsonLd({ name, description: guide.intro, path, posts })} />
            <JsonLd data={breadcrumbJsonLd(crumbs, path)} />

            <ForumHeader
                emoji={speciesEmoji(species.slug)}
                name={name}
                parent={{ name: species.name, href: `/${species.slug}` }}
                intro={guide.intro}
            />

            <CommunityLayout
                nav={{ activeSpecies: species.slug, activeBreed: community.slug, breeds }}
                aside={
                    <>
                        <AboutCard title={`About ${name}`} intro={guide.intro} topics={guide.topics}>
                            <Link href={`/adopt/${species.slug}`} className="text-sm font-semibold text-primary hover:underline">
                                {species.name} for adoption →
                            </Link>
                        </AboutCard>
                        <FeatureCards />
                        <AppCta />
                    </>
                }
            >
                <Feed
                    posts={posts}
                    showForum={false}
                    empty={{
                        title: `No posts in ${name} yet`,
                        body: `Have a ${community.name}? Share a photo in the Paltuu app and tag your ${noun}'s pet profile, and it will show up here.`,
                    }}
                />
                {posts.length < MIN_POSTS_TO_INDEX && (
                    <p className="mt-4 text-sm text-gray-500">
                        See what all {species.name.toLowerCase()} owners are sharing in{" "}
                        <Link href={`/${species.slug}`} className="font-medium text-primary hover:underline">
                            {species.name}
                        </Link>
                        .
                    </p>
                )}
            </CommunityLayout>
        </main>
    );
}
