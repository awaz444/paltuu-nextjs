/**
 * Cities with actual vet clinic coverage, verified against the clinics table
 * (Karachi 119, Lahore 47, Islamabad 36 — everything else 0 as of 2026-08-31).
 *
 * This used to be duplicated as a 6-city list (adding Rawalpindi, Faisalabad,
 * Multan) in three places — app/pet-care/[slug]/page.tsx, app/sitemap.ts, and
 * components/footer.tsx — which shipped city pages and footer links for
 * clinics that don't exist. Import from here instead of hardcoding a new copy.
 *
 * If a clinic partner signs up in one of the excluded cities, add it here —
 * that one line brings back its page, sitemap entry, and footer/cross-links.
 */
export const VET_CITIES = ["Karachi", "Lahore", "Islamabad"] as const;
