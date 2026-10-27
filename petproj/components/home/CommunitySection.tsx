import Link from "next/link";
import { COMMUNITY_SPECIES, type CommunityPost } from "@/lib/community";
import PostCard from "@/components/community/PostCard";

/**
 * Latest public posts from the community, rendered on the server with the rest
 * of the (statically generated) home page. Hidden when there is nothing to show.
 */
export default function CommunitySection({ posts }: { posts: CommunityPost[] }) {
    if (posts.length === 0) return null;

    return (
        <section aria-labelledby="community-heading" className="bg-gray-50 px-6 py-14 md:py-20 lg:px-12">
            <div className="mx-auto max-w-6xl">
                <header className="mb-9 max-w-2xl">
                    <h2 id="community-heading" className="mb-3 text-2xl font-extrabold text-gray-900 md:text-3xl">
                        From the Paltuu community
                    </h2>
                    <p className="text-base leading-relaxed text-gray-600">
                        Owners across Pakistan sharing their pets and asking each other for advice, organised by
                        species and breed.
                    </p>
                </header>

                <div className="mb-8 grid grid-cols-1 items-start gap-5 sm:grid-cols-3">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/community"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                        Explore the community →
                    </Link>
                    {COMMUNITY_SPECIES.slice(0, 3).map((s) => (
                        <Link
                            key={s.slug}
                            href={`/community/${s.slug}`}
                            className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
                        >
                            {s.name}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
