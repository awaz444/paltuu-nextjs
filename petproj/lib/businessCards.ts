/**
 * Founder business cards (PALTU-125, PALTU-128).
 *
 * Every card's QR opens https://www.paltuu.pk/?utm_source=card-<id>. The
 * landing page stays the same; components/cards/CardScanModal.tsx sees the
 * utm_source and greets the visitor with the person on that card. The id is
 * also what shows up per card in our traffic stats, so never rename one that
 * has been printed.
 */

export type BusinessCard = {
    name: string;
    firstName: string;
    role: string;
    /** The character drawn on the card, in public/cards. */
    image: string;
    /** Short note in the person's own voice. */
    message: string;
    linkedin: string | null;
    github: string | null;
};

export const BUSINESS_CARDS: Record<string, BusinessCard> = {
    aawaiz: {
        name: "Aawaiz Ali",
        firstName: "Aawaiz",
        role: "Co-founder & CEO",
        image: "/cards/aawaiz.jpg",
        message:
            "Thanks for scanning! Paltuu brings everything for your pet into one place, from adoption and the community to a vet at your door. Have a look around, and say hi anytime.",
        linkedin: null,
        github: null,
    },
    shuja: {
        name: "Shuja Ur Rahman",
        firstName: "Shuja",
        role: "Co-founder & CTO",
        image: "/cards/shuja.jpg",
        message: "Hey! I build the tech behind Paltuu. If something looks broken, it's probably already fixed. Have a look around.",
        linkedin: null,
        github: null,
    },
    // Shuja's second card design, the sleepy turtle. Same person, its own QR.
    "shuja-turtle": {
        name: "Shuja Ur Rahman",
        firstName: "Shuja",
        role: "Co-founder & CTO",
        image: "/cards/shuja-turtle.jpg",
        message: "Hey! I build the tech behind Paltuu. If something looks broken, it's probably already fixed. Have a look around.",
        linkedin: null,
        github: null,
    },
    umer: {
        name: "Umer Noor",
        firstName: "Umer",
        role: "Chief Marketing Officer",
        image: "/cards/umer.jpg",
        message: "You found us! I'm the one telling everyone about Paltuu. Get the app, share your pet, and come say hi on Instagram.",
        linkedin: null,
        github: null,
    },
    hamza: {
        name: "Hamza Siddiqui",
        firstName: "Hamza",
        role: "Chief Operating Officer",
        image: "/cards/hamza.jpg",
        message: "Glad you're here. I make sure everything at Paltuu runs smoothly, so you and your pet don't have to worry about a thing.",
        linkedin: null,
        github: null,
    },
};

/** The card a visit came from, read from utm_source=card-<id>. */
export function cardFromSearch(search: string): { id: string; card: BusinessCard } | null {
    const source = new URLSearchParams(search).get("utm_source") ?? "";
    const match = /^card-([a-z-]+)$/.exec(source.toLowerCase());
    if (!match) return null;
    const card = BUSINESS_CARDS[match[1]];
    return card ? { id: match[1], card } : null;
}
