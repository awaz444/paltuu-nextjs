import Link from "next/link";
import BlogCard from "@/components/blog/BlogCard";
import { BlogMetadata } from "@/lib/mdx-types";

const LatestBlogsSection = ({ posts }: { posts: BlogMetadata[] }) => {
    if (posts.length === 0) return null;

    return (
        <section className="py-16 px-6 lg:px-20 bg-gray-50 border-t border-gray-100">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 text-center md:text-left">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
                            Latest from the Paltuu Blog
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            Guides on pet adoption, health, and care for pet parents across Pakistan.
                        </p>
                    </div>
                    <Link
                        href="/blogs"
                        className="inline-flex items-center justify-center gap-2 self-center md:self-auto bg-primary text-white font-semibold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                        View All Articles
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <BlogCard key={post.slug} post={post} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LatestBlogsSection;
