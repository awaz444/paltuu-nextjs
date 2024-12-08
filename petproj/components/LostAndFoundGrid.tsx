"use client";
import React from "react";
import Link from "next/link"; // Import Link from next/link
import { useSetPrimaryColor } from '@/app/hooks/useSetPrimaryColor';
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

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {pets.map((pet) => (
                <Link 
                    key={pet.post_id} 
                    href={`/lost-found/${pet.post_id}`} 
                    passHref
                >
                    <div
                        className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300"
                    >
                        <div className="relative">
                            <img
                                src={pet.image_url || "/placeholder-image.png"} // Fallback image if pet.image_url is null
                                alt={pet.category_name}
                                className="w-full h-48 object-cover rounded-2xl"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-xl mb-2">
                                {pet.category_name}
                            </h3>
                            <p className="text-gray-600 mb-1">
                                City: {pet.city}
                            </p>
                            <p className="text-gray-600 mb-1">
                                Location: {pet.location}
                            </p>
                            {pet.pet_description && (
                                <p className="text-gray-600 mb-1 truncate">
                                    {pet.pet_description}
                                </p>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default LostAndFoundGrid;
