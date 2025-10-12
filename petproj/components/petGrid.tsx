"use client";
import React, { useState } from "react";
import Link from "next/link"; // Import Link from next/link
import { useRouter } from "next/navigation";
import { EnvironmentOutlined, ShoppingOutlined } from "@ant-design/icons"; // Import EnvironmentOutlined from ant-design/icons

import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { useAuth } from "@/context/AuthContext";

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
    const router = useRouter();
    const { isAuthenticated, user, refreshUser } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [cities, setCities] = useState<{ city_id: number; city_name: string }[]>([]);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    // Store only 10 digits input by user; prefix +92 is fixed
    const [phoneDigits, setPhoneDigits] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [inlineError, setInlineError] = useState<string | null>(null);
    

    console.log("Pets in PetGrid:", pets);

    const handleAddPetClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            router.push("/auth");
            return;
        }

        const userId = (user as any)?.id || (user as any)?.user_id;
        if (!userId) {
            router.push("/auth");
            return;
        }

        try {
            const res = await fetch(`/api/my-profile/${userId}`);
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/auth");
                    return;
                }
                setInlineError("Failed to fetch your profile.");
                return;
            }

            const data = await res.json();
            const missingCity = !data.city;
            const missingPhone = !data.phone_number;

            if (missingCity || missingPhone) {
                try {
                    const citiesRes = await fetch("/api/cities");
                    if (citiesRes.ok) {
                        const citiesData = await citiesRes.json();
                        setCities(citiesData);
                    } else {
                        setInlineError("Unable to load cities list.");
                    }
                } catch (err) {
                    console.error(err);
                    setInlineError("Error loading cities.");
                }

                setSelectedCity(data.city || null);
                // Pre-fill digits if phone_number starts with +92
                const existingPhone: string | undefined = data.phone_number || undefined;
                if (existingPhone && existingPhone.startsWith("+92") && existingPhone.length >= 13) {
                    setPhoneDigits(existingPhone.slice(3).replace(/\D/g, "").slice(0, 10));
                } else if (existingPhone) {
                    // Attempt to extract last 10 digits
                    const onlyDigits = existingPhone.replace(/\D/g, "");
                    setPhoneDigits(onlyDigits.slice(-10));
                } else {
                    setPhoneDigits("");
                }
                setIsModalVisible(true);
                return;
            }

            router.push("/create-listing");
        } catch (err) {
            console.error(err);
            setInlineError("Something went wrong. Please try again.");
        }
    };

    const handleSubmitMissingInfo = async () => {
        setInlineError(null);
        if (!selectedCity) {
            setInlineError("Please select your city.");
            return;
        }
        if (!/^\d{10}$/.test(phoneDigits)) {
            setInlineError("Please enter a valid 10-digit phone number.");
            return;
        }

        const userId = (user as any)?.id || (user as any)?.user_id;
        if (!userId) {
            setInlineError("User not identified. Please re-login.");
            return;
        }

        try {
            setSaving(true);
            const res = await fetch(`/api/my-profile/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ city: selectedCity, phone_number: `+92${phoneDigits}` }),
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({} as any));
                setInlineError(errJson.error || "Failed to update profile.");
                setSaving(false);
                return;
            }

            try {
                await (refreshUser?.() ?? Promise.resolve());
            } catch {}
            setIsModalVisible(false);
            router.push("/create-listing");
        } catch (err) {
            console.error(err);
            setInlineError("Error updating profile.");
        } finally {
            setSaving(false);
        }
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

            {isModalVisible && (
                <div className="fixed inset-0 z-[100]">
                    <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setIsModalVisible(false)} />
                    <div className="relative h-full w-full flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                            <div className="px-6 pt-5 pb-4 border-b">
                                <h2 className="text-lg font-semibold">Complete your profile</h2>
                                <p className="text-xs text-gray-500 mt-1">We need your city and phone number to publish listings.</p>
                                {inlineError && (
                                    <div className="mt-2 text-xs text-red-600">{inlineError}</div>
                                )}
                            </div>
                            <div className="px-6 py-4 flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium">City</span>
                                    <select
                                        className="input-field rounded-xl px-3 py-2"
                                        value={selectedCity ?? ""}
                                        onChange={(e) => setSelectedCity(e.target.value || null)}
                                    >
                                        <option value="" disabled>Select your city</option>
                                        {cities.map((c) => (
                                            <option key={c.city_id} value={c.city_name}>{c.city_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium">Phone number</span>
                                    <div className="flex items-center rounded-xl border border-gray-300 focus-within:border-primary">
                                        <span className="px-3 py-2 text-gray-600 select-none">+92</span>
                                        <input
                                            className="flex-1 input-field rounded-xl px-3 py-2 border-0"
                                            placeholder="XXXXXXXXXX"
                                            inputMode="numeric"
                                            pattern="\d{10}"
                                            maxLength={10}
                                            value={phoneDigits}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                setPhoneDigits(digits);
                                            }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-500">Enter 10 digits after +92, e.g., 3XXXXXXXXX</p>
                                </div>
                            </div>
                            <div className="px-6 pb-5 flex items-center justify-end gap-3">
                                <button
                                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700"
                                    disabled={saving}
                                    onClick={() => setIsModalVisible(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90"
                                    onClick={handleSubmitMissingInfo}
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save and continue"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>

        
    );
};

export default PetGrid;
