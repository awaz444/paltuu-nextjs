"use client";
import React from "react";
import Link from "next/link"; // Import Link from next/link
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import "./petGrid.css"; // Assuming the same styles are used for consistency

interface LostAndFoundPet {
    post_id: number;
    user_id: number;
    post_type: string;
    pet_description: string;
    city_id: number;
    location: string;
    contact_info: string;
    post_date: string;
    status: string;
    category_id: number;
    image_url: string | null;
    city: string; // Assuming city name is part of the data
    category_name: string; // Assuming category name is part of the data
}

interface LostAndFoundGridProps {
    pets: LostAndFoundPet[];
}

const LostAndFoundGrid: React.FC<LostAndFoundGridProps> = ({ pets }) => {
    useSetPrimaryColor();

    // Log the pets data to check if it is passed correctly
    console.log("Pets Data:", pets);

    // Check if pets array is empty
    if (pets.length === 0) {
        return <p>No lost or found pets available at the moment.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <Link
                href="/lost-and-found-create-listing"
                className="create-listing-btn bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex  flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300">
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
                Report Lost/Found 
            </Link>
            {pets.map((pet) => (
                
                    <div className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300">
                        <div className="relative">
                            <img
                                src={pet.image_url || "./dog-placeholder.png"} // Fallback image if pet.image_url is null
                                alt={pet.pet_description || "Lost or Found Pet"} // Improved alt text
                                className="w-full h-48 object-cover rounded-2xl"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-xl mb-2">
                                {pet.category_name}
                            </h3>
                            <p className="text-gray-600 mb-1">
                                {pet.city} - {pet.location}
                            </p>
                            {pet.pet_description && (
                                <p className="text-gray-600 mb-1 truncate">
                                    {pet.pet_description}
                                </p>
                            )}
                        </div>
                    </div>
            ))}
        </div>
    );
};

export default LostAndFoundGrid;
