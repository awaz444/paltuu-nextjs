/**
 * Copy for community pages: a short intro per species and per breed community.
 *
 * Keyed by community species slug ("cats") and breed slug from lib/breeds.ts.
 * Kept short and general on purpose — these sit above real posts from owners,
 * they are not care guides, and nothing here should read as veterinary advice.
 * A breed without an entry still gets a page; it just falls back to a generic
 * line built from its name.
 */

export type CommunityGuide = {
    /** Shown as the community's title when it differs from the breed name. */
    communityName?: string;
    intro: string;
    /** Things owners in this community commonly talk about. */
    topics: string[];
};

export const SPECIES_GUIDES: Record<string, CommunityGuide> = {
    cats: {
        intro: "Cat owners across Pakistan sharing photos, questions and everyday life with their cats, from desi street cats to Persians.",
        topics: ["Food and diet", "Grooming and shedding", "Vaccinations and vet visits", "Litter training", "Keeping cats cool in summer"],
    },
    dogs: {
        intro: "Dog owners across Pakistan sharing their dogs, training wins and questions, from German Shepherds to rescued street dogs.",
        topics: ["Training and walks", "Food and diet", "Vaccinations and vet visits", "Heat and exercise", "Grooming"],
    },
    birds: {
        intro: "Bird keepers across Pakistan sharing their budgies, cockatiels, parrots and pigeons, and asking each other for advice.",
        topics: ["Cages and setup", "Seed and fresh food", "Taming and talking", "Breeding season", "Keeping birds cool"],
    },
    rabbits: {
        intro: "Rabbit owners in Pakistan sharing their bunnies and swapping notes on hay, housing and handling.",
        topics: ["Hay and greens", "Housing", "Handling", "Heat in summer"],
    },
    fish: {
        intro: "Aquarium keepers in Pakistan sharing their tanks, fish and setups.",
        topics: ["Tank setup", "Water quality", "Feeding", "Tank mates"],
    },
    reptiles: {
        intro: "Turtle, tortoise and reptile keepers in Pakistan sharing their animals and setups.",
        topics: ["Enclosures", "Heat and lighting", "Feeding"],
    },
};

