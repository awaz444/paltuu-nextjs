import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogBySlug, getAllBlogSlugs, getRelatedBlogs, formatDate } from "@/lib/mdx";
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

// Generate static params for all blog posts
export async function generateStaticParams() {
    const slugs = getAllBlogSlugs();
    return slugs.map((slug) => ({
        slug: slug,
    }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const blog = await getBlogBySlug(params.slug);

    if (!blog) {
        return {
            title: "Blog Not Found | Paltuu.pk",
            description: "The requested blog post could not be found.",
        };
    }

    const { metadata } = blog;
    const title = `${metadata.title} | Paltuu.pk - Pakistan's #1 Pet Community`;
    const description = metadata.description || `Read ${metadata.title} on Paltuu.pk. Your go-to source for pet care, adoption, and marketplace in Pakistan.`;
    const sitename = "Paltuu.pk";
    const url = `https://paltuu.pk/blogs/${metadata.slug}`;

    return {
        title: {
            absolute: title,
        },
        description: description,
        keywords: metadata.tags.join(', '),
        openGraph: {
            title: title,
            description: description,
            url: url,
            siteName: sitename,
            images: [
                {
                    url: metadata.featuredImage,
                    width: 1200,
                    height: 630,
                    alt: metadata.title,
                },
            ],
            type: "article",
            publishedTime: metadata.date,
            authors: [metadata.author],
            tags: metadata.tags,
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: description,
            images: [metadata.featuredImage],
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

// Main Blog Post Page Component
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const blog = await getBlogBySlug(params.slug);

    if (!blog) {
        notFound();
    }

    const { metadata, content } = blog;
    const relatedPosts = getRelatedBlogs(metadata.slug, 3);

    // JSON-LD Schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": metadata.title,
        "description": metadata.description,
        "image": metadata.featuredImage,
        "datePublished": metadata.date,
        "dateModified": metadata.date,
        "author": {
            "@type": "Person",
            "name": metadata.author,
            "url": "https://paltuu.pk/about-us"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Paltuu.pk",
            "logo": {
                "@type": "ImageObject",
                "url": "https://paltuu.pk/logo.png"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://paltuu.pk/blogs/${metadata.slug}`
        },
        "keywords": metadata.tags.join(', '),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <main className="bg-gray-50 min-h-screen font-montserrat">
                {/* Hero Section with Breadcrumb */}
                <header className="relative w-full h-[500px] md:h-[600px] lg:h-[650px]">
                    {/* Background Image with Overlay */}
                    <Image
                        src={metadata.featuredImage}
                        alt={metadata.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

                    {/* Content Container */}
                    <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Breadcrumb - Top */}
                        <nav className="absolute top-8 left-4 right-4 sm:left-6 sm:right-6 lg:left-8 lg:right-8 flex items-center text-sm text-white/90 overflow-x-auto">
                            <Link href="/" className="hover:text-white transition-colors flex items-center gap-2 group">
                                <FontAwesomeIcon icon={faHome} className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                <span>Home</span>
                            </Link>
                            <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 mx-3 text-white/40" />
                            <Link href="/blogs" className="hover:text-white transition-colors">
                                Blogs
                            </Link>
                            <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 mx-3 text-white/40" />
                            <Link href={`/blogs?category=${metadata.category}`} className="hover:text-white transition-colors">
                                {metadata.category}
                            </Link>
                            <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 mx-3 text-white/40" />
                            <span className="text-white/60 truncate max-w-[250px]">{metadata.title}</span>
                        </nav>

                        {/* Title and Meta - Centered */}
                        <div className="h-full flex items-center">
                            <div className="text-white">
                                <Link
                                    href={`/blogs?category=${metadata.category}`}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-white hover:text-primary transition-all duration-300 text-white text-xs font-bold px-5 py-2 rounded-full uppercase tracking-wider mb-6 shadow-lg"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {metadata.category}
                                </Link>

                                <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-8 drop-shadow-2xl max-w-5xl">
                                    {metadata.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-medium">
                                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white overflow-hidden">
                                            <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                                        </div>
                                        <span className="font-semibold">{metadata.author}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-primary" />
                                        <time dateTime={metadata.date} className="font-medium">{formatDate(metadata.date)}</time>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{metadata.readTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Article */}
                        <article className="lg:col-span-8">
                            {/* Content Card */}
                            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                                {/* Article Content */}
                                <div className="p-8 md:p-12 lg:p-16">
                                    {/* Excerpt/Lead */}
                                    <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-10 font-medium border-l-4 border-primary pl-6 italic">
                                        {metadata.description}
                                    </p>

                                    {/* Main MDX Content */}
                                    <div
                                        className={`${styles.content} prose prose-xl prose-slate max-w-none 
                                        prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-6 prose-headings:mt-10
                                        prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl
                                        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                                        prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:text-primary/80 hover:prose-a:underline
                                        prose-strong:text-gray-900 prose-strong:font-bold
                                        prose-ul:my-6 prose-ol:my-6 prose-li:text-gray-700 prose-li:my-2
                                        prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-10
                                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                                        prose-code:text-primary prose-code:bg-primary/10 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-medium`}
                                    >
                                        {content}
                                    </div>
                                </div>

                                {/* Article Footer */}
                                <div className="bg-gray-50 px-8 md:px-12 lg:px-16 py-8 border-t border-gray-100">
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                        {/* Tags */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-gray-500 font-bold text-sm uppercase tracking-wide">Tagged:</span>
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/blogs?category=${metadata.category}`}
                                                    className="inline-flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary hover:text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-md"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {metadata.category}
                                                </Link>
                                                {metadata.tags.slice(0, 3).map((tag) => (
                                                    <Link
                                                        key={tag}
                                                        href={`/blogs?tag=${tag}`}
                                                        className="text-gray-700 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                                                    >
                                                        {tag}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Share Buttons */}
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 font-bold text-sm uppercase tracking-wide">Share:</span>
                                            <div className="flex gap-2">
                                                <button
                                                    className="w-11 h-11 rounded-xl bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all duration-300"
                                                    aria-label="Share on Facebook"
                                                >
                                                    <FontAwesomeIcon icon={faFacebook} className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="w-11 h-11 rounded-xl bg-[#1DA1F2] text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all duration-300"
                                                    aria-label="Share on Twitter"
                                                >
                                                    <FontAwesomeIcon icon={faTwitter} className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="w-11 h-11 rounded-xl bg-[#0077b5] text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all duration-300"
                                                    aria-label="Share on LinkedIn"
                                                >
                                                    <FontAwesomeIcon icon={faLinkedinIn} className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="w-11 h-11 rounded-xl bg-[#25D366] text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all duration-300"
                                                    aria-label="Share on WhatsApp"
                                                >
                                                    <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="mt-10 bg-[#a03048] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                                <div className="relative z-10 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-bold mb-4">
                                        Need Expert Pet Care?
                                    </h3>
                                    <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                                        Connect with certified veterinarians and access premium pet care services tailored to your furry friend's unique needs.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Link
                                            href="/pet-care"
                                            className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Find a Vet Near You
                                        </Link>
                                        <Link
                                            href="/marketplace"
                                            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            Shop Pet Supplies
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </article>

                        {/* Sidebar */}
                        <aside className="lg:col-span-4 space-y-6">
                            <div className="sticky top-24 space-y-6">
                                {/* Author Card */}
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                                            {metadata.author.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Written by</p>
                                            <h4 className="text-lg font-bold text-gray-900">{metadata.author}</h4>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Pet care expert passionate about sharing knowledge to help pet owners provide the best for their furry companions.
                                    </p>
                                </div>

                                {/* Related Posts Widget */}
                                {relatedPosts.length > 0 && (
                                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                        <h4 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
                                            Related Articles
                                        </h4>
                                        <div className="space-y-5">
                                            {relatedPosts.map((relatedPost) => (
                                                <Link
                                                    key={relatedPost.slug}
                                                    href={`/blogs/${relatedPost.slug}`}
                                                    className="flex gap-4 group items-start"
                                                >
                                                    <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                                                        <Image
                                                            src={relatedPost.featuredImage}
                                                            alt={relatedPost.title}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-bold text-gray-800 text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2 leading-snug">
                                                            {relatedPost.title}
                                                        </h5>
                                                        <div className="flex items-center text-xs text-gray-400 gap-2">
                                                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                                                            <span>{formatDate(relatedPost.date)}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Newsletter Widget */}
                                <div className="bg-[#a03048]/10 rounded-2xl p-6 border border-primary/20">
                                    <div className="text-center">
                                        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/20 rounded-2xl mb-4">
                                            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">Stay Updated</h4>
                                        <p className="text-gray-600 text-sm mb-5">Get weekly pet care tips delivered to your inbox</p>
                                        <div className="space-y-3">
                                            <input
                                                type="email"
                                                placeholder="Your email address"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                            />
                                            <button className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 hover:shadow-lg transition-all duration-300">
                                                Subscribe Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}