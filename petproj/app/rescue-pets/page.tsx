"use client";
import { useState, useEffect } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import RescueFilter from "../../components/RescueFilter";
import RescueGrid from "../../components/RescueGrid";
import { MoonLoader } from "react-spinners";
import "./styles.css";

export type RescuePet = {
    rescue_id: number;
    rescue_org_id: number;
    pet_name: string;
    pet_type: number;
    approximate_age_lower: number;
    approximate_age_higher: number;
    description: string;
    rescue_story: string;
    rescue_date: string;
    urgency_level: 'critical' | 'high' | 'moderate' | 'stable';
    status: 'at shelter' | 'adopted' | 'fostered' | 'medical care';
    medical_conditions: {
        condition: string;
        treatment_required: boolean;
        treatment_cost?: number;
        treated?: boolean;
    }[];
    special_needs: string[];
    current_location: string | null;
    sex: string;
    images: string[];
    adoption_fee: number | null;
    foster_available: boolean;
    vaccinated: boolean | null;
    neutered: boolean | null;
    temperament: 'calm' | 'energetic' | 'anxious' | 'playful' | 'independent';
    shelter: {
        id: number;
        name: string;
        profilePicture: string;
        location: string;
        contactInfo: string;
        verified: boolean;
        website?: string;
        rescueCount: number;
    };
};

const sampleRescuePets: RescuePet[] = [
    {
        rescue_id: 1,
        rescue_org_id: 101,
        pet_name: "Buddy",
        pet_type: 1, // Dog
        approximate_age_lower: 2,
        approximate_age_higher: 4,
        description: "Friendly golden retriever with a heart condition",
        rescue_story: "Found abandoned in a park with severe malnutrition. After months of care, he's ready for a loving home that can manage his medical needs.",
        rescue_date: "2023-05-15",
        urgency_level: "high",
        status: "at shelter",
        medical_conditions: [
            {
                condition: "Heart murmur",
                treatment_required: true,
                treatment_cost: 500,
                treated: false
            },
            {
                condition: "Malnutrition recovery",
                treatment_required: true,
                treated: true
            }
        ],
        special_needs: ["Special diet", "Regular vet checkups"],
        current_location: "Paws Haven Shelter",
        sex: "male",
        images: [
            "/dogs/buddy1.jpg",
            "/dogs/buddy2.jpg",
            "/dogs/buddy3.jpg"
        ],
        adoption_fee: 150,
        foster_available: true,
        vaccinated: true,
        neutered: true,
        temperament: "calm",
        shelter: {
            id: 101,
            name: "Paws Haven",
            profilePicture: "/shelters/paws-haven.jpg",
            location: "Karachi",
            contactInfo: "contact@pawshaven.org",
            verified: true,
            website: "www.pawshaven.org",
            rescueCount: 142
        }
    },
    {
        rescue_id: 2,
        rescue_org_id: 102,
        pet_name: "Mittens",
        pet_type: 2, // Cat
        approximate_age_lower: 1,
        approximate_age_higher: 2,
        description: "Playful tabby cat with three legs",
        rescue_story: "Rescued from a construction site after losing a leg in an accident. She's adapted wonderfully and loves to play.",
        rescue_date: "2023-08-22",
        urgency_level: "moderate",
        status: "fostered",
        medical_conditions: [
            {
                condition: "Amputated leg",
                treatment_required: false,
                treated: true
            }
        ],
        special_needs: ["Needs ground-level access"],
        current_location: "Foster Home - Lahore",
        sex: "female",
        images: [
            "/cats/mittens1.jpg",
            "/cats/mittens2.jpg"
        ],
        adoption_fee: null,
        foster_available: false,
        vaccinated: true,
        neutered: true,
        temperament: "playful",
        shelter: {
            id: 102,
            name: "Second Chance Felines",
            profilePicture: "/shelters/second-chance.jpg",
            location: "Lahore",
            contactInfo: "adopt@secondchance.org",
            verified: true,
            rescueCount: 89
        }
    },
    {
        rescue_id: 3,
        rescue_org_id: 103,
        pet_name: "Rocky",
        pet_type: 1, // Dog
        approximate_age_lower: 5,
        approximate_age_higher: 7,
        description: "Senior dog with arthritis looking for a quiet retirement home",
        rescue_story: "Owner passed away and no family could take him in. This gentle soul just needs a comfortable place to spend his golden years.",
        rescue_date: "2023-10-10",
        urgency_level: "stable",
        status: "at shelter",
        medical_conditions: [
            {
                condition: "Arthritis",
                treatment_required: true,
                treatment_cost: 100,
                treated: true
            }
        ],
        special_needs: ["Joint supplements", "Soft bedding"],
        current_location: "Happy Tails Sanctuary",
        sex: "male",
        images: [
            "/dogs/rocky1.jpg",
            "/dogs/rocky2.jpg"
        ],
        adoption_fee: 50,
        foster_available: true,
        vaccinated: true,
        neutered: true,
        temperament: "calm",
        shelter: {
            id: 103,
            name: "Happy Tails",
            profilePicture: "/shelters/happy-tails.jpg",
            location: "Islamabad",
            contactInfo: "info@happytails.pk",
            verified: false,
            rescueCount: 56
        }
    }
];

export default function RescuePets() {
    useSetPrimaryColor();

    const [pets] = useState<RescuePet[]>(sampleRescuePets);
    const [filters, setFilters] = useState({
        urgency: "",
        petType: "",
        location: "",
    });

    const [primaryColor, setPrimaryColor] = useState("#000000");

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    const filteredPets = pets.filter((pet) => {
        const matchesUrgency = filters.urgency 
            ? pet.urgency_level === filters.urgency
            : true;
        const matchesType = filters.petType
            ? pet.pet_type === Number(filters.petType)
            : true;
        const matchesLocation = filters.location
            ? pet.shelter.location.toLowerCase().includes(filters.location.toLowerCase())
            : true;

        return matchesUrgency && matchesType && matchesLocation;
    });

    const sortedPets = [...filteredPets].sort((a, b) => {
        // Sort by urgency (critical first)
        const urgencyOrder = { critical: 0, high: 1, moderate: 2, stable: 3 };
        return urgencyOrder[a.urgency_level] - urgencyOrder[b.urgency_level];
    });

    return (
        <>
            <Navbar />
            <div
                className="fullBody "
                style={{ maxWidth: "90%", margin: "0 auto" }}>
                <RescueFilter
                    onSearch={(filters) => {
                        setFilters(filters);
                    }}
                    onReset={() => {
                        setFilters({
                            urgency: "",
                            petType: "",
                            location: "",
                        });
                    }}
                />
                <main className="flex min-h-screen flex-col mx-0 md:mx-8 mt-1 items-center pt-7 bg-gray-100">
                    <div className="w-full">
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-bold text-gray-800">Rescue Pets Needing Homes</h1>
                            <p className="text-gray-600 mt-2">
                                These animals have been rescued and are looking for their forever homes
                            </p>
                        </div>

                        {sortedPets.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500">No rescue pets match your filters</p>
                                <button
                                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                                    onClick={() => setFilters({
                                        urgency: "",
                                        petType: "",
                                        location: "",
                                    })}
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <RescueGrid pets={sortedPets} />
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}