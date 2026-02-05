export interface Clinic {
    clinic_id: number;
    name: string;
    address: string;
    contact_number: string;
    whatsapp_number: string;
    logo_url: string;
    operating_hours: string;
    is_paltuu_partner: boolean;
    google_maps_link?: string;
}
