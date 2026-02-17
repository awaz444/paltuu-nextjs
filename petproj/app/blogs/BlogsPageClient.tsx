"use client";

import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import BlogCard from "@/components/blog/BlogCard";
import { BlogMetadata } from "@/lib/mdx-types";

interface BlogsPageClientProps {
    allBlogs: BlogMetadata[];
    categories: string[];
}

export default function BlogsPageClient({ allBlogs, categories }: BlogsPageClientProps) {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredPosts = useMemo(() => {
        return allBlogs.filter((post) => {
            const matchesCategory =
                selectedCategory === "All" || post.category === selectedCategory;

            const matchesSearch =
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.description.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }, [allBlogs, selectedCategory, searchQuery]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-24 font-montserrat">

            {/* HERO SECTION */}
            <section className="relative bg-gradient-to-br from-primary/10 via-white to-primary/5 py-20 px-6 lg:px-20 border-b border-gray-100 overflow-hidden">
                <div className="max-w-6xl mx-auto text-center">
                    <span className="text-primary font-bold tracking-wider uppercase text-sm mb-3 block">
                        Knowledge Hub
                    </span>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Paltuu <span className="text-primary">Blogs</span>
                    </h1>

                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Your ultimate guide to pet care, health tips, training advice,
                        and heartwarming adoption stories.
                    </p>

                    <button className="mt-8 px-8 py-3 bg-primary text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-300">
                        Explore Articles
                    </button>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">

                {/* FILTER + SEARCH */}
                <div className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-lg p-6 mb-14 flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Categories */}
                    <div className="flex overflow-x-auto gap-3 w-full md:w-auto no-scrollbar">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${selectedCategory === category
                                    ? "bg-primary text-white shadow-md scale-105"
                                    : "bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300"
                        />

                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                        />
                    </div>
                </div>

                {/* SECTION HEADER */}
                {filteredPosts.length > 0 && (
                    <div className="mb-8 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Latest Articles
                        </h2>
                        <span className="text-sm text-gray-500">
                            {filteredPosts.length} Articles
                        </span>
                    </div>
                )}

                {/* BLOG GRID */}
                {filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredPosts.map((post) => (
                            <div
                                key={post.slug}
                                className="transform hover:-translate-y-1 transition-all duration-300"
                            >
                                <BlogCard post={post} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-28">
                        <div className="text-6xl mb-6">🐾</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-3">
                            No articles found
                        </h3>
                        <p className="text-gray-500">
                            Try adjusting your search or explore another category.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
