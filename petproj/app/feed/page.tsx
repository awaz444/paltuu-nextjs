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
    AboutCard,
    AppCta,
    CommunityLayout,
    Feed,
    JsonLd,
    type Crumb,
} from "@/components/community/CommunityChrome";
import { speciesEmoji } from "@/components/community/forumMeta";

export const revalidate = 600;

const TITLE = "Pet Owners in Pakistan — Latest Photos and Questions";
const DESCRIPTION =
    "What pet owners across Pakistan are sharing on Paltuu: photos, questions and advice about cats, dogs and birds, organised by species and breed.";
const PATH = "/feed";

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

export default async function FeedPage() {
    const [posts, counts, total] = await Promise.all([
        listCommunityPosts(),
        getSpeciesCounts(),
        getTotalPublicPosts(),
    ]);
    const crumbs: Crumb[] = [{ name: "Home", href: "/" }, { name: "Feed" }];
    const busiest = [...COMMUNITY_SPECIES].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0));

    return (
        <main className="min-h-screen bg-gray-100">
            <JsonLd data={collectionJsonLd({ name: "Paltuu feed", description: DESCRIPTION, path: PATH, posts })} />
            <JsonLd data={breadcrumbJsonLd(crumbs, PATH)} />
            <h1 className="sr-only">Latest from pet owners in Pakistan on Paltuu</h1>

            <CommunityLayout
                nav={{ speciesCounts: counts }}
                aside={
                    <>
                        <AboutCard
                            title="About Paltuu"
                            intro="Pet owners across Pakistan sharing photos, everyday moments and questions about their cats, dogs, birds and more."
                            stats={[{ label: "Public posts", value: total.toLocaleString("en-US") }]}
                        >
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Forums</h3>
                            <ul className="space-y-1">
                                {busiest.map((s) => (
                                    <li key={s.slug}>
                                        <Link
                                            href={`/${s.slug}`}
                                            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <span aria-hidden>{speciesEmoji(s.slug)}</span>
                                            <span className="flex-1 font-medium">{s.name}</span>
                                            <span className="text-xs text-gray-400">
                                                {counts[s.slug] ? `${counts[s.slug]} posts` : "New"}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </AboutCard>
                        <AppCta compact />
                    </>
                }
            >
                <p className="mb-3 text-sm font-semibold text-gray-700">Latest posts</p>
                <Feed posts={posts} empty={{ title: "No posts yet", body: "Posts from the Paltuu app will show up here." }} />
                <div className="mt-6 lg:hidden">
                    <AppCta />
                </div>
            </CommunityLayout>
        </main>
    );
}
