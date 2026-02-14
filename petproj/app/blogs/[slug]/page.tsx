import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/components/blog/data";
import styles from "./blog.module.css";
import BlogCard from "@/components/blog/BlogCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarAlt,
    faClock,
    faUser,
    faShareAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faTwitter, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";

// Mock related posts logic
function getRelatedPosts(currentSlug: string, category: string) {
    return BLOG_POSTS.filter(
        (post) => post.slug !== currentSlug && post.category === category
    ).slice(0, 3);
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);
    if (!post) return { title: "Blog Not Found" };

    return {
        title: `${post.title} | Paltuu Blogs`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: [
                {
                    url: post.image,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            type: "article",
            publishedTime: post.date,
            authors: [post.author],
        },
    };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = getRelatedPosts(post.slug, post.category);
    // If no related posts in same category, just take other recent posts
    const displayRelated =
        relatedPosts.length > 0
            ? relatedPosts
            : BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

    return (
        <main className="bg-white min-h-screen pb-20 font-montserrat">
            {/* Top Section */}
            <div className="relative h-[400px] md:h-[500px] w-full">
                <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover brightness-75"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-20 text-white max-w-7xl mx-auto">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4 inline-block">
                        {post.category}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 drop-shadow-lg">
                        {post.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm font-medium opacity-90">
                        <span className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                            {post.author}
                        </span>
                        <span className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
                            {post.date}
                        </span>
                        <span className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                            {post.readTime}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content */}
                <article className="lg:col-span-8">
                    <div
                        className={`${styles.content} prose prose-lg max-w-none text-gray-800`}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Tags & Share */}
                    <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex gap-2">
                            <span className="text-gray-500 font-semibold">Tags:</span>
                            <span className="text-primary bg-primary/5 px-3 py-1 rounded-full text-sm">
                                {post.category}
                            </span>
                            <span className="text-primary bg-primary/5 px-3 py-1 rounded-full text-sm">
                                Pet Care
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-500 font-semibold">Share:</span>
                            <button className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                                <FontAwesomeIcon icon={faFacebook} className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                                <FontAwesomeIcon icon={faTwitter} className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                                <FontAwesomeIcon icon={faLinkedinIn} className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-12 bg-primary/5 rounded-2xl p-8 text-center border border-primary/20">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Need Professional Pet Advice?
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Connect with verified veterinarians near you for expert guidance on your pet's health.
                        </p>
                        <Link
                            href="/pet-care"
                            className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-primary/90 hover:scale-105 transition-all duration-300"
                        >
                            Find a Vet Now
                        </Link>
                    </div>
                </article>

                {/* Sidebar */}
                <aside className="hidden lg:block lg:col-span-4 space-y-10">
                    <div className="sticky top-24">
                        {/* Categories Widget */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Categories
                            </h4>
                            <ul className="space-y-3">
                                {BLOG_CATEGORIES.filter((c) => c !== "All").map(
                                    (cat, idx) => (
                                        <li key={idx}>
                                            <Link
                                                href="/blogs"
                                                className="flex items-center justify-between text-gray-600 hover:text-primary transition-colors group"
                                            >
                                                <span>{cat}</span>
                                                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full group-hover:bg-primary/10 group-hover:text-primary">
                                                    {Math.floor(Math.random() * 10) + 1}
                                                </span>
                                            </Link>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        {/* Recent Posts Widget */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Recent Posts
                            </h4>
                            <div className="space-y-4">
                                {BLOG_POSTS.slice(0, 3).map((recentPost) => (
                                    <Link
                                        key={recentPost.id}
                                        href={`/blogs/${recentPost.slug}`}
                                        className="flex gap-4 group"
                                    >
                                        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                                            <Image
                                                src={recentPost.image}
                                                alt={recentPost.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                                                {recentPost.title}
                                            </h5>
                                            <span className="text-xs text-gray-500">
                                                {recentPost.date}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Related Posts Grid (Bottom) */}
            <section className="bg-gray-50 py-16 px-6 lg:px-20 mt-10">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        You Might Also Like
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayRelated.map((related) => (
                            <div key={related.id} className="h-full">
                                <BlogCard post={related} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
