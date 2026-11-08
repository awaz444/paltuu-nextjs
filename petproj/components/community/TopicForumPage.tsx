import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MIN_POSTS_TO_INDEX, findTopic, getTopicCounts, listCommunityPosts } from "@/lib/community";
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

// The listing pages are where pets are actually listed; the forum links to them.
const LINKS: Record<string, { label: string; href: string }[]> = {
    adoption: [
        { label: "Pets for adoption", href: "/adopt" },
        { label: "Cats for adoption", href: "/adopt/cats" },
        { label: "Dogs for adoption", href: "/adopt/dogs" },
        { label: "List a pet", href: "/create-listing" },
    ],
    // The lost & found listing pages are hidden for now (PALTU-110), so this
    // forum has no listing links until they come back.
    "lost-found": [],
};

const EMPTY: Record<string, { title: string; body: string }> = {
    adoption: {
        title: "No adoption posts yet",
        body: "Looking for a home for a pet, or hoping to adopt? Post about it in the Paltuu app.",
    },
    "lost-found": {
        title: "No lost or found posts yet",
        body: "Lost a pet or found one? Post it in the Paltuu app with a photo and the area.",
    },
};

/** Shared by the static routes app/adoption and app/lost-found, which sit next to app/[species]. */
export async function topicMetadata(slug: string): Promise<Metadata> {
    const topic = findTopic(slug);
    if (!topic) return { title: "Not Found" };
    const counts = await getTopicCounts();

    return listingMetadata({
        title: `${topic.title} in Pakistan: Posts from Pet Owners`,
        description: `${topic.intro} On Paltuu.`,
        path: `/${topic.slug}`,
        indexable: (counts[topic.slug] ?? 0) >= MIN_POSTS_TO_INDEX,
        keywords:
            topic.slug === "adoption"
                ? ["pet adoption pakistan", "adopt a cat pakistan", "adopt a dog pakistan", "rehome pet pakistan", "foster pets pakistan"]
                : ["lost pet pakistan", "found pet pakistan", "lost cat karachi", "lost dog lahore", "missing pet pakistan"],
    });
}

export default async function TopicForumPage({ slug }: { slug: string }) {
    const topic = findTopic(slug);
    if (!topic) notFound();

    const posts = await listCommunityPosts({ topic: topic.slug });
    const path = `/${topic.slug}`;
    const crumbs: Crumb[] = [{ name: "Home", href: "/home" }, { name: topic.name }];
    const links = LINKS[topic.slug] ?? [];

    return (
        <main className="min-h-screen bg-gray-100">
            <JsonLd data={collectionJsonLd({ name: topic.title, description: topic.intro, path, posts })} />
            <JsonLd data={breadcrumbJsonLd(crumbs, path)} />

            <ForumHeader speciesSlug={topic.slug} name={topic.name} intro={topic.intro} />

            <CommunityLayout
                nav={{ activeTopic: topic.slug }}
                aside={
                    <>
                        <AboutCard title={`About ${topic.name}`} intro={topic.intro} topics={topic.topics} />
                        <FeatureCards />
                        <AppCta />
                    </>
                }
            >
                {links.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {links.map((n) => (
                        <Link
                            key={n.href}
                            href={n.href}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-400"
                        >
                            {n.label}
                        </Link>
                    ))}
                </div>
                )}
                <Feed posts={posts} empty={EMPTY[topic.slug]} />
            </CommunityLayout>
        </main>
    );
}
