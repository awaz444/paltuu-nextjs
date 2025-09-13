export type PetWithImages = {
    pet_id: number;
    owner_id: number;
    pet_name: string;
    pet_type: number;
    pet_breed: string | null;
    city_id: number;
    area: string;
    age: number;
    months: number;
    description: string;
    adoption_status: string;
    price: string | null;
    min_age_of_children: number;
    can_live_with_dogs: boolean;
    can_live_with_cats: boolean;
    must_have_someone_home: boolean;
    energy_level: number;
    cuddliness_level: number;
    health_issues: string | null;
    created_at: string;
    email: string;
    phone_number: string;
    sex: string | null;
    listing_type: "adoption" | "sell" | "shop" | "rescue";
    vaccinated: boolean | null;
    neutered: boolean | null;
    city: string;
    profile_image_url: string | null;
    image_id: number | null;
    image_url: string | null;
    additional_images: Array<{ image_url: string }>;
    images: Array<{
        image_id: number;
        image_url: string;
        order: number;
    }>;
    owner?: {
        user_id: number;
        name: string;
        profile_image_url: string | null;
    };
    shop?: {
        shop_id: number;
        shop_name: string;
        logo_url: string | null;
    };
    shelter?: {
        shelter_id: number;
        shelter_name: string;
        logo_url: string | null;
    };
    // Add rescue-specific properties
    rescue_story?: string | null;
    special_needs?: string[];
    medical_conditions?: Array<{
        condition: string;
        treatment_cost: string;
        treated: boolean;
    }>;
};