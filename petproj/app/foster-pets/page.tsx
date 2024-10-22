"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import FosterVerticalSearchBar from "../../components/FosterVerticalSearchBar";
import FilterSection from "../../components/FilterSection";
import PetGrid from "../../components/petGrid";

// Define the Pet type
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

export default function BrowsePets() {
    // State for pets, loading, and error
    const [pets, setPets] = useState<Pet[]>([]); // Use Pet[] type for pets
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for filter inputs
    const [filters, setFilters] = useState({
        isAdopt: false,
        isBuy: false, // Added isBuy to state
        selectedSex: "",
        minAge: "",
        maxAge: "",
        minPrice: "",
        maxPrice: "",
        area: "",
        minChildAge: "",
        canLiveWithDogs: false,
        canLiveWithCats: false,
        vaccinated: false,
        neutered: false,
        selectedCity: "",
        selectedSpecies: "",
        breed: "",
    });

    // Fetch pets from the /api/browse-pets-objects
    useEffect(() => {
        const fetchPets = async () => {
            try {
                setLoading(true); // Set loading state
                const response = await fetch("/api/browse-pets-objects");
                if (!response.ok) throw new Error("Failed to fetch pets");

                const data = await response.json();
                setPets(data);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false); // Stop loading once the API call is done
            }
        };

        fetchPets();
    }, []);

    const handleReset = () => {
        // Reset filters to their initial state
        setFilters({
            isAdopt: false,
            isBuy: false, // Reset isBuy
            selectedSex: "",
            minAge: "",
            maxAge: "",
            minPrice: "",
            maxPrice: "",
            area: "",
            minChildAge: "",
            canLiveWithDogs: false,
            canLiveWithCats: false,
            vaccinated: false,
            neutered: false,
            selectedCity: "",
            selectedSpecies: "",
            breed: "",
        });
    };

    const handleSearch = () => {
        console.log("Searching with filters:", filters);
    };

    // Filter pets based on the current filters
    const filteredPets = pets.filter((pet) => {
        const matchesType = filters.isAdopt
            ? pet.listing_type === "adoption"
            : pet.listing_type === "foster";

        // Determine if the pet is for buying based on the price
        const isPetBuy = Number(pet.price) > 0; // Pet is for buying if price > 0
        const matchesBuy = filters.isBuy ? isPetBuy : !isPetBuy; // matches based on isBuy filter

        const matchesSex = filters.selectedSex
            ? pet.sex === filters.selectedSex
            : true;
        const matchesMinAge = filters.minAge
            ? pet.age >= Number(filters.minAge)
            : true;
        const matchesMaxAge = filters.maxAge
            ? pet.age <= Number(filters.maxAge)
            : true;
        const matchesMinPrice = filters.minPrice
            ? Number(pet.price) >= Number(filters.minPrice)
            : true;
        const matchesMaxPrice = filters.maxPrice
            ? Number(pet.price) <= Number(filters.maxPrice)
            : true;
        const matchesArea = filters.area
            ? pet.area.includes(filters.area)
            : true;
        const matchesMinChildAge = filters.minChildAge
            ? pet.min_age_of_children >= Number(filters.minChildAge)
            : true;
        const matchesDogs = filters.canLiveWithDogs
            ? pet.can_live_with_dogs
            : true;
        const matchesCats = filters.canLiveWithCats
            ? pet.can_live_with_cats
            : true;
        const matchesVaccinated = filters.vaccinated ? pet.vaccinated : true;
        const matchesNeutered = filters.neutered ? pet.neutered : true;
        const matchesCity = filters.selectedCity
            ? pet.city_id === Number(filters.selectedCity)
            : true;
        const matchesSpecies = filters.selectedSpecies
            ? pet.pet_type === Number(filters.selectedSpecies)
            : true;
        const matchesBreed = filters.breed
            ? pet.pet_breed?.toLowerCase().includes(filters.breed.toLowerCase())
            : true;

        return (
            matchesType &&
            matchesBuy && // Include the buy filter
            matchesSex &&
            matchesMinAge &&
            matchesMaxAge &&
            matchesMinPrice &&
            matchesMaxPrice &&
            matchesArea &&
            matchesMinChildAge &&
            matchesDogs &&
            matchesCats &&
            matchesVaccinated &&
            matchesNeutered &&
            matchesCity &&
            matchesSpecies &&
            matchesBreed
        );
    });

    return (
        <>
            <Navbar />
            <div className="fullBody">
                <FilterSection
                    onSearch={(filters) =>
                        setFilters((prev) => ({ ...prev, ...filters }))
                    }
                />
                <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
                    <div className="flex w-full">
                        <div className="w-1/4 mr-4">
                            <FosterVerticalSearchBar
                                onSearch={(newFilters) =>
                                    setFilters((prevFilters) => ({
                                        ...prevFilters,
                                        ...newFilters, // Spread the new filters, updating only the specified ones
                                    }))
                                }
                                onReset={handleReset} // Pass reset function
                                onSearchAction={handleSearch} // Pass search function
                            />
                        </div>
                        <div className="w-3/4">
                            {loading ? (
                                <p>Loading pets...</p>
                            ) : error ? (
                                <p>Error: {error}</p>
                            ) : (
                                <PetGrid pets={filteredPets} />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
