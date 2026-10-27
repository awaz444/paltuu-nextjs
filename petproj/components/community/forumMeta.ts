const EMOJI: Record<string, string> = {
    cats: "🐱",
    dogs: "🐶",
    birds: "🐦",
    rabbits: "🐰",
    fish: "🐟",
    reptiles: "🐢",
};

/** The icon shown next to a forum's name. */
export function speciesEmoji(speciesSlug: string | undefined): string {
    return (speciesSlug && EMOJI[speciesSlug]) || "🐾";
}

const ART: Record<string, string> = {
    cats: "cat",
    dogs: "dog",
    birds: "bird",
    rabbits: "rabbit",
    fish: "fish",
    reptiles: "turtle",
};

/** Hand-drawn forum artwork in public/icons/species (not under /community, which redirects); null where there is none yet. */
export function speciesArt(speciesSlug: string | undefined): string | null {
    const name = speciesSlug && ART[speciesSlug];
    return name ? `/icons/species/${name}.jpg` : null;
}
