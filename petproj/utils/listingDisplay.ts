// Display helpers shared by the owner-facing listing pages (My Listings,
// Adoption Applicants). Kept free of React so both pages and the grid can use them.

export const PET_TYPE_OPTIONS = [
    { value: 1, label: "Dog" }, { value: 2, label: "Cat" }, { value: 3, label: "Bird" },
    { value: 4, label: "Fish" }, { value: 5, label: "Rabbit" }, { value: 6, label: "Hamster" },
    { value: 7, label: "Guinea Pig" }, { value: 8, label: "Turtle" }, { value: 11, label: "Horse" }, { value: 15, label: "Mouse" },
];

export type ListingStatus = "live" | "review" | "paused" | "adopted";

interface StatusSource {
    adoption_status?: string | null;
    approved?: boolean | null;
}

/** Collapses adoption_status + admin approval into the four states the owner sees. */
export function getListingStatus(pet: StatusSource): ListingStatus {
    if (pet.adoption_status === "adopted" || pet.adoption_status === "fostered") return "adopted";
    if (pet.adoption_status === "paused") return "paused";
    if (!pet.approved) return "review";
    return "live";
}

export const LISTING_STATUS_META: Record<ListingStatus, { label: string; dot: string }> = {
    live: { label: "Live", dot: "#15803D" },
    review: { label: "In review", dot: "#B45309" },
    paused: { label: "Paused", dot: "#71717A" },
    adopted: { label: "Adopted", dot: "#18181B" },
};

export const APPLICATION_STATUS_META: Record<string, { label: string; dot: string }> = {
    pending: { label: "Pending", dot: "#B45309" },
    approved: { label: "Approved", dot: "#15803D" },
    rejected: { label: "Declined", dot: "#A1A1AA" },
};

const LISTING_TYPE_LABELS: Record<string, string> = {
    adoption: "Adoption",
    foster: "Foster",
    rescue: "Rescue",
    sell: "For sale",
    shop: "Shop",
};

export function petTypeLabel(petType?: number | null): string | null {
    return PET_TYPE_OPTIONS.find((o) => o.value === petType)?.label ?? null;
}

/** "Adoption · Dog" */
export function listingKindLabel(listingType?: string | null, petType?: number | null): string {
    const kind = (listingType && LISTING_TYPE_LABELS[listingType]) || "Listing";
    const species = petTypeLabel(petType);
    return species ? `${kind} · ${species}` : kind;
}

export function formatFee(price?: string | number | null): string {
    const n = Number(price);
    if (!price || !Number.isFinite(n) || n <= 0) return "Free";
    return `Rs ${n.toLocaleString("en-PK")}`;
}

export function getInitials(name?: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.slice(0, 2) ?? "?";
    return letters.toUpperCase();
}

export function formatShortDate(value?: string | null): string {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

/** Muted, distinct backgrounds for initials avatars; picked by index so a row stays stable. */
export const AVATAR_TONES = ["#E7E1D7", "#DDE3E8", "#E6DDE2", "#E1E6DD", "#E8E2DA"];
