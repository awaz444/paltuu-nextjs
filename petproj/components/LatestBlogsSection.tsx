import Link from "next/link";
import BlogCard from "@/components/blog/BlogCard";
import { BlogMetadata } from "@/lib/mdx-types";

const LatestBlogsSection = ({ posts }: { posts: BlogMetadata[] }) => {
    if (posts.length === 0) return null;

    // White: the testimonials band directly above this on the homepage is
    // bg-primary, so this one inverts to keep the alternating rhythm.
    return (
        <section className="bg-white px-6 lg:px-12 py-14 md:py-20">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 text-center md:text-left">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
                            Latest from the Paltuu Blog
                        </h2>
                        <p className="text-base text-gray-600 max-w-2xl">
                            Guides on pet adoption, health, and care for pet parents across Pakistan.
                        </p>
                    </div>
                    <Link
                        href="/blogs"
                        className="inline-flex items-center justify-center gap-2 self-center md:self-auto bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                        View All Articles
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {posts.map((post) => (
                        <BlogCard key={post.slug} post={post} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LatestBlogsSection;
