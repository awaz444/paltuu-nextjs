export type RescuePet = {
    rescue_id: number;
    rescue_org_id: number;
    pet_name: string;
    pet_type: number;
    approximate_age_lower: number;
    approximate_age_higher: number;
    description: string;
    rescue_story: string;
    rescue_date: string;
    urgency_level: 'critical' | 'high' | 'moderate' | 'stable';
    status: 'at shelter' | 'adopted' | 'fostered' | 'medical care'; // Added status
    medical_conditions: {
        condition: string;
        treatment_required: boolean;
        treatment_cost?: number;
        treated?: boolean;
    }[];
    special_needs: string[];
    current_location: string | null;
    sex: string;
    images: string[];
    adoption_fee: number | null;
    foster_available: boolean;
    vaccinated: boolean | null; 
    neutered: boolean | null;    
    temperament: 'calm' | 'energetic' | 'anxious' | 'playful' | 'independent';
};