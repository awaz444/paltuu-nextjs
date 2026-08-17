export type ClinicListingType = "clinic" | "home_vet";

export interface Clinic {
    clinic_id: number;
    slug?: string;
    name: string;
    address: string;
    city?: string;
    listing_type?: ClinicListingType;
    coverage_area?: string | null;
    category?: string;
    contact_number?: string;
    whatsapp_number?: string;
    website?: string;
    logo_url?: string;
    operating_hours?: string;
    is_paltuu_partner: boolean;
    is_verified?: boolean;
    is_active?: boolean;
    google_maps_link?: string;
    discount_details?: string;
    rating?: number;
    total_reviews?: number;
    vet_count?: number;
    owner_email?: string;
    created_at?: string;
    latitude?: number;
    longitude?: number;
}
