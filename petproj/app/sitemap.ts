import { MetadataRoute } from 'next';
import { getAllBlogsMetadata } from '@/lib/mdx';
import { db } from '@/db/index';
import { SITE_URL } from '@/lib/site';
import { getTaxonomy } from '@/lib/adoptTaxonomy';
import { VET_CITIES } from '@/lib/vetCities';

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

    // City hub pages for vets. These are linked from the footer and already
    // rank for "vet clinic <city>" style queries, but were never listed in the
    // sitemap, so they were never explicitly submitted for crawling.
    // VET_CITIES is the cities that actually have clinics behind them — see
    // lib/vetCities.ts (also used by app/pet-care/[slug]/page.tsx and the
    // footer, so this can't drift out of sync with the pages it points at).
    const vetCityPages: MetadataRoute.Sitemap = VET_CITIES.map((city) => ({
        url: `${baseUrl}/pet-care/${city.toLowerCase()}`,
        lastModified: new Date('2026-05-01'),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Species x city adoption landing pages (app/adopt/[...slug] + the /adopt
    // hub). Species and cities come from lib/adoptTaxonomy.ts — every category
    // in pet_category and every city that actually has listings, not a fixed
    // list. Only emit combinations that actually have listings; an empty
    // landing page is thin content and wastes crawl budget. The national
    // species hubs and /adopt itself always ship since they aggregate everything.
    let adoptPages: MetadataRoute.Sitemap = [];
    try {
        const { species, cities, combos } = await getTaxonomy();
        const paths = new Set<string>(['/adopt']);

        for (const sp of species) {
            paths.add(`/adopt/${sp.slug}`);
            for (const city of cities) {
                if (combos.get(`${sp.categoryId}|${city.name}`)) {
                    paths.add(`/adopt/${sp.slug}/${city.slug}`);
                }
            }
        }
        for (const city of cities) paths.add(`/adopt/${city.slug}`);

        adoptPages = [...paths].map((path) => ({
            url: `${baseUrl}${path}`,
            // These listing pages genuinely change as pets are added/adopted,
            // unlike the fixed-date static routes above.
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: path === '/adopt' ? 0.9 : 0.85,
        }));
    } catch (e) {
        console.error('Sitemap: failed to build adoption landing pages', e);
    }

    // Marketplace product pages are intentionally excluded while Bazaar is paused.
    // /marketplace/{id} currently returns 404, and listing dead URLs wastes crawl
    // budget and reads as a site-quality problem. Re-add this block once the
    // product route serves 200 again.

    return [...routes, ...vetCityPages, ...adoptPages, ...blogPosts, ...petPages, ...vetPages, ...clinicPages];
}
