// Shape returned by /api/v1/rescue/pets and /api/v1/rescue/pets/[id]:
// a row from the shared `pets` table (listing_type = 'rescue') plus the
// rescue-specific aggregates the routes join in.
export type RescuePet = {
    pet_id: number;
    pet_name: string;
    pet_type: number;
    city_id: number | null;
    area: string | null;
    description: string | null;
    rescue_story: string | null;
    adoption_status: string | null;
    price: number | null;
    sex: string | null;
    age_months: number | null;
    vaccinated: boolean | null;
    neutered: boolean | null;
    created_at: string;
    shelter_id: number | null;
    images: string[];
    medical_conditions: {
        condition: string;
        treatment_cost?: number | null;
        treated?: boolean | null;
    }[];
    special_needs: string[];
    shelter: {
        id: number;
        name: string;
        profilePicture?: string | null;
        location: string | null;
        contactInfo?: string | null;
        verified?: boolean | null;
    } | null;
};

export const RESCUE_STATUS_LABELS: Record<string, string> = {
    available: "Available",
    foster: "In Foster Care",
    adopted: "Adopted",
};

export const rescueStatusLabel = (status: string | null | undefined) =>
    (status && RESCUE_STATUS_LABELS[status]) || "Available";
