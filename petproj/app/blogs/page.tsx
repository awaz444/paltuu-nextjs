"use client";

import React, { useState } from "react";
import { BLOG_CATEGORIES, BLOG_POSTS } from "@/components/blog/data";
import BlogCard from "@/components/blog/BlogCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

export default function BlogsPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredPosts = BLOG_POSTS.filter((post) => {
        const matchesCategory =
            selectedCategory === "All" || post.category === selectedCategory;
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-montserrat">
            {/* Hero Section */}
            <section className="bg-primary/5 py-16 px-6 lg:px-20 border-b border-gray-100">
                <div className="max-w-6xl mx-auto text-center">
                    <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">
                        Knowledge Hub
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        Paltuu <span className="text-primary">Blogs</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Your ultimate guide to pet care, health tips, training advice, and heartwarming adoption stories.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                {/* Filter & Search Bar */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Categories (Scrollable) */}
                    <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto no-scrollbar">
                        {BLOG_CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${selectedCategory === category
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                        />
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    </div>
                </div>

                {/* Blog Grid */}
                {filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post) => (
                            <div key={post.id} className="h-full">
                                <BlogCard post={post} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-bold text-gray-700 mb-2">
                            No articles found
                        </h3>
                        <p className="text-gray-500">
                            Try adjusting your search or category filter.
                        </p>
                    </div>
                )}

                {/* Pagination (Mock) */}
                {filteredPosts.length > 0 && (
                    <div className="flex justify-center mt-12 gap-2">
                        <button className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shadow-md">
                            1
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white text-gray-600 font-bold flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200">
                            2
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white text-gray-600 font-bold flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200">
                            3
                        </button>
                        <span className="flex items-center text-gray-400 px-2">...</span>
                        <button className="w-10 h-10 rounded-full bg-white text-gray-600 font-bold flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200">
                            →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
