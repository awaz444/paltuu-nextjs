import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, BLOG_CATEGORIES, BlogPost } from "@/components/blog/data";
import styles from "./blog.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarAlt,
    faClock,
    faUser,
    faChevronRight,
    faHome,
} from "@fortawesome/free-solid-svg-icons";
import {
    faFacebook,
    faTwitter,
    faLinkedinIn,
    faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import { Metadata } from "next";

// --- Helper Functions ---

// Get related posts
function getRelatedPosts(currentSlug: string, category: string) {
    return BLOG_POSTS.filter(
        (post) => post.slug !== currentSlug && post.category === category
    ).slice(0, 3);
}

// Inject internal links into content (Safe simple replacement)
// This function attempts to link key terms to internal pages without breaking HTML tags.
// It targets the first occurrence of each keyword.
function injectInternalLinks(content: string): string {
    const links = [
        { term: "adoption", url: "/rescue-pets" },
        { term: "rescue", url: "/rescue-pets" },
        { term: "vet", url: "/pet-care" },
        { term: "veterinarian", url: "/pet-care" },
        { term: "food", url: "/marketplace" },
        { term: "nutrition", url: "/marketplace" },
        { term: "grooming", url: "/pet-care" }, // General pet care fallback
        { term: "training", url: "/pet-care" },
    ];

    let newContent = content;

    // We will inject a CTA related to topics found in the text
    const foundTopic = links.find(l => content.toLowerCase().includes(l.term));
    if (foundTopic) {
        const ctaHtml = `
            <div class="my-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
                <h4 class="text-lg font-bold text-gray-900 mb-2">Looking for ${foundTopic.term} options?</h4>
                <p class="mb-4 text-gray-600">Explore our dedicated section for ${foundTopic.term} on Paltuu.</p>
                <a href="${foundTopic.url}" class="inline-block bg-primary text-white font-medium px-6 py-2 rounded-full hover:bg-primary/90 transition-colors">
                    Explore ${foundTopic.term.charAt(0).toUpperCase() + foundTopic.term.slice(1)}
                </a>
            </div>
        `;
        // Insert after first closing </p>
        newContent = newContent.replace('</p>', `</p>${ctaHtml}`);
    }

    return newContent;
}

// --- Metadata Generation ---

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);
    if (!post) {
        return {
            title: "Blog Not Found | Paltuu.pk",
            description: "The requested blog post could not be found.",
        };
    }

    const title = `${post.title} | Paltuu.pk - Pakistan's #1 Pet Community`;
    const description = post.excerpt || `Read ${post.title} on Paltuu.pk. Your go-to source for pet care, adoption, and marketplace in Pakistan.`;
    const sitename = "Paltuu.pk";
    const url = `https://paltuu.pk/blogs/${post.slug}`;

    return {
        title: {
            absolute: title,
        },
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: url,
            siteName: sitename,
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
            tags: [post.category, "Pet Care", "Pakistan"],
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: description,
            images: [post.image],
        },
        alternates: {
            canonical: url,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

// --- Main Page Component ---

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = getRelatedPosts(post.slug, post.category);
    // Fallback if no related posts in same category
    const displayRelated =
        relatedPosts.length > 0
            ? relatedPosts
            : BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

    const processedContent = injectInternalLinks(post.content);

    // JSON-LD Schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.excerpt,
        "image": post.image,
        "datePublished": post.date, // Note: Assuming date format is compatible or standard string
        "dateModified": post.date, // Use same date if no modified date available
        "author": {
            "@type": "Person",
            "name": post.author,
            "url": "https://paltuu.pk/about-us" // Example author URL
        },
        "publisher": {
            "@type": "Organization",
            "name": "Paltuu.pk",
            "logo": {
                "@type": "ImageObject",
                "url": "https://paltuu.pk/logo.png" // Replace with actual logo URL
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://paltuu.pk/blogs/${post.slug}`
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <main className="bg-white min-h-screen pb-20 font-montserrat">
                {/* Breadcrumb Navigation */}
                <div className="bg-gray-50 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <nav className="flex items-center text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
                            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                                <FontAwesomeIcon icon={faHome} className="w-3 h-3" />
                                Home
                            </Link>
                            <FontAwesomeIcon icon={faChevronRight} className="w-2 h-2 mx-3 text-gray-300" />
                            <Link href="/blogs" className="hover:text-primary transition-colors">
                                Blogs
                            </Link>
                            <FontAwesomeIcon icon={faChevronRight} className="w-2 h-2 mx-3 text-gray-300" />
                            <Link href={`/blogs?category=${post.category}`} className="hover:text-primary transition-colors">
                                {post.category}
                            </Link>
                            <FontAwesomeIcon icon={faChevronRight} className="w-2 h-2 mx-3 text-gray-300" />
                            <span className="text-gray-900 font-medium truncate max-w-[200px]">{post.title}</span>
                        </nav>
                    </div>
                </div>

                {/* Hero Section */}
                <header className="relative w-full h-[400px] md:h-[500px]">
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover brightness-[0.70]"
                        priority
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-20 text-white max-w-7xl mx-auto">
                        <Link
                            href={`/blogs?category=${post.category}`}
                            className="bg-primary hover:bg-white hover:text-primary transition-all duration-300 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6 inline-block"
                        >
                            {post.category}
                        </Link>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg max-w-4xl">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 md:gap-8 text-sm md:text-base font-medium text-gray-100">
                            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden border-2 border-primary">
                                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                                </div>
                                <span>{post.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-primary" />
                                <time dateTime={post.date}>{post.date}</time>
                            </div>
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-primary" />
                                <span>{post.readTime}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Column */}
                    <article className="lg:col-span-8">
                        {/* Content Wrapper */}
                        <div
                            className={`${styles.content} prose prose-lg prose-slate max-w-none 
                            prose-headings:font-bold prose-headings:text-gray-900 
                            prose-p:text-gray-700 prose-p:leading-relaxed
                            prose-a:text-primary prose-a:font-medium hover:prose-a:text-primary/80
                            prose-img:rounded-2xl prose-img:shadow-lg`}
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />

                        {/* Article Footer: Tags & Share */}
                        <div className="mt-16 pt-8 border-t border-gray-100">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-semibold text-sm uppercase tracking-wide">Tags:</span>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={`/blogs?category=${post.category}`} className="text-primary bg-primary/5 hover:bg-primary/10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors">
                                            {post.category}
                                        </Link>
                                        <Link href="/blogs" className="text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-medium transition-colors">
                                            Pet Care
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-500 font-semibold text-sm uppercase tracking-wide">Share:</span>
                                    <div className="flex gap-2">
                                        <button className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity aria-label='Share on Facebook'">
                                            <FontAwesomeIcon icon={faFacebook} className="w-5 h-5" />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity aria-label='Share on Twitter'">
                                            <FontAwesomeIcon icon={faTwitter} className="w-5 h-5" />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-[#0077b5] text-white flex items-center justify-center hover:opacity-90 transition-opacity aria-label='Share on LinkedIn'">
                                            <FontAwesomeIcon icon={faLinkedinIn} className="w-5 h-5" />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity aria-label='Share on WhatsApp'">
                                            <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 md:p-12 text-center border border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-500"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                    Need Professional Pet Advice?
                                </h3>
                                <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
                                    Connect with verified veterinarians near you for expert guidance on your pet's health and wellness journey.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/pet-care"
                                        className="inline-block bg-primary text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
                                    >
                                        Find a Vet Now
                                    </Link>
                                    <Link
                                        href="/marketplace"
                                        className="inline-block bg-white text-gray-800 font-bold py-3.5 px-8 rounded-full shadow-md hover:shadow-lg border border-gray-100 hover:bg-gray-50 transition-all duration-300"
                                    >
                                        Shop Supplies
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside className="hidden lg:block lg:col-span-4 space-y-8">
                        <div className="sticky top-24 space-y-8">
                            {/* Categories Widget */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h4 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center justify-between">
                                    <span>Categories</span>
                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{BLOG_CATEGORIES.length - 1}</span>
                                </h4>
                                <ul className="space-y-2">
                                    {BLOG_CATEGORIES.filter((c) => c !== "All").map(
                                        (cat, idx) => (
                                            <li key={idx}>
                                                <Link
                                                    href={`/blogs?category=${cat}`}
                                                    className="flex items-center justify-between p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-all group"
                                                >
                                                    <span className="font-medium group-hover:translate-x-1 transition-transform">{cat}</span>
                                                    <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>

                            {/* Recent Posts Widget */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h4 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
                                    Recent Posts
                                </h4>
                                <div className="space-y-6">
                                    {BLOG_POSTS.slice(0, 3).map((recentPost) => (
                                        <Link
                                            key={recentPost.id}
                                            href={`/blogs/${recentPost.slug}`}
                                            className="flex gap-4 group items-start"
                                        >
                                            <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                                <Image
                                                    src={recentPost.image}
                                                    alt={recentPost.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-gray-800 text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2 leading-snug">
                                                    {recentPost.title}
                                                </h5>
                                                <div className="flex items-center text-xs text-gray-400 gap-2">
                                                    <span>{recentPost.date}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Related Posts Grid (Bottom) */}
                <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 mt-12 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <span className="text-primary text-sm font-bold uppercase tracking-widest mb-2 block">Keep Reading</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                You Might Also Like
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayRelated.map((related) => (
                                <Link key={related.id} href={`/blogs/${related.slug}`} className="group h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
                                    <div className="relative h-56 w-full overflow-hidden">
                                        <Image
                                            src={related.image}
                                            alt={related.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                                            {related.category}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                            <span className="flex items-center gap-1">
                                                <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                                                {related.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                                                {related.readTime}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                            {related.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                                            {related.excerpt}
                                        </p>
                                        <div className="flex items-center text-primary font-bold text-sm mt-auto group-hover:gap-2 transition-all">
                                            Read Article <FontAwesomeIcon icon={faChevronRight} className="ml-1 w-3 h-3" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
