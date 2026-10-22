/**
 * Shared definitions for first-party traffic tracking (page_events table).
 * Used by the client tracker, the ingest route, and the admin traffic dashboard.
 * Event names and payloads are documented in ./README.md — keep it in sync.
 */

import { VET_CITIES } from "@/lib/vetCities";

export const EVENT_TYPES = ["page_view", "page_leave", "scroll_depth", "cta_click", "ad_impression", "ad_click"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

export interface TrackEvent {
    type: EventType;
    path: string;
    view_id?: string;
    cta?: string;
    ad_slot?: string;
    target?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    scroll_depth?: number;
    duration_ms?: number;
    visitor_id?: string;
    session_id?: string;
}

// Internal tools and account pages are not part of public traffic.
const EXCLUDED_PREFIXES = [
    "/admin",
    "/api",
    "/bazaar-admin",
    "/manage-clinics",
    "/bulk-upload-pets",
    "/rescue-panel",
    "/shop-panel",
    "/vendor-panel",
    "/vet-panel",
    "/pwa-debug",
    "/api-docs",
];

export function isTrackedPath(path: string): boolean {
    return !EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}-`));
}

// Ordered: first match wins. Groups dynamic routes (/browse-pets/123) into one
// page type so the dashboard can rank page *kinds* as well as individual paths.
const PAGE_TYPES: [RegExp, string][] = [
    [/^\/$/, "home"],
    [/^\/browse-pets\/[^/]+$/, "pet_detail"],
    [/^\/browse-pets$/, "browse_pets"],
    [/^\/adopt(\/|$)/, "adopt"],
    [/^\/blogs\/[^/]+$/, "blog_post"],
    [/^\/blogs$/, "blogs"],
    [/^\/pet-care\/clinic\/[^/]+$/, "clinic_detail"],
    [/^\/pet-care\/[^/]+$/, "vet_detail"],
    [/^\/pet-care$/, "pet_care"],
    [/^\/lost-and-found-create-listing/, "lost_and_found_report"],
    [/^\/lost-and-found/, "lost_and_found"],
    [/^\/app$|^\/open$/, "app_download"],
    [/^\/marketplace\/brands(\/|$)/, "marketplace_brand"],
    [/^\/marketplace\/[^/]+$/, "product_detail"],
    [/^\/marketplace$/, "marketplace"],
    [/^\/(bazaar|eid-bazaar)(\/|$)/, "bazaar"],
    [/^\/shelters(\/|$)/, "shelter"],
    [/^\/rescue-pets(\/|$)/, "rescue_pets"],
    [/^\/shops(\/|$)/, "shop"],
    [/^\/create-listing/, "create_listing"],
    [/^\/(auth|sign-up)(\/|$)/, "auth"],
    [/^\/(cart|checkout)(\/|$)/, "checkout"],
];

export function pageTypeFor(path: string): string {
    // /pet-care/karachi is a city listing, /pet-care/dr-ali is a vet profile — same route.
    const petCareSlug = path.match(/^\/pet-care\/([^/]+)$/)?.[1];
    if (petCareSlug && VET_CITIES.some((c) => c.toLowerCase() === petCareSlug.toLowerCase())) {
        return "pet_care_city";
    }
    for (const [re, type] of PAGE_TYPES) {
        if (re.test(path)) return type;
    }
    return "other";
}

// Dashboard section filter (PALTU-32). Page types not listed (home, auth, …) fall under "other".
export const SECTIONS: Record<string, string[]> = {
    adopt: ["browse_pets", "pet_detail", "adopt", "shelter", "rescue_pets", "create_listing", "lost_and_found", "lost_and_found_report"],
    care: ["pet_care", "pet_care_city", "vet_detail", "clinic_detail"],
    content: ["blogs", "blog_post", "app_download"],
    marketplace: ["marketplace", "marketplace_brand", "product_detail", "bazaar", "shop", "checkout"],
};

export function sectionFor(pageType: string): string {
    for (const [section, types] of Object.entries(SECTIONS)) {
        if (types.includes(pageType)) return section;
    }
    return "other";
}

// Scroll depth is only meaningful where the page is something to read through.
export const SCROLL_PAGE_TYPES = new Set([
    "home", "pet_detail", "blog_post", "vet_detail", "clinic_detail", "product_detail", "shelter", "app_download",
]);

/** Names outbound links that matter to sales without needing a data-cta tag. */
export function inferCta(href: string): string | null {
    if (/play\.google\.com/.test(href)) return "app_store_android";
    if (/apps\.apple\.com/.test(href)) return "app_store_ios";
    if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(href)) return "whatsapp";
    if (href.startsWith("tel:")) return "call";
    if (href.startsWith("mailto:")) return "email";
    return null;
}

/**
 * Human labels for the dashboard. Keys are the stable `cta` values stored in
 * page_events — rename a label freely, never a key (it would split history).
 */
export const CTA_LABELS: Record<string, string> = {
    pet_adopt: "Adopt this pet",
    pet_contact: "Contact owner",
    pet_whatsapp_owner: "WhatsApp owner",
    pet_copy_phone: "Copy owner's number",
    pet_ask_paltuu: "Ask Paltuu about this pet",
    vet_whatsapp: "Book vet (WhatsApp)",
    vet_copy_phone: "Call vet (copy number)",
    vet_clinic_whatsapp: "Book vet's clinic (WhatsApp)",
    vet_clinic_copy_phone: "Call vet's clinic (copy number)",
    vet_directions: "Vet directions",
    clinic_whatsapp: "Book clinic (WhatsApp)",
    clinic_copy_phone: "Call clinic (copy number)",
    clinic_directions: "Clinic directions",
    add_to_cart: "Add to cart",
    lost_found_report: "Report lost / found pet",
    home_vets_at_home_book: "Book Vets @ Home",
    home_pillar_vets_at_home_book: "Book Vets @ Home",
    app_promo_vets_at_home: "Book Vets @ Home (banner)",
    app_promo_download: "Download app (banner)",
    app_store_android: "Download app (Google Play)",
    app_store_ios: "Download app (App Store)",
    home_hero_browse_pets: "Browse pets (hero)",
    home_hero_list_pet: "List a pet (hero)",
    home_path_adopt: "Browse pets (how adoption works)",
    home_path_rehome: "List a pet (how adoption works)",
    blog_find_vet: "Find a vet (blog)",
    blog_shop_supplies: "Shop supplies (blog)",
    blog_related_post: "Related article (blog)",
    blog_newsletter_subscribe: "Newsletter subscribe (blog)",
    whatsapp: "WhatsApp link",
    call: "Phone call link",
    email: "Email link",
};

export function ctaLabel(cta: string): string {
    if (CTA_LABELS[cta]) return CTA_LABELS[cta];
    if (cta.startsWith("home_action_")) return `Home shortcut: ${cta.slice("home_action_".length).replace(/_/g, " ")}`;
    return cta.replace(/_/g, " ");
}

/**
 * Keeps where a click went without keeping who it went to: phone numbers in
 * tel:/WhatsApp links and addresses in mailto: are PII, and query strings can
 * carry anything. Internal links keep their path; external ones keep host + path.
 */
export function sanitizeTarget(href: string | null | undefined): string | null {
    if (!href) return null;
    if (/^(tel|mailto|sms|whatsapp):/i.test(href)) return href.split(":")[0].toLowerCase() + ":";
    try {
        const url = new URL(href, "https://www.paltuu.pk");
        if (/(^|\.)wa\.me$|whatsapp\.com$/.test(url.hostname)) return url.hostname;
        const internal = /(^|\.)paltuu\.pk$/.test(url.hostname);
        return (internal ? url.pathname : `${url.hostname}${url.pathname}`).slice(0, 500);
    } catch {
        return null;
    }
}
