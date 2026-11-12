import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogBySlug, getAllBlogSlugs, getRelatedBlogs, formatDate } from "@/lib/mdx";
import styles from "./blog.module.css";
import { Metadata } from "next";
import ShareButtons from "@/components/blog/ShareButtons";
import BlogCard from "@/components/blog/BlogCard";
import AppStoreBadges from "@/components/home/AppStoreBadges";

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
    const title = `${metadata.title} | Paltuu`;
    const description = metadata.description || `Read ${metadata.title} on Paltuu.pk. Your go-to source for pet care, adoption, and marketplace in Pakistan.`;
    const sitename = "Paltuu.pk";
    const url = `https://www.paltuu.pk/blogs/${metadata.slug}`;

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

    const { metadata, content, faqs } = blog;
    const relatedPosts = getRelatedBlogs(metadata.slug, 3);

    // JSON-LD Schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": metadata.title,
        "description": metadata.description,
        "image": {
            "@type": "ImageObject",
            "url": metadata.featuredImage,
            "width": 1200,
            "height": 630
        },
        "datePublished": metadata.date,
        "dateModified": metadata.updated || metadata.date,
        "author": {
            "@type": "Person",
            "name": metadata.author
        },
        "publisher": {
            "@type": "Organization",
            "name": "Paltuu.pk",
            "url": "https://www.paltuu.pk",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.paltuu.pk/paltu_logo.svg",
                "width": 200,
                "height": 80
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://www.paltuu.pk/blogs/${metadata.slug}`
        },
        "keywords": metadata.tags.join(", "),
        "articleSection": metadata.category,
        "inLanguage": "en-PK",
        "about": {
            "@type": "Thing",
            "name": "Pet care in Pakistan"
        }
    };

    const faqJsonLd = faqs.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
            },
        })),
    } : null;

    const categoryHref = `/blogs?category=${encodeURIComponent(metadata.category)}`;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {faqJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                />
            )}

            {/*
              Landing page style (components/landing): white · primary · gray-100 · white.
              First and last are white because the navbar and footer are maroon
              with rounded edges. Never hardcode the maroon: use bg-primary.
            */}
            <main className="bg-white">
                <article>
                    {/* HEADER */}
                    <header className="bg-white px-5 pt-8 md:pt-12">
                        <div className="mx-auto max-w-3xl">
                            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 overflow-hidden text-[13px] text-gray-500">
                                <Link href="/" className="shrink-0 hover:text-primary">Home</Link>
                                <span aria-hidden="true">/</span>
                                <Link href="/blogs" className="shrink-0 hover:text-primary">Guides</Link>
                                <span aria-hidden="true">/</span>
                                <span className="truncate text-gray-400">{metadata.title}</span>
                            </nav>

                            <Link
                                href={categoryHref}
                                className="mb-4 inline-flex rounded-full bg-gray-100 px-3.5 py-1.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-primary-tint hover:text-primary"
                            >
                                {metadata.category}
                            </Link>

                            <h1 className="mb-4 text-[32px] font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-[40px] lg:text-[52px]">
                                {metadata.title}
                            </h1>

                            <p className="mb-6 text-[17px] leading-relaxed text-gray-600 md:text-lg">{metadata.description}</p>

                            <div className="flex items-center gap-2.5 border-t border-gray-100 pt-5">
                                <span aria-hidden="true" className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary">
                                    {metadata.author.charAt(0)}
                                </span>
                                <span className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{metadata.author}</span>
                                    <span className="text-xs text-gray-600">
                                        <time dateTime={metadata.date}>{formatDate(metadata.date)}</time>
                                        {metadata.readTime && <> · {metadata.readTime}</>}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="mx-auto mt-8 max-w-5xl">
                            <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-3xl bg-gray-100">
                                <Image
                                    src={metadata.featuredImage}
                                    alt={metadata.title}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(min-width: 1024px) 1024px, 100vw"
                                />
                            </div>
                        </div>
                    </header>

                    {/* BODY */}
                    <div className="bg-white px-5 pb-12 pt-10 md:pb-20 md:pt-14">
                        <div className="mx-auto max-w-3xl">
                            <div className={styles.content}>{content}</div>

                            {/* Tags and share */}
                            <div className="mt-10 flex flex-col gap-5 rounded-3xl bg-gray-100 p-5 md:flex-row md:items-center md:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={categoryHref}
                                        className="rounded-full border border-primary bg-white px-3.5 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary-soft"
                                    >
                                        {metadata.category}
                                    </Link>
                                    {metadata.tags.slice(0, 3).map((tag) => (
                                        <Link
                                            key={tag}
                                            href={`/blogs?tag=${encodeURIComponent(tag)}`}
                                            className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
                                        >
                                            {tag}
                                        </Link>
                                    ))}
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <span className="text-[13px] font-semibold text-gray-700">Share</span>
                                    <ShareButtons
                                        url={`https://www.paltuu.pk/blogs/${metadata.slug}`}
                                        title={metadata.title}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </article>

                {/* CTA */}
                <section aria-labelledby="blog-cta-heading" className="bg-primary px-5 py-12 md:py-20">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 id="blog-cta-heading" className="text-xl font-semibold text-white md:text-[28px]">
                            Need a vet for your pet?
                        </h2>
                        <p className="mx-auto mb-6 mt-1.5 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
                            Verified clinics and animal hospitals across Pakistan. Direct contact, no booking fees.
                        </p>
                        <div className="mx-auto flex max-w-md flex-col gap-3">
                            <Link
                                href="/pet-care"
                                data-cta="blog_find_vet"
                                className="flex min-h-[58px] items-center justify-center gap-2.5 rounded-2xl bg-white text-[17px] font-semibold text-primary transition-opacity hover:opacity-90"
                            >
                                Find a vet near you
                                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                            </Link>
                            <Link
                                href="/marketplace"
                                data-cta="blog_shop_supplies"
                                className="flex min-h-[54px] items-center justify-center rounded-2xl border-[1.5px] border-white/60 text-base font-semibold text-white transition-colors hover:bg-white/10"
                            >
                                Shop pet supplies
                            </Link>
                        </div>
                    </div>
                </section>

                {/* RELATED */}
                {relatedPosts.length > 0 && (
                    <section aria-labelledby="related-heading" className="bg-gray-100 px-5 py-12 md:py-20">
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                                <div>
                                    <h2 id="related-heading" className="text-xl font-semibold text-gray-900 md:text-[28px]">
                                        Keep reading
                                    </h2>
                                    <p className="mt-1.5 text-sm text-gray-600">More guides like this one.</p>
                                </div>
                                <Link href="/blogs" className="text-sm font-semibold text-primary hover:underline">
                                    All guides →
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                                {relatedPosts.map((relatedPost) => (
                                    <BlogCard key={relatedPost.slug} post={relatedPost} cta="blog_related_post" />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* White last: the footer below is maroon with a rounded top edge. */}
                <section className="bg-white px-5 py-12 text-center md:py-16">
                    <div className="mx-auto max-w-xl">
                        <p className="mb-1.5 text-[17px] font-bold text-gray-900">The whole community lives in the Paltuu app.</p>
                        <p className="mb-4 text-sm leading-relaxed text-gray-600">
                            Adopt, rehome, find vets and ask other pet parents.
                        </p>
                        <AppStoreBadges className="justify-center" />
                    </div>
                </section>
            </main>
        </>
    );
}
