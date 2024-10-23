// Define a single source of truth for the Vet type, maybe in a `types.ts` file
export interface Qualification {
    note: string;
    year_acquired: number;
    qualification_name: string;
    qualification_id: number;
  }
  
  export interface Specialization {
    category_id: number;
    category_name: string;
  }
  
  export interface Vet {
    vet_id: number;
    user_id: number;
    clinic_name: string;
    location: string;
    minimum_fee: number;
    contact_details: string;
    profile_verified: boolean;
    bio: string | null;
    name: string; // Make sure the name field exists here
    profile_image_url: string | null;
    city_id: number;
    city_name: string;
    qualifications: Qualification[];
    specializations: Specialization[];
  }
  