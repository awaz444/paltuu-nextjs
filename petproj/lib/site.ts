/**
 * The single canonical origin for the site.
 *
 * This MUST match the host that actually serves 200s. Vercel currently has
 * www.paltuu.pk as the primary domain and 308-redirects the apex, so every
 * canonical, og:url, sitemap entry and JSON-LD url uses www. If the primary
 * domain is ever flipped to the apex in Vercel, change this one line (and the
 * literals in app/**) rather than letting the two drift apart — canonicals that
 * point at a redirect cost a crawl hop on every request.
 */
export const SITE_URL = 'https://www.paltuu.pk';
