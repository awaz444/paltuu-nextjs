import { SITE_URL } from "@/lib/site";
import { APP_LINKS, VETS_AT_HOME } from "@/lib/homeContent";

/**
 * Builders for the structured data on the homepage.
 *
 * Every page in this app hand-rolls its own <script type="application/ld+json">
 * with SITE_URL spelled out inline; these helpers exist so the homepage's blocks
 * at least share one source of truth. app/layout.tsx still carries its own
 * Organization/WebSite blobs — migrating those is a follow-up.
 */

/** Props for a <script type="application/ld+json"> tag. */
export function jsonLdScript(data: object) {
    return {
        type: "application/ld+json" as const,
        dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
    };
}

/**
 * The machine-readable version of "Paltuu is a platform, not a shelter".
 * Answer engines read this; it is the same claim the hero and the FAQ make.
 */
export function homeWebPageSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: "Paltuu — Pet Adoption Platform & Vets Near Me in Pakistan",
        description:
            "Paltuu is Pakistan's pet adoption platform. Pets are listed by their current owners and by registered shelters and rescues — Paltuu connects the two and does not own, house, or hand out animals. It also runs a nationwide directory of vet clinics and veterinary doctors, and a first-party at-home vet service in Karachi.",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: {
            "@type": "Thing",
            name: "Pet adoption and pet care in Pakistan",
        },
        inLanguage: "en-PK",
    };
}

/**
 * Vets at Home is the only entity on this page that Paltuu actually provides,
 * so it is the only one marked up as a Service.
 */
export function vetsAtHomeServiceSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Paltuu Vets at Home",
        serviceType: "Veterinary house call",
        description:
            "Paltuu's own veterinary doctors visit your home for check-ups, vaccinations, neutering and spaying consultations, and grooming. Currently available in Karachi.",
        provider: {
            "@type": "Organization",
            name: "Paltuu",
            url: SITE_URL,
        },
        areaServed: { "@type": "City", name: VETS_AT_HOME.city },
        availableChannel: [
            { "@type": "ServiceChannel", serviceUrl: APP_LINKS.android },
            { "@type": "ServiceChannel", serviceUrl: APP_LINKS.ios },
        ],
        hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Vets at Home services",
            itemListElement: VETS_AT_HOME.services.map((service) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: service },
            })),
        },
    };
}