/** Keyed by species slug, then breed slug. */
export const BREED_GUIDES: Record<string, Record<string, CommunityGuide>> = {
    cats: {
        "street-cat": {
            communityName: "Desi and street cats",
            intro: "Most cats in Pakistan are desi cats with no particular breed, and that includes many of the friendliest ones. Rescued, adopted or fed on the street, this is their community.",
            topics: ["Rescue and adoption", "Neutering and vaccinations", "Feeding street cats", "Settling a rescued cat in"],
        },
        persian: {
            intro: "Persians are one of the most popular cat breeds in Pakistan, known for long coats and calm temperaments. This community also includes Persian mixes.",
            topics: ["Daily brushing and matting", "Eye cleaning", "Summer heat and long coats", "Food and hairballs"],
        },
        siamese: {
            intro: "Siamese cats are slim, vocal and very people-focused. Owners here share their cats and talk about keeping such a social breed busy.",
            topics: ["Attention and play", "Food and diet", "Vet visits"],
        },
        himalayan: {
            intro: "Himalayans combine a Persian-type long coat with colour-point markings. Owners share grooming routines and everyday life with them.",
            topics: ["Grooming", "Eye cleaning", "Summer heat"],
        },
        "khao-manee": {
            intro: "Khao Manee are white cats, often odd-eyed, originally from Thailand. Owners in Pakistan share photos and care notes here.",
            topics: ["Grooming", "Hearing checks", "Food and diet"],
        },
        "turkish-angora": {
            intro: "Turkish Angoras are graceful, active cats with silky coats. Owners share their cats and grooming tips here.",
            topics: ["Grooming", "Play and activity", "Food and diet"],
        },
    },
    dogs: {
        "german-shepherd": {
            intro: "German Shepherds are one of the most kept breeds in Pakistan: loyal, protective and very trainable. Owners share training, food and health experiences here.",
            topics: ["Training and obedience", "Exercise in hot weather", "Hip and joint health", "Food and diet"],
        },
        labrador: {
            intro: "Labradors are friendly, food-motivated family dogs. Owners share their Labs, training wins and diet questions here.",
            topics: ["Training", "Weight and diet", "Swimming and exercise"],
        },
        "golden-retriever": {
            intro: "Golden Retrievers are gentle, social family dogs with thick coats. Owners share grooming and life with them in Pakistan's climate.",
            topics: ["Grooming and shedding", "Heat and exercise", "Training"],
        },
        husky: {
            intro: "Huskies are energetic working dogs with double coats built for cold weather, so keeping them comfortable in Pakistan's summers is a common topic here.",
            topics: ["Keeping cool in summer", "Exercise", "Shedding", "Escape-proofing"],
        },
        rottweiler: {
            intro: "Rottweilers are strong, confident guardian dogs. Owners share training, socialisation and health experiences here.",
            topics: ["Training and socialisation", "Exercise", "Food and diet"],
        },
        "pomeranian-spitz": {
            communityName: "Pomeranians and Spitz",
            intro: "Pomeranians and Spitz-type dogs are small, fluffy and alert, and very popular in Pakistani homes. Owners share grooming and everyday life here.",
            topics: ["Grooming", "Barking", "Dental care", "Summer heat"],
        },
        "shih-tzu": {
            intro: "Shih Tzus are small companion dogs with long coats. Owners share grooming routines and life with them here.",
            topics: ["Grooming and haircuts", "Eye care", "Food and diet"],
        },
        poodle: {
            intro: "Poodles are clever, low-shedding dogs that need regular grooming. Owners share their dogs and grooming tips here.",
            topics: ["Grooming", "Training", "Food and diet"],
        },
        pug: {
            intro: "Pugs are affectionate, flat-faced companion dogs. Owners share their pugs and talk about breathing and heat, which matters for flat-faced breeds.",
            topics: ["Heat and breathing", "Weight", "Skin fold care"],
        },
        "belgian-malinois": {
            intro: "Belgian Malinois are intense, high-energy working dogs. Owners share training and exercise routines here.",
            topics: ["Training", "Exercise and work", "Socialisation"],
        },
        "pakistani-mastiff": {
            communityName: "Pakistani Mastiffs (Bully Kutta)",
            intro: "The Pakistani Mastiff, often called Bully Kutta, is a large, powerful guardian breed from the subcontinent. Owners share their dogs and experience raising them responsibly.",
            topics: ["Training and socialisation", "Space and exercise", "Food for large breeds"],
        },
        "himalayan-sheepdog": {
            communityName: "Himalayan Sheepdogs (Gaddi)",
            intro: "Himalayan Sheepdogs, or Gaddi dogs, are hardy mountain guardians of the region. Owners share their dogs and how they live with them.",
            topics: ["Guarding behaviour", "Exercise", "Coat care"],
        },
        beagle: {
            intro: "Beagles are curious, friendly scent hounds. Owners share their beagles and swap notes on training and food here.",
            topics: ["Training and recall", "Food and weight", "Exercise"],
        },
        "street-dog": {
            communityName: "Desi and street dogs",
            intro: "Desi dogs are hardy, smart and well suited to Pakistan's climate. Rescued, adopted or cared for on the street, this is their community.",
            topics: ["Rescue and adoption", "Vaccinations and neutering", "Feeding street dogs", "Settling a rescue in"],
        },
        mixed: {
            communityName: "Mixed-breed dogs",
            intro: "Mixed-breed dogs and crosses, shared by the owners who love them.",
            topics: ["Training", "Food and diet", "Adoption stories"],
        },
    },
    birds: {
        budgie: {
            intro: "Budgies, often sold in Pakistan as \"Australian parrots\", are small, social parakeets. Keepers share their flocks, setups and questions here.",
            topics: ["Cages and flock size", "Seed and fresh food", "Taming", "Breeding"],
        },
        cockatiel: {
            intro: "Cockatiels are gentle, crested parrots that often learn to whistle. Keepers share their birds and care routines here.",
            topics: ["Taming and whistling", "Diet", "Cage setup"],
        },
        lovebird: {
            intro: "Lovebirds are small, colourful and lively parrots. Keepers share their pairs, setups and breeding experience here.",
            topics: ["Pairs and breeding", "Diet", "Cage setup"],
        },
        ringneck: {
            intro: "Ringnecks are long-tailed parakeets that are common in the region and can learn to talk. Keepers share their birds and training here.",
            topics: ["Talking and training", "Diet", "Cage and flight time"],
        },
        alexandrine: {
            intro: "Alexandrines, known locally as Raw tota, are large parakeets of the region. Keepers share their birds and care experience here.",
            topics: ["Talking", "Diet", "Space and flight time"],
        },
        "african-grey": {
            intro: "African Greys are highly intelligent, long-lived parrots that need a lot of attention. Keepers share their birds and enrichment ideas here.",
            topics: ["Talking and enrichment", "Diet", "Long-term care"],
        },
        pigeon: {
            communityName: "Pigeons (Kabootar)",
            intro: "Keeping pigeons, or kabootar, has a long tradition in Pakistan. Keepers share their birds, lofts and breeds here.",
            topics: ["Lofts and setup", "Breeds", "Flying and training", "Feed"],
        },
    },
};

export function speciesGuide(speciesSlug: string): CommunityGuide | null {
    return SPECIES_GUIDES[speciesSlug] ?? null;
}

export function breedGuide(speciesSlug: string, breedSlug: string, breedName: string, speciesName: string): CommunityGuide {
    return (
        BREED_GUIDES[speciesSlug]?.[breedSlug] ?? {
            intro: `${breedName} owners in Pakistan sharing their ${speciesName.toLowerCase()}, photos and questions.`,
            topics: [],
        }
    );
}
