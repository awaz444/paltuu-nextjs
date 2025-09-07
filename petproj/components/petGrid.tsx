import React from "react";
import Link from "next/link"; // Import Link from next/link
import { EnvironmentOutlined, ShoppingOutlined } from "@ant-design/icons"; // Import EnvironmentOutlined from ant-design/icons

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
}

interface PetGridProps {
    pets: Pet[];
}

const PetGrid: React.FC<PetGridProps> = ({ pets }) => {
    useSetPrimaryColor();

    console.log("Pets in PetGrid:", pets);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Create new listing card */}
            <Link
                href="/create-listing"
                className="create-listing-btn hidden sm:flex bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 text-sm sm:text-base">
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
                Add Your Pet
            </Link>

            <Link
                href="/create-listing"
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 sm:hidden z-50 floating-btn">
                <button className="flex items-center gap-1.5 bg-white text-primary border-2 border-primary p-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
                    <span className="text-xs">Add Pet</span>
                </button>
            </Link>

            {pets.map((pet) => (
                <Link
                    key={pet.pet_id}
                    href={`/browse-pets/${pet.pet_id}`}
                    passHref>
                    <div
                        key={pet.pet_id}
                        className="bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300">
                        <div className="relative">
                            <img
                                src={pet.image_url || "/dog-placeholder.png"} // Fallback image if pet.image_url is null
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
                                    <ShoppingOutlined className="text-white mr-1" />{" "}
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
                            <div className="flex flex-row gap-2 right">
                                <EnvironmentOutlined className="text-primary" />
                                <p className="text-gray-600">{pet.city}</p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default PetGrid;
