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
    /** E.164, e.g. "+923001234567". Shown as WhatsApp and Call buttons. */
    phone?: string;
    /** Shown as email buttons, in this order. */
    emails?: string[];
};

export const BUSINESS_CARDS: Record<string, BusinessCard> = {
    aawaiz: {
        name: "Aawaiz Ali",
        firstName: "Aawaiz",
        role: "Co-founder & CEO",
        image: "/cards/aawaiz.jpg",
        message: "hey how ya doing",
        linkedin: "https://www.linkedin.com/in/aawaiz/",
        github: "https://github.com/awaz444",
        phone: "+923153738555",
        emails: ["aawaiz@paltuu.pk", "aawaizali8@gmail.com"],
    },
    shuja: {
        name: "Shuja Ur Rahman",
        firstName: "Shuja",
        role: "Co-founder & CTO",
        image: "/cards/shuja.jpg",
        message: "Hey! I build the tech behind Paltuu. If something looks broken, it's probably already fixed. Have a look around.",
        linkedin: null,
        github: null,
        emails: ["contact@paltuu.pk"],
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
        emails: ["contact@paltuu.pk"],
    },
    umer: {
        name: "Umer Noor",
        firstName: "Umer",
        role: "Chief Marketing Officer",
        image: "/cards/umer.jpg",
        message: "You found us! I'm the one telling everyone about Paltuu. Get the app, share your pet, and come say hi on Instagram.",
        linkedin: null,
        github: null,
        emails: ["contact@paltuu.pk"],
    },
    hamza: {
        name: "Hamza Siddiqui",
        firstName: "Hamza",
        role: "Chief Operating Officer",
        image: "/cards/hamza.jpg",
        message: "Glad you're here. I make sure everything at Paltuu runs smoothly, so you and your pet don't have to worry about a thing.",
        linkedin: null,
        github: null,
        emails: ["contact@paltuu.pk"],
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
