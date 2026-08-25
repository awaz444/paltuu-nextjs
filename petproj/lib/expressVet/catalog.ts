// Vets at Home ("Express Vet") — shared category/species catalog. Fixed at the app layer
// (not app_settings) since it doesn't need ops-side tuning the way pricing/questionnaires do.
// Used by both the client-facing config endpoint and request creation's server-side validation.

export const EXPRESS_VET_CATEGORY_LABELS: Record<string, string> = {
  express_vet: "Urgent Visit",
  normal_vet: "Scheduled Visit",
  neutering: "Neutering",
  spaying: "Spaying",
  vaccination: "Vaccination",
  grooming: "Grooming",
};

export const EXPRESS_VET_CATEGORY_SPECIES: Record<string, string[]> = {
  express_vet: ["dog", "cat", "other"],
  normal_vet: ["dog", "cat", "other"],
  neutering: ["dog", "cat"],
  spaying: ["dog", "cat"],
  vaccination: ["dog", "cat"],
  grooming: ["dog", "cat"],
};

export function isValidExpressVetCategory(category: unknown): category is string {
  return typeof category === "string" && category in EXPRESS_VET_CATEGORY_SPECIES;
}

export function isValidExpressVetSpecies(category: string, species: unknown): species is string {
  return typeof species === "string" && EXPRESS_VET_CATEGORY_SPECIES[category]?.includes(species);
}

// Grooming is the only category priced as a cart: `express_vet_requests.sub_service` holds a
// comma-joined list of these keys (e.g. "quick_clean,shave"), and the total is the sum of each
// item's express_vet_rate_cards row — see requests/route.ts. Every other category keeps
// sub_service as a single value (or null). Keys must match the sub_service values seeded in
// prisma/seed-express-vet-config.ts and GROOMING_SUB_SERVICE_ORDER in the RN app's
// src/constants/expressVet.ts exactly. "quick_clean" (medicated bath + haircut + nail trim +
// ear clean, fixed 5000) is just another cart item, not a separate mechanism — it can be
// selected alongside any other item, which is how "add extras on top of the package" works.
export const EXPRESS_VET_GROOMING_ITEM_KEYS = [
  "quick_clean",
  "medicated_bath",
  "haircut_trim",
  "de_shedding",
  "flea_tick_treatment",
  "shave",
  "nail_trimming",
  "ear_cleaning",
  "sanitary_trim",
];

export function parseGroomingCart(subService: string | null | undefined): string[] {
  if (!subService) return [];
  return subService
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Must match the CHECK constraint on express_vet_reviews.addon_reason_tags in
// migrations/016_express_vet_schema.sql exactly.
export const EXPRESS_VET_ADDON_REASON_TAGS = [
  "Additional Treatment",
  "Medication/Prescription",
  "Diagnostic Test/Lab Work",
  "Extra Grooming Service",
  "Other",
];
