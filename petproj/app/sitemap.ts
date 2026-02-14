import { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/components/blog/data';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://paltuu.pk';

    // Static pages
    const routes = [
        '',
        '/about-us',
        '/blogs',
        '/pet-care',
        '/marketplace',
        '/rescue-pets',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic blog posts
    const blogPosts = BLOG_POSTS.map((post) => ({
        url: `${baseUrl}/blogs/${post.slug}`,
        lastModified: new Date(post.date), // Assuming post.date is parseable, e.g. "May 15, 2024" which works
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    return [...routes, ...blogPosts];
}
