import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BlogMetadata } from "@/lib/mdx-types";

/**
 * A blog post card in the landing page style (components/landing): white
 * rounded-3xl card with a rounded-2xl photo inset, no shadow, maroon border on
 * hover. Made for a gray-100 section; pass onWhite on a white one so the card
 * keeps an edge.
 */

interface BlogCardProps {
    post: BlogMetadata;
    /** data-cta name for analytics, e.g. "blog_related_post". */
    cta?: string;
    /** On a white background: a gray-200 border instead of none. */
    onWhite?: boolean;
}

// Client-safe: the same output on server and browser.
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const BlogCard: React.FC<BlogCardProps> = ({ post, cta, onWhite = false }) => {
    return (
        <Link
            href={`/blogs/${post.slug}`}
            data-cta={cta}
            className={`group flex h-full flex-col rounded-3xl border-2 bg-white p-3 transition-colors hover:border-primary ${
                onWhite ? "border-gray-200" : "border-transparent"
            }`}
        >
            <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gray-200">
                <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    sizes="(min-width: 768px) 360px, 92vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
            </div>

            <div className="flex flex-grow flex-col px-1.5 pb-1.5">
                {post.category && <span className="mb-1 text-xs font-semibold text-primary">{post.category}</span>}
                <h3 className="mb-1.5 line-clamp-2 font-bold leading-snug text-gray-900">{post.title}</h3>
                <p className="mb-3 line-clamp-2 flex-grow text-sm leading-relaxed text-gray-600">{post.description}</p>
                <p className="text-xs text-gray-500">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    {post.readTime && <> · {post.readTime}</>}
                </p>
            </div>
        </Link>
    );
};

export default BlogCard;
