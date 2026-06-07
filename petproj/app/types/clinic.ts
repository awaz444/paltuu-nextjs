export interface Clinic {
    clinic_id: number;
    name: string;
    address: string;
    city?: string;
    category?: string;
    contact_number?: string;
    whatsapp_number?: string;
    website?: string;
    logo_url?: string;
    operating_hours?: string;
    is_paltuu_partner: boolean;
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
