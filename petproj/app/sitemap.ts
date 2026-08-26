import { MetadataRoute } from 'next';
import { getAllBlogsMetadata } from '@/lib/mdx';
import { db } from '@/db/index';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = SITE_URL;

    // Static pages — fixed dates so Google doesn't think every page changed today
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl,                         lastModified: new Date('2026-05-01'), changeFrequency: 'weekly',  priority: 1.0 },
        { url: `${baseUrl}/browse-pets`,        lastModified: new Date('2026-05-01'), changeFrequency: 'daily',   priority: 0.9 },
        { url: `${baseUrl}/pet-care`,           lastModified: new Date('2026-05-01'), changeFrequency: 'weekly',  priority: 0.9 },
        { url: `${baseUrl}/rescue-pets`,        lastModified: new Date('2026-04-01'), changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${baseUrl}/lost-and-found`,     lastModified: new Date('2026-04-01'), changeFrequency: 'daily',   priority: 0.7 },
        { url: `${baseUrl}/blogs`,              lastModified: new Date('2026-05-01'), changeFrequency: 'weekly',  priority: 0.8 },
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
            `SELECT pet_id, created_at FROM pets WHERE adoption_status = 'available' AND approved = true`
        );
        petPages = result.rows.map((row) => ({
            url: `${baseUrl}/browse-pets/${row.pet_id}`,
            lastModified: row.created_at ? new Date(row.created_at) : new Date(),
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
            `SELECT vet_id, created_at FROM vets WHERE is_active = true`
        );
        vetPages = result.rows.map((row) => ({
            url: `${baseUrl}/pet-care/${row.vet_id}`,
            lastModified: row.created_at ? new Date(row.created_at) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));
    } catch (e) {
        console.error('Sitemap: failed to fetch vet pages', e);
    }

    // Dynamic clinic / home-vet pages — the primary "search a vet's name" target
    let clinicPages: MetadataRoute.Sitemap = [];
    try {
        const result = await db.query(
            `SELECT clinic_id, slug, created_at FROM clinics WHERE is_active IS NOT FALSE`
        );
        clinicPages = result.rows.map((row) => ({
            url: `${baseUrl}/pet-care/clinic/${row.slug || row.clinic_id}`,
            lastModified: row.created_at ? new Date(row.created_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));
    } catch (e) {
        console.error('Sitemap: failed to fetch clinic pages', e);
    }

    // Marketplace product pages are intentionally excluded while Bazaar is paused.
    // /marketplace/{id} currently returns 404, and listing dead URLs wastes crawl
    // budget and reads as a site-quality problem. Re-add this block once the
    // product route serves 200 again.

    return [...routes, ...blogPosts, ...petPages, ...vetPages, ...clinicPages];
}
