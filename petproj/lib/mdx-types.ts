// Type definitions for MDX blog system
// This file contains only types and can be safely imported in client components

export interface BlogMetadata {
    title: string;
    slug: string;
    description: string;
    category: string;
    featuredImage: string;
    author: string;
    date: string;
    updated?: string;
    tags: string[];
    readTime?: string;
}

export interface BlogPost extends BlogMetadata {
    content: string;
}

export interface BlogFAQItem {
    question: string;
    answer: string;
}
