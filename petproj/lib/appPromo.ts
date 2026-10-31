/**
 * Destinations and asset specs for every "download the app" promo on the
 * website. Four surfaces, all fed from here:
 *
 *   browsePets   — inline banner between the filters and the listing grid
 *   vetsAtHome   — inline banner on the landing page, above the app section
 *   adopt        — popup when a visitor starts an adoption application
 *   createListing— popup when a visitor opens the create-listing form
 *
 * Every one of these is a flat designed image, not HTML text over a
 * background — see AppPromoImageBanner and AppPromoImageModal for why, and
 * for the guarantee that each `mobile`/`desktop` (or single `image`) pair
 * below is the *only* asset that surface ever needs, at any viewport width:
 * the component caps and centers rather than stretching past the design.
 *
 * `scope` decides how often a surface comes back after it is closed:
 *   "session"   — sessionStorage, so it returns on the next visit but never
 *                 twice in one sitting. Used for the two popups.
 *   "permanent" — localStorage. Used for the inline banners, where closing it
 *                 is a deliberate "I am not interested".
 *
 * Placeholder artwork lives at public/app-promo/*.png right now — solid-color
 * rectangles with the target dimensions printed on them, generated so the
 * layout could be verified before real art exists. Replace the files in
 * place (same filename, same pixel dimensions or an exact multiple for a
 * sharper export) and there is nothing else to wire up.
 */

import { VETS_AT_HOME } from "./homeContent";
import type { AppPromoImageSpec } from "@/components/app-promo/AppPromoImageBanner";
import type { AppPromoImageModalSpec } from "@/components/app-promo/AppPromoImageModal";

export type PromoScope = "session" | "permanent";

/** Shows both store links, with the visitor's own platform first. */
const APP_LANDING = "/app";

export const APP_IMAGE_BANNERS = {
    browsePets: {
        key: "browse_pets_banner",
        scope: "permanent",
        href: APP_LANDING,
        alt: "Get the Paltuu app",
        mobile: { src: "/app-promo/browse-pets-mobile.png", width: 420, height: 160 },
        desktop: { src: "/app-promo/browse-pets-desktop.png", width: 960, height: 150 },
    },
    vetsAtHome: {
        key: "vets_at_home_banner",
        scope: "permanent",
        // Straight into the app, not the store landing page — this is the one
        // service that is app-only, so the click should try to open it, not
        // just advertise that it exists. app/open/OpenClient.tsx hands off to
        // paltuu:// and falls back to the store if the app isn't installed.
        href: VETS_AT_HOME.deepLink,
        alt: `Book Vets at Home in ${VETS_AT_HOME.city} — in the Paltuu app`,
        mobile: { src: "/app-promo/vets-at-home-mobile.png", width: 420, height: 160 },
        desktop: { src: "/app-promo/vets-at-home-desktop.png", width: 960, height: 150 },
    },
} as const satisfies Record<string, AppPromoImageSpec>;

/** A popup's gating info (key/scope, for useAppPromoGate) plus its content. */
type ImageModalEntry = AppPromoImageModalSpec & { key: string; scope: PromoScope };

export const APP_IMAGE_MODALS = {
    adopt: {
        key: "adopt_popup",
        scope: "session",
        href: APP_LANDING,
        alt: "Track this application in the Paltuu app",
        image: { src: "/app-promo/adopt-popup.png", width: 448, height: 448 },
        dismissLabel: "Continue on the website",
    },
    createListing: {
        key: "create_listing_popup",
        scope: "session",
        href: APP_LANDING,
        alt: "List your pet from the Paltuu app",
        image: { src: "/app-promo/create-listing-popup.png", width: 448, height: 448 },
        dismissLabel: "Continue on the website",
    },
} as const satisfies Record<string, ImageModalEntry>;
