import Link from "next/link";
import type { Metadata } from "next";
import {
    COMMUNITY_SPECIES,
    getSpeciesCounts,
    getTotalPublicPosts,
    listCommunityPosts,
} from "@/lib/community";
import { breadcrumbJsonLd, collectionJsonLd, listingMetadata } from "@/lib/communitySeo";
import {
    AppCta,
    CommunityHeader,
    CommunityNav,
    JsonLd,
    type Crumb,
} from "@/components/community/CommunityChrome";
import PostGrid from "@/components/community/PostGrid";

export const revalidate = 600;

const TITLE = "Community — Cat, Dog and Bird Owners in Pakistan";
const DESCRIPTION =
    "The Paltuu community: cat, dog and bird owners across Pakistan sharing photos, asking questions and helping each other, organised by species and breed.";
const PATH = "/community";

export const metadata: Metadata = listingMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    indexable: true,
    keywords: [
        "pet community pakistan",
        "cat owners pakistan",
        "dog owners pakistan",
        "pet forum pakistan",
        "persian cat community",
        "paltuu community",
    ],
});

export default async function CommunityHubPage() {
    const [posts, counts, total] = await Promise.all([
        listCommunityPosts(),
        getSpeciesCounts(),
        getTotalPublicPosts(),
    ]);

    const crumbs: Crumb[] = [{ name: "Home", href: "/" }, { name: "Community" }];

    return (
        <main className="bg-gray-100">
            <JsonLd data={collectionJsonLd({ name: "Paltuu Community", description: DESCRIPTION, path: PATH, posts })} />
            <JsonLd data={breadcrumbJsonLd(crumbs, PATH)} />

            <CommunityHeader
                crumbs={crumbs}
                title={<>The Paltuu <span className="text-primary">Community</span></>}
                intro="Pet owners across Pakistan sharing photos, everyday moments and questions about their cats, dogs, birds and more. Pick your pet below, or browse the latest posts."
                stat={total > 0 ? `${total.toLocaleString("en-US")} public posts from owners on the Paltuu app` : undefined}
            />

            <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
                <div className="flex flex-col gap-6 lg:flex-row">
                    <CommunityNav speciesCounts={counts} />

                    <div className="min-w-0 flex-1">
                        <section aria-labelledby="species-heading" className="mb-10">
                            <h2 id="species-heading" className="mb-4 text-xl font-bold text-gray-900">
                                Communities by pet
                            </h2>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {COMMUNITY_SPECIES.map((s) => (
                                    <Link
                                        key={s.slug}
                                        href={`/community/${s.slug}`}
                                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-primary hover:shadow-md"
                                    >
                                        <span className="block text-base font-bold text-gray-900">{s.name}</span>
                                        <span className="text-sm text-gray-500">
                                            {counts[s.slug]
                                                ? `${counts[s.slug]} ${counts[s.slug] === 1 ? "post" : "posts"}`
                                                : "Be the first to post"}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        <section aria-labelledby="latest-heading">
                            <h2 id="latest-heading" className="mb-4 text-xl font-bold text-gray-900">
                                Latest from the community
                            </h2>
                            <PostGrid
                                posts={posts}
                                emptyTitle="No posts yet"
                                emptyBody="Posts from the Paltuu app will show up here."
                            />
                        </section>

                        <div className="mt-10 lg:hidden">
                            <AppCta />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
