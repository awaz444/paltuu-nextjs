export interface VetPanelData {
    personal_info: {
        vet_id: number;
        user_id: number;
        clinic_name: string;
        location: string;
        minimum_fee: number;
        contact_details: string;
        profile_verified: boolean;
        created_at: string; // ISO date string
        bio: string | null;
        vet_name: string;
        dob: string; // ISO date string
        email: string;
        profile_image_url: string;
        city: string;
    };
    reviews_summary: {
        average_rating: string; // Number in string format (e.g., "3.7")
        total_reviews: string; // Number in string format
    };
    qualifications: string[]; // Array of qualification names
    specializations: string[]; // Array of specialization categories
    schedules: {
        end_time: string; // Time string (e.g., "03:53:00")
        start_time: string; // Time string (e.g., "23:53:00")
        day_of_week: string; // Day of the week (e.g., "Monday")
    }[];
}
