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

/**
 * One codebase, two sites. paltuu.pk is the full Pakistan experience;
 * paltuu.org is the international one, which shows only Home and Adopt.
 *
 * The pages are static, so the site is told apart in the browser: a tiny
 * inline script in app/layout.tsx sets <html data-site="org"> before first
 * paint, and globals.css hides anything marked `pk-only`. Pages that make no
 * sense outside Pakistan are redirected away on the .org host in
 * next.config.mjs.
 */
export const ORG_HOST_PATTERN = "(^|\\.)paltuu\\.org$";

/** Canonical origin of the international site (its landing page's canonical). */
export const ORG_URL = 'https://www.paltuu.org';

/** Mark links and sections that only paltuu.pk shows. */
export const PK_ONLY = "pk-only";
