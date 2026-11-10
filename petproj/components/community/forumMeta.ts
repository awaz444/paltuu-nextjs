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
};

/** The icon shown next to a forum's name. */
export function speciesEmoji(speciesSlug: string | undefined): string {
    return (speciesSlug && EMOJI[speciesSlug]) || "🐾";
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
};

/** Hand-drawn forum artwork in public/icons (not under /community, which redirects); null where there is none yet. */
export function speciesArt(forumSlug: string | undefined): string | null {
    return (forumSlug && ART[forumSlug]) || null;
}
