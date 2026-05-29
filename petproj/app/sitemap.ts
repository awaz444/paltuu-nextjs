import { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/components/blog/data';
import { db } from '@/db/index';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://paltuu.pk';

    // Static pages
    const routes = [
        '',
        '/about-us',
        '/blogs',
        '/browse-pets',
        '/pet-care',
        '/marketplace',
        '/rescue-pets',
        '/lost-and-found',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic blog posts
    const blogPosts = BLOG_POSTS.map((post) => ({
        url: `${baseUrl}/blogs/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    // Dynamic pet pages
    let petPages: MetadataRoute.Sitemap = [];
    try {
        const result = await db.query(
            `SELECT pet_id, updated_at FROM pets WHERE adoption_status = 'available' AND approved = true`
        );
        petPages = result.rows.map((row) => ({
            url: `${baseUrl}/browse-pets/${row.pet_id}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch (e) {
        console.error('Sitemap: failed to fetch pet pages', e);
    }

    // Dynamic vet pages
    let vetPages: MetadataRoute.Sitemap = [];
    try {
        const result = await db.query(
            `SELECT vet_id, updated_at FROM vets WHERE approved = true`
        );
        vetPages = result.rows.map((row) => ({
            url: `${baseUrl}/pet-care/${row.vet_id}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));
    } catch (e) {
        console.error('Sitemap: failed to fetch vet pages', e);
    }

    // Dynamic marketplace product pages (kept in sitemap even while Bazaar is paused for SEO)
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const result = await db.query(
            `SELECT product_id, updated_at FROM bazaar_products WHERE status = 'published'`
        );
        productPages = result.rows.map((row) => ({
            url: `${baseUrl}/marketplace/${row.product_id}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));
    } catch (e) {
        console.error('Sitemap: failed to fetch product pages', e);
    }

    return [...routes, ...blogPosts, ...petPages, ...vetPages, ...productPages];
}
