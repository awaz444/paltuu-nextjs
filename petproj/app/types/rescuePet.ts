export type RescuePet = {
    rescue_id: number;
    rescue_org_id: number;
    pet_name: string;
    pet_type: number;
    approximate_age: string; // "2-3 years" instead of exact numbers
    description: string;
    rescue_story: string; // Emotional backstory
    rescue_date: string;
    urgency_level: 'critical' | 'high' | 'moderate' | 'stable';
    medical_conditions: {
        condition: string;
        treatment_required: boolean;
        treatment_cost?: number;
        treated?: boolean;
    }[];
    behavioral_notes: string;
    special_needs: string[];
    current_location: string;
    sex: string;
    profile_image_url: string; // comes from user table
    additional_images: string[];
    adoption_fee: number | null; // Often waived or reduced for rescues
    foster_available: boolean;
    sponsorship_available: boolean; // For users who can't adopt but want to help
    progress_notes: string[]; // ["Learned to trust humans", "Starting to play"]
};