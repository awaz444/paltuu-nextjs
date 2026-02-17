import React from "react";
import { getAllBlogsMetadata, getAllCategories } from "@/lib/mdx";
import BlogsPageClient from "./BlogsPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pet Care Blogs & Articles | Paltuu.pk - Pakistan's #1 Pet Community",
    description: "Explore expert pet care tips, health advice, training guides, and adoption stories. Your ultimate resource for pet ownership in Pakistan.",
    keywords: "pet care blog, dog training, cat care, pet health, pet adoption pakistan, veterinary tips, pet nutrition",
    openGraph: {
        title: "Pet Care Blogs & Articles | Paltuu.pk",
        description: "Explore expert pet care tips, health advice, training guides, and adoption stories.",
        url: "https://paltuu.pk/blogs",
        siteName: "Paltuu.pk",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Pet Care Blogs & Articles | Paltuu.pk",
        description: "Explore expert pet care tips, health advice, training guides, and adoption stories.",
    },
    alternates: {
        canonical: "https://paltuu.pk/blogs",
    },
};

export default function BlogsPage() {
    const allBlogs = getAllBlogsMetadata();
    const categories = getAllCategories();

    return <BlogsPageClient allBlogs={allBlogs} categories={categories} />;
}
