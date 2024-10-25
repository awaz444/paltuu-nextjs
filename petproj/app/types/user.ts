// Define a User interface based on the expected user object structure
export interface User {
    user_id?: number; // Optional if not required during creation
    username: string;
    name: string;
    DOB: string;
    city_id: number | null; // Ensure this aligns with your API
    email: string;
    password: string;
    phone_number: string;
    role: 'admin' | 'regular user' | 'vet';
    profile_image_url?: string; // Optional
}


