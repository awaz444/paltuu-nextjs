"use client";

import React, { useEffect, useMemo, useState } from "react";
import BlogCard from "@/components/blog/BlogCard";
import AppStoreBadges from "@/components/home/AppStoreBadges";
import { BlogMetadata } from "@/lib/mdx-types";

/**
 * /blogs in the landing page style (components/landing/PakistanLanding):
 * white hero · gray-100 grid · white app line. First and last sections are
 * white because the navbar and footer are maroon with rounded edges.
 *
 * Post pages link here with ?category= and ?tag=, read once on mount (no
 * useSearchParams, so the page stays statically rendered).
 */

interface BlogsPageClientProps {
    allBlogs: BlogMetadata[];
    categories: string[];
}

export default function BlogsPageClient({ allBlogs, categories }: BlogsPageClientProps) {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const category = params.get("category");
        const tag = params.get("tag");
        if (category && categories.includes(category)) setSelectedCategory(category);
        if (tag) setSelectedTag(tag);
    }, [categories]);

    const filteredPosts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return allBlogs.filter((post) => {
            const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
            const matchesTag = !selectedTag || post.tags.includes(selectedTag);
            const matchesSearch =
                !q || post.title.toLowerCase().includes(q) || post.description.toLowerCase().includes(q);
            return matchesCategory && matchesTag && matchesSearch;
        });
    }, [allBlogs, selectedCategory, selectedTag, searchQuery]);

    const resetFilters = () => {
        setSelectedCategory("All");
        setSelectedTag(null);
        setSearchQuery("");
    };

    return (
        <main className="bg-white">
            {/* HERO */}
            <section aria-labelledby="blogs-heading" className="bg-white px-5 pb-10 pt-11 text-center md:pb-14 md:pt-20">
                <div className="mx-auto max-w-3xl">
                    <p className="mb-4 inline-flex rounded-full bg-gray-100 px-3.5 py-1.5 text-[13px] font-semibold text-gray-700">
                        Food · Health · Training · Adoption
                    </p>
                    <h1
                        id="blogs-heading"
                        className="mb-4 text-[38px] font-bold leading-[1.06] tracking-tight text-gray-900 sm:text-5xl lg:text-[64px]"
                    >
                        Pet care guides, <span className="text-primary">written for Pakistan</span>
                    </h1>
                    <p className="mx-auto mb-7 max-w-xl text-[15px] leading-relaxed text-gray-600 md:text-lg">
                        Practical advice on feeding, vet visits, grooming and bringing a new pet home, from the Paltuu team.
                    </p>

                    <label className="relative mx-auto block max-w-md">
                        <span className="sr-only">Search guides</span>
                        <svg
                            aria-hidden="true"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M20 20l-3.5-3.5" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Search guides"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="min-h-[54px] w-full rounded-2xl border-[1.5px] border-gray-200 bg-white pl-12 pr-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary"
                        />
                    </label>
                </div>
            </section>

            {/* GRID */}
            <section aria-labelledby="latest-heading" className="bg-gray-100 px-5 py-12 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                        <div>
                            <h2 id="latest-heading" className="text-xl font-semibold text-gray-900 md:text-[28px]">
                                {selectedCategory === "All" ? "Latest guides" : selectedCategory}
                            </h2>
                            <p className="mt-1.5 text-sm text-gray-600">
                                {filteredPosts.length} {filteredPosts.length === 1 ? "guide" : "guides"}
                            </p>
                        </div>
                    </div>

                    {/* Category chips: one scrolling row on a phone, wrapping from md up */}
                    <div className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
                        {categories.map((category) => {
                            const active = selectedCategory === category;
                            return (
                                <button
                                    key={category}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                                        active
                                            ? "border-primary bg-primary text-white"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
                                    }`}
                                >
                                    {category}
                                </button>
                            );
                        })}
                        {selectedTag && (
                            <button
                                type="button"
                                onClick={() => setSelectedTag(null)}
                                aria-label={`Remove tag filter ${selectedTag}`}
                                className="shrink-0 whitespace-nowrap rounded-full border border-primary bg-primary-soft px-3.5 py-2 text-[13px] font-medium text-primary"
                            >
                                #{selectedTag} ✕
                            </button>
                        )}
                    </div>

                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                            {filteredPosts.map((post) => (
                                <BlogCard key={post.slug} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center rounded-3xl bg-white px-5 py-14 text-center">
                            <p className="mb-1.5 text-[17px] font-bold text-gray-900">No guides match that</p>
                            <p className="mb-5 text-sm text-gray-600">Try another word or category.</p>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-2xl border-[1.5px] border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                            >
                                Show all guides
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* White last: the footer below is maroon with a rounded top edge. */}
            <section className="bg-white px-5 py-12 text-center md:py-16">
                <div className="mx-auto max-w-xl">
                    <p className="mb-1.5 text-[17px] font-bold text-gray-900">Questions a guide can&apos;t answer?</p>
                    <p className="mb-4 text-sm leading-relaxed text-gray-600">
                        Ask other pet parents and find a vet in the Paltuu app.
                    </p>
                    <AppStoreBadges className="justify-center" />
                </div>
            </section>
        </main>
    );
}
