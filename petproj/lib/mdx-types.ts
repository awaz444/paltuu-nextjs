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
    tags: string[];
    readTime?: string;
}

export interface BlogPost extends BlogMetadata {
    content: string;
}
