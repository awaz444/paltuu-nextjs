import React from "react";
import Link from "next/link"; // Import Link from next/link

import "./petGrid.css";

interface Pet {
    pet_id: number;
    owner_id: number;
    pet_name: string;
    pet_type: number;
    pet_breed: string | null;
    city_id: number;
    area: string;
    age: number;
    description: string;
    adoption_status: string;
    price: string;
    min_age_of_children: number;
    can_live_with_dogs: boolean;
    can_live_with_cats: boolean;
    must_have_someone_home: boolean;
    energy_level: number;
    cuddliness_level: number;
    health_issues: string;
    created_at: string;
    sex: string | null;
    listing_type: string;
    vaccinated: boolean | null;
    neutered: boolean | null;
    payment_frequency: string | null;
    city: string;
    profile_image_url: string | null;
    image_id: number | null;
    image_url: string | null;
}

interface PetGridProps {
    pets: Pet[];
}

const PetGrid: React.FC<PetGridProps> = ({ pets }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Create new listing card */}
            <Link
                href="/create-listing"
                className="create-listing-btn bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex  flex-col items-center justify-center border-2 border-transparent hover:border-[#A03048] hover:scale-102 transition-all duration-300">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-plus-circle mb-5 plus-sign"
                    viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                </svg>
                Create new listing
            </Link>

            {pets.map((pet) => (
                <div
                    key={pet.pet_id}
                    className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-[#A03048] hover:scale-102 transition-all duration-300">
                    <img
                        src={pet.image_url || "/placeholder.jpg"} // Fallback image if pet.image_url is null
                        alt={pet.pet_name}
                        className="w-full h-48 object-cover rounded-2xl"
                    />
                    <div className="p-4">
                        <h3 className="font-bold text-2xl mb-1">
                            {pet.pet_name}
                        </h3>
                        <p className="text-gray-600 mb-1">
                            Age: {pet.age} years
                        </p>
                        <p className="text-gray-600 mb-1">
                            {pet.city} - {pet.area}
                        </p>
                        {/* Conditionally render the price if it's greater than zero */}
                        {Number(pet.price) > 0 && (
                            <p className="text-red-600 font-semibold">
                                PKR {pet.price} - {pet.payment_frequency}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PetGrid;
