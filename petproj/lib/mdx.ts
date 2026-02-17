import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import readingTime from 'reading-time';

// Export types from separate file (safe for client components)
export type { BlogMetadata, BlogPost } from './mdx-types';
import type { BlogMetadata } from './mdx-types';

const BLOGS_PATH = path.join(process.cwd(), 'content', 'blogs');

// Get all blog slugs
export function getAllBlogSlugs(): string[] {
    if (!fs.existsSync(BLOGS_PATH)) {
        return [];
    }
    
    const files = fs.readdirSync(BLOGS_PATH);
    return files
        .filter((file) => file.endsWith('.mdx') && !file.startsWith('_'))
        .map((file) => file.replace(/\.mdx$/, ''));
}

// Get blog metadata by slug
export function getBlogMetadata(slug: string): BlogMetadata | null {
    try {
        const filePath = path.join(BLOGS_PATH, `${slug}.mdx`);
        
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);
        
        // Calculate reading time
        const stats = readingTime(content);

        return {
            title: data.title,
            slug: data.slug || slug,
            description: data.description,
            category: data.category,
            featuredImage: data.featuredImage,
            author: data.author,
            date: data.date,
            tags: data.tags || [],
            readTime: stats.text,
        };
    } catch (error) {
        console.error(`Error reading blog metadata for ${slug}:`, error);
        return null;
    }
}

// Get all blog metadata
export function getAllBlogsMetadata(): BlogMetadata[] {
    const slugs = getAllBlogSlugs();
    const blogs = slugs
        .map((slug) => getBlogMetadata(slug))
        .filter((blog): blog is BlogMetadata => blog !== null)
        .sort((a, b) => {
            // Sort by date, newest first
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

    return blogs;
}

// Get blog content and metadata by slug
export async function getBlogBySlug(slug: string) {
    try {
        const filePath = path.join(BLOGS_PATH, `${slug}.mdx`);
        
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);
        
        // Calculate reading time
        const stats = readingTime(content);

        const metadata: BlogMetadata = {
            title: data.title,
            slug: data.slug || slug,
            description: data.description,
            category: data.category,
            featuredImage: data.featuredImage,
            author: data.author,
            date: data.date,
            tags: data.tags || [],
            readTime: stats.text,
        };

        // Compile MDX
        const { content: mdxContent } = await compileMDX({
            source: content,
            options: {
                parseFrontmatter: false,
                mdxOptions: {
                    development: process.env.NODE_ENV === 'development',
                },
            },
        });

        return {
            metadata,
            content: mdxContent,
        };
    } catch (error) {
        console.error(`Error reading blog ${slug}:`, error);
        return null;
    }
}

// Get blogs by category
export function getBlogsByCategory(category: string): BlogMetadata[] {
    const allBlogs = getAllBlogsMetadata();
    
    if (category === 'All') {
        return allBlogs;
    }
    
    return allBlogs.filter((blog) => blog.category === category);
}

// Get blogs by tag
export function getBlogsByTag(tag: string): BlogMetadata[] {
    const allBlogs = getAllBlogsMetadata();
    return allBlogs.filter((blog) => blog.tags.includes(tag));
}

// Search blogs
export function searchBlogs(query: string): BlogMetadata[] {
    const allBlogs = getAllBlogsMetadata();
    const lowerQuery = query.toLowerCase();
    
    return allBlogs.filter((blog) => {
        return (
            blog.title.toLowerCase().includes(lowerQuery) ||
            blog.description.toLowerCase().includes(lowerQuery) ||
            blog.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
    });
}

// Get all unique categories
export function getAllCategories(): string[] {
    const allBlogs = getAllBlogsMetadata();
    const categories = new Set(allBlogs.map((blog) => blog.category));
    return ['All', ...Array.from(categories)];
}

// Get all unique tags
export function getAllTags(): string[] {
    const allBlogs = getAllBlogsMetadata();
    const tags = new Set(allBlogs.flatMap((blog) => blog.tags));
    return Array.from(tags).sort();
}

// Get related blogs (same category, excluding current)
export function getRelatedBlogs(slug: string, limit: number = 3): BlogMetadata[] {
    const currentBlog = getBlogMetadata(slug);
    
    if (!currentBlog) {
        return [];
    }
    
    const allBlogs = getAllBlogsMetadata();
    const relatedBlogs = allBlogs
        .filter((blog) => blog.slug !== slug && blog.category === currentBlog.category)
        .slice(0, limit);
    
    // If not enough related blogs in same category, fill with other blogs
    if (relatedBlogs.length < limit) {
        const otherBlogs = allBlogs
            .filter((blog) => blog.slug !== slug && blog.category !== currentBlog.category)
            .slice(0, limit - relatedBlogs.length);
        
        return [...relatedBlogs, ...otherBlogs];
    }
    
    return relatedBlogs;
}

// Format date for display
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
