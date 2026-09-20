/**
 * Copy and gating rules for every "download the app" promo on the website.
 *
 * Four surfaces, all fed from here so the pitch can be reworded in one place:
 *
 *   browsePets   — inline banner between the filters and the listing grid
 *   vetsAtHome   — inline banner on the landing page, above the app section
 *   adopt        — popup when a visitor starts an adoption application
 *   createListing— popup when a visitor opens the create-listing form
 *
 * `scope` decides how often a surface comes back after it is closed:
 *   "session"   — sessionStorage, so it returns on the next visit but never
 *                 twice in one sitting. Used for the two popups.
 *   "permanent" — localStorage. Used for the inline banners, where closing it
 *                 is a deliberate "I am not interested".
 *
 * Every feature named in this copy is one the app actually ships today:
 * adoption listings and applications (app/(app)/adopt.tsx, my-applications.tsx),
 * the owner's approve/reject screen (adoption-requests.tsx), camera-roll upload
 * (create-pet.tsx), the social feed and pet profiles, the clinic directory, and
 * the adoption_* push notifications in lib/notifications.
 *
 * Do not add a claim here without checking it first. In particular the app has
 * no owner↔adopter chat, no saved-pets list (saved collections hold posts, not
 * pets) and no draft for a half-finished listing — earlier drafts of this copy
 * promised all three.
 */

import { APP_LINKS, VETS_AT_HOME } from "./homeContent";

export type PromoScope = "session" | "permanent";

export interface AppPromoCopy {
    /** Storage key. Keep these stable — changing one re-shows the promo to everyone. */
    key: string;
    scope: PromoScope;
    /** Small uppercase line above the heading. */
    eyebrow: string;
    title: string;
    body: string;
    /** Short proof points. Rendered as a list in the popups, hidden in banners. */
    points?: readonly string[];
    /**
     * Optional in-app destination, routed through /open (app/open/OpenClient.tsx),
     * which hands off to the paltuu:// scheme and falls back to the store buttons.
     */
    deepLink?: string;
    deepLinkLabel?: string;
    /** Label on the "no thanks, stay here" control. Popups only. */
    dismissLabel: string;
}

export const APP_PROMOS = {
    browsePets: {
        key: "browse_pets_banner",
        scope: "permanent",
        eyebrow: "Paltuu app",
        title: "Adopt from the Paltuu app",
        body: "The same listings in your pocket — plus a feed of pet owners across Pakistan, a profile for every pet you own, and verified clinics near you.",
        dismissLabel: "Not now",
    },
    vetsAtHome: {
        key: "vets_at_home_banner",
        scope: "permanent",
        eyebrow: `Vets at Home · ${VETS_AT_HOME.city}`,
        title: "A veterinary doctor at your door — bookable only in the app",
        body: "Vaccinations, check-ups, neutering and grooming at home. Paltuu's own vets, dispatched from the app.",
        deepLink: VETS_AT_HOME.deepLink,
        deepLinkLabel: "Book in the app",
        dismissLabel: "Not now",
    },
    adopt: {
        key: "adopt_popup",
        scope: "session",
        eyebrow: "Before you apply",
        title: "Track this application in the Paltuu app",
        body: "Apply here or in the app — either way, the app is where you can see every application you have sent and hear back the moment an owner decides.",
        points: [
            "A push notification when the owner responds",
            "Every application you have sent, in one place",
            "Adoption listings, the feed and pet profiles",
        ],
        dismissLabel: "Continue on the website",
    },
    createListing: {
        key: "create_listing_popup",
        scope: "session",
        eyebrow: "Listing a pet?",
        title: "You can list your pet from the app instead",
        body: "Pick photos straight from your camera roll, then approve or reject applicants from your phone as they come in.",
        points: [
            "Photos straight from your camera roll",
            "Approve or reject applicants from your phone",
            "A push notification for every new application",
        ],
        dismissLabel: "Continue on the website",
    },
} as const satisfies Record<string, AppPromoCopy>;

export { APP_LINKS };
