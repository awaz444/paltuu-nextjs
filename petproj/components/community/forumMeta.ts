const EMOJI: Record<string, string> = {
    cats: "🐱",
    dogs: "🐶",
    birds: "🐦",
    rabbits: "🐰",
    fish: "🐟",
    reptiles: "🐢",
    horses: "🐴",
    adoption: "❤️",
    "lost-found": "🔍",
    "birds/duck": "🦆",
};

/** The icon shown next to a forum's name. */
export function speciesEmoji(speciesSlug: string | undefined): string {
    if (!speciesSlug) return "🐾";
    // "<species>/<breed>" falls back to the species when the breed has no icon of its own.
    return EMOJI[speciesSlug] || EMOJI[speciesSlug.split("/")[0]] || "🐾";
}

const ART: Record<string, string> = {
    cats: "/icons/species/cat.jpg",
    dogs: "/icons/species/dog.jpg",
    birds: "/icons/species/bird.jpg",
    rabbits: "/icons/species/rabbit.jpg",
    fish: "/icons/species/fish.jpg",
    reptiles: "/icons/species/turtle.jpg",
    horses: "/icons/species/horse.jpg",
    // Each city is drawn as its landmark.
    karachi: "/icons/landmarks/quaid-mausoleum.jpg",
    lahore: "/icons/landmarks/minar-e-pakistan.jpg",
    islamabad: "/icons/landmarks/faisal-mosque.jpg",
    adoption: "/icons/objects/heart.jpg",
    "lost-found": "/icons/objects/magnifying-glass.jpg",
    // Breeds with art of their own, keyed "<species>/<breed>" (PALTU-169).
    // Every other breed uses its species' drawing.
    "birds/duck": "/icons/species/duck.jpg",
};

/** Hand-drawn forum artwork in public/icons (not under /community, which redirects); null where there is none yet. */
export function speciesArt(forumSlug: string | undefined): string | null {
    if (!forumSlug) return null;
    return ART[forumSlug] || ART[forumSlug.split("/")[0]] || null;
}

/**
 * The key to pass to ForumIcon for a forum: "<species>/<breed>" when that
 * breed has a drawing of its own (ducks), otherwise the species slug.
 */
export function forumArtKey(speciesSlug: string | undefined, breedSlug?: string | null): string | undefined {
    if (!speciesSlug) return undefined;
    const key = breedSlug ? `${speciesSlug}/${breedSlug}` : null;
    return key && ART[key] ? key : speciesSlug;
}
