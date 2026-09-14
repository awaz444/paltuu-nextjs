/**
 * Founder-editable landing page content.
 *
 * Everything on the homepage that is a *claim* rather than live data lives here
 * — stats, testimonials, service names, store links. These are Paltuu's own
 * figures and are deliberately NOT derived from the database: edit them here
 * and nowhere else.
 *
 * Live data (pets currently listed) comes from lib/recentPets.ts instead.
 */

export interface HomeStat {
    /** Numeric target the counter animates to. */
    value: number;
    /** Rendered immediately after the number, e.g. "+". */
    suffix?: string;
    label: string;
}

export interface HomeTestimonial {
    name: string;
    city: string;
    quote: string;
}

/**
 * ⚠️ FOUNDER: replace these with the real figures. They were carried over
 * verbatim from the old hardcoded HeroSection block — this file is now the
 * only place they live.
 */
export const HOME_STATS: readonly HomeStat[] = [
    { value: 4000, suffix: "+", label: "Active Users" },
    { value: 1574, label: "Happy Adopters" },
    { value: 2000, suffix: "+", label: "Animals Helped" },
    { value: 891, label: "Critical Rescues" },
    { value: 972, label: "Forever Homes" },
] as const;

export const HOME_TESTIMONIALS: readonly HomeTestimonial[] = [
    {
        name: "Ayesha K.",
        city: "Karachi",
        quote:
            "Paltuu made the adoption process simple and trustworthy. We found our cat through a verified rescue, and the experience was smooth.",
    },
    {
        name: "Hamza R.",
        city: "Lahore",
        quote:
            "Instead of random Facebook groups, Paltuu gave us real options and real people. Highly recommended for pet adoption in Lahore.",
    },
    {
        name: "Sara M.",
        city: "Islamabad",
        quote:
            "I connected with a rescue partner through Paltuu and helped rehome animals safely. The platform actually works.",
    },
] as const;

/**
 * Vets at Home — the one service Paltuu provides itself rather than brokering.
 * App-only and Karachi-only while it is still a soft launch.
 *
 * `services` mirrors the labels in lib/expressVet/catalog.ts. They are copied
 * rather than imported so this file stays free of server/DB-adjacent imports
 * and can be pulled into any component.
 */
export const VETS_AT_HOME = {
    city: "Karachi",
    /** app/open/OpenClient.tsx resolves this to paltuu://express-vet. */
    deepLink: "/open?path=express-vet",
    services: [
        "Urgent Visit",
        "Scheduled Visit",
        "Vaccination",
        "Neutering",
        "Spaying",
        "Grooming",
    ],
} as const;

/**
 * Real screens from the iOS app, with the device frame drawn around them by
 * scripts/make_app_screens.py. Regenerate with:
 *     /opt/homebrew/bin/python3.13 -m venv /tmp/shotvenv
 *     /tmp/shotvenv/bin/pip install Pillow
 *     /tmp/shotvenv/bin/python scripts/make_app_screens.py
 * (Homebrew python@3.14 ships a broken pyexpat, so 3.13 is required.)
 *
 * Order matters: the feed first, because the social side is what most visitors
 * do not know exists.
 */
export const APP_SCREENS = [
    {
        src: "/app-screens/feed.png",
        alt: "The Paltuu app feed, showing posts from pet owners in Karachi with hashtags",
        title: "A feed for pet people",
        desc: "Posts, photos and hashtags from pet parents across Pakistan.",
    },
    {
        src: "/app-screens/pet-profile.png",
        alt: "A pet profile in the Paltuu app for Lino, a Persian cat, with his own posts and gallery",
        title: "Your pet gets an account",
        desc: "Give every pet their own profile, then tag them in your posts.",
    },
    {
        src: "/app-screens/adopt.png",
        alt: "The adoption listings screen in the Paltuu app",
        title: "Adopt from the app",
        desc: "The same listings as the website, in your pocket.",
    },
    {
        src: "/app-screens/vets.png",
        alt: "The Paltuu app pet care directory, listing verified veterinary clinics",
        title: "Vets and clinics near you",
        desc: "Search verified clinics by city, with ratings and addresses.",
    },
] as const;

export const APP_LINKS = {
    android: "https://play.google.com/store/apps/details?id=com.paltuu.app",
    ios: "https://apps.apple.com/pk/app/paltuu/id6789732258",
} as const;

/** Verified clinic counts per city — see the note in lib/vetCities.ts. */
export const VET_CLINIC_COUNTS: Record<string, number> = {
    Karachi: 119,
    Lahore: 47,
    Islamabad: 36,
};

/** The sample pet rendered on the Pet Identity Card showcase. */
export const PET_ID_CARD_SAMPLE = {
    name: "Lino",
    parentName: "raahim hussain",
    gender: "M",
    identityNumber: "000-000-5",
    dateOfBirth: "19.04.2025",
    dateOfIssue: "13.07.2026",
    dateOfExpiry: "13.07.2036",
    photoUrl:
        "https://djw7hbeqkm7bf.cloudfront.net/posts/5deca4fc-0b26-4a9a-8096-3df02ce69311.jpg",
    photoAlt: "Lino, a Persian cat documented on Paltuu",
} as const;
