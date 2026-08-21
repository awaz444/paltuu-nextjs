// Vets at Home ("Express Vet") — shared category/species catalog. Fixed at the app layer
// (not app_settings) since it doesn't need ops-side tuning the way pricing/questionnaires do.
// Used by both the client-facing config endpoint and request creation's server-side validation.

export const EXPRESS_VET_CATEGORY_LABELS: Record<string, string> = {
  express_vet: "Express Vet",
  normal_vet: "Normal Vet",
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

// Must match the CHECK constraint on express_vet_reviews.addon_reason_tags in
// migrations/016_express_vet_schema.sql exactly.
export const EXPRESS_VET_ADDON_REASON_TAGS = [
  "Additional Treatment",
  "Medication/Prescription",
  "Diagnostic Test/Lab Work",
  "Extra Grooming Service",
  "Other",
];
