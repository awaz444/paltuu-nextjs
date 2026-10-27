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
