"use client";
import React, { useState } from "react";
import Link from "next/link"; // Import Link from next/link
import { useRouter } from "next/navigation";
import { EnvironmentOutlined, ShoppingOutlined } from "@ant-design/icons"; // Import EnvironmentOutlined from ant-design/icons

import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { useAuth } from "@/context/AuthContext";

import "./petGrid.css";
import { formatAge } from "@/utils/formatAge";

interface Pet {
    pet_id: number;
    owner_id: number;
    pet_name: string;
    pet_type: number;
    pet_breed: string | null;
    city_id: number;
    area: string;
    age?: number;
    months?: number;
    age_months: number;
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

const PetImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"
                    }`}
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
};

const PetGrid: React.FC<PetGridProps> = ({ pets }) => {
    const router = useRouter();
    const { isAuthenticated, user, refreshUser } = useAuth();


    // console.log("Pets in PetGrid:", pets);

    const handleAddPetClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            router.push("/auth");
            return;
        }

        router.push("/create-listing");
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Create new listing card */}
            <Link
                href="#"
                onClick={handleAddPetClick}
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


            {pets.map((pet) => (
                <Link
                    key={pet.pet_id}
                    href={`/browse-pets/${pet.pet_id}`}
                    passHref>
                    <div
                        key={pet.pet_id}
                        className="bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 z-39">
                        <div className="relative">
                            <PetImage
                                src={pet.image_url || "/dog-placeholder.png"}
                                alt={pet.pet_name}
                                className="w-full aspect-square rounded-2xl"
                            />
                            {/* Overlay badge for price or rescue at the bottom-right */}
                            {/* {pet.price && (
                                <div className="absolute bottom-2 right-2 bg-primary text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2 py-1 rounded-full flex items-center">
                                    PKR{" "}
                                    {Math.floor(
                                        Number(pet.price)
                                    ).toLocaleString()}
                                </div>
                            )} */}
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
                            <h3 className="font-bold mb-1 truncate max-w-[90%]">
                                {pet.pet_name}
                            </h3>
                            <p className="text-gray-600 mb-1 truncate max-w-[90%]">
                                {formatAge(pet.age_months)}
                            </p>
                            <div className="flex flex-row gap-2 right">
                                <EnvironmentOutlined className="text-primary" />
                                <p className="text-gray-600">{pet.city}</p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
            <Link
                href="#"
                onClick={handleAddPetClick}
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 sm:hidden z-49">
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


        </div>


    );
};

export default PetGrid;
