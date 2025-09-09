import React from "react";
import Link from "next/link";

import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

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
    months: number;
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
    city: string;
    profile_image_url: string | null;
    image_id: number | null;
    image_url: string | null;
    images?: Array<{
        image_id: number;
        image_url: string;
        order: number;
    }>;
}

interface PetGridProps {
    pets: Pet[];
}

const RescuePetGrid: React.FC<PetGridProps> = ({ pets }) => {
    useSetPrimaryColor();

    console.log("Pets in RescuePetGrid:", pets);

    // Function to get the first ordered image (lowest order number)
    const getFirstImage = (pet: Pet) => {
        if (pet.images && pet.images.length > 0) {
            // Sort images by order and get the first one
            const sortedImages = [...pet.images].sort((a, b) => a.order - b.order);
            return sortedImages[0].image_url;
        }
        // Fallback to the old image_url field if images array doesn't exist
        return pet.image_url || "/dog-placeholder.png";
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pets.map((pet) => {
                const thumbnailUrl = getFirstImage(pet);
                
                return (
                    <Link
                        key={pet.pet_id}
                        href={`/browse-pets/${pet.pet_id}`}
                        passHref>
                        <div
                            className="bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300">
                            <div className="relative">
                                <img
                                    src={thumbnailUrl}
                                    alt={pet.pet_name}
                                    className="w-full aspect-square object-cover rounded-2xl"
                                />
                                {/* Overlay badge for price or rescue at the bottom-right */}
                                {pet.price && (
                                    <div className="absolute bottom-2 right-2 bg-primary text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2 py-1 rounded-full flex items-center">
                                        PKR{" "}
                                        {Math.floor(
                                            Number(pet.price)
                                        ).toLocaleString()}
                                    </div>
                                )}
                                {pet.listing_type === "rescue" && (
                                    <div className="absolute top-2 right-2 bg-primary text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2 py-1 rounded-full flex items-center">
                                        <span className="mr-1">+</span> Rescue
                                    </div>
                                )}
                                {pet.listing_type === "shop" && (
                                    <div className="absolute top-2 right-2 bg-primary text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2 py-1 rounded-full flex items-center">
                                        <svg className="w-3 h-3 text-white mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                                        </svg>
                                        Shop
                                    </div>
                                )}
                            </div>
                            <div className="py-4">
                                <h3 className="font-bold text-2xl mb-1 truncate max-w-[90%]">
                                    {pet.pet_name}
                                </h3>
                                <p className="text-gray-600 mb-1 truncate max-w-[90%]">
                                    {pet.age > 0 &&
                                        `${pet.age} ${
                                            pet.age > 1 ? "years" : "year"
                                        }`}
                                    {pet.age > 0 && pet.months > 0 && ", "}
                                    {pet.months > 0 &&
                                        `${pet.months} ${
                                            pet.months > 1 ? "months" : "month"
                                        } old`}
                                </p>
                                <div className="flex flex-row gap-2 items-center">
                                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-gray-600">{pet.city}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default RescuePetGrid;