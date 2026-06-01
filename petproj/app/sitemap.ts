import { MetadataRoute } from 'next';
import { getAllBlogsMetadata } from '@/lib/mdx';
import { db } from '@/db/index';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://paltuu.pk';

    // Static pages — fixed dates so Google doesn't think every page changed today
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl,                         lastModified: new Date('2026-05-01'), changeFrequency: 'weekly',  priority: 1.0 },
        { url: `${baseUrl}/browse-pets`,        lastModified: new Date('2026-05-01'), changeFrequency: 'daily',   priority: 0.9 },
        { url: `${baseUrl}/pet-care`,           lastModified: new Date('2026-05-01'), changeFrequency: 'weekly',  priority: 0.9 },
        { url: `${baseUrl}/rescue-pets`,        lastModified: new Date('2026-04-01'), changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${baseUrl}/marketplace`,        lastModified: new Date('2026-05-01'), changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${baseUrl}/marketplace/cat-food`,  lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/marketplace/dog-food`,  lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/marketplace/litter`,    lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/marketplace/brands`,    lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/marketplace/brands/royal-canin`,  lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/marketplace/brands/pedigree`,     lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/marketplace/brands/whiskas`,      lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/marketplace/brands/gourmet`,      lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/brit-care`,    lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/prochoice`,    lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/felicia`,      lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/petline`,      lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/jungle`,       lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/nourvet`,      lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/fluff-n-bluff`,lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/homie`,        lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/marketplace/brands/la-mito`,      lastModified: new Date('2026-05-01'), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/lost-and-found`,     lastModified: new Date('2026-04-01'), changeFrequency: 'daily',   priority: 0.7 },
        { url: `${baseUrl}/blogs`,              lastModified: new Date('2026-05-01'), changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${baseUrl}/about-us`,           lastModified: new Date('2025-01-01'), changeFrequency: 'monthly', priority: 0.5 },
    ];
    const routes = staticRoutes;

    // Dynamic blog posts from MDX filesystem
    const allBlogs = getAllBlogsMetadata();
    const blogPosts = allBlogs.map((post) => ({
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
