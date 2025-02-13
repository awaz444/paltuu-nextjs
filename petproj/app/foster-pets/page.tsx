"use client";
import { useEffect, useState } from "react";
import { fetchFosterPets } from "../store/slices/fosterPetsSlice"; // Import the action
import Navbar from "../../components/navbar";
import FosterVerticalSearchBar from "../../components/FosterVerticalSearchBar";
import FilterSection from "../../components/FilterSection";
import PetGrid from "../../components/petGrid";
import { MoonLoader } from "react-spinners";
import './styles.css';

// Define the structure of the pet object
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
    user_id: number;
    profile_image_url: string | null;
    image_id: number | null;
    image_url: string | null;
}

export default function FosterPets() {
    // Redux Dispatch and Selector

    // State for filter inputs
    const [filters, setFilters] = useState({
        isBuy: false,
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

    const handleReset = () => {
        setFilters({
            isBuy: false,
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

    // Define the pets state with the Pet[] type
    const [pets, setPets] = useState<Pet[]>([]); // Explicitly typed as Pet[]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPets = async () => {
            try {
                const response = await fetch("/api/foster-pets");
                if (!response.ok) throw new Error("Failed to fetch pets");
                const data = await response.json();
                setPets(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPets();
    }, []);

    const [primaryColor, setPrimaryColor] = useState("#000000"); // Default fallback color

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    const handleSearch = () => {
        console.log("Searching with filters:", filters);
        // You can add additional search functionality here (e.g., fetch new data based on filters)
    };

    // Filter pets based on the current filters
    const filteredPets = pets.filter((pet) => {
        const matchesSex = filters.selectedSex ? pet.sex === filters.selectedSex : true;
        const matchesMinAge = filters.minAge ? pet.age >= Number(filters.minAge) : true;
        const matchesMaxAge = filters.maxAge ? pet.age <= Number(filters.maxAge) : true;
        const matchesMinPrice = filters.minPrice ? Number(pet.price) >= Number(filters.minPrice) : true;
        const matchesMaxPrice = filters.maxPrice ? Number(pet.price) <= Number(filters.maxPrice) : true;
        const matchesArea = filters.area ? pet.area.includes(filters.area) : true;
        const matchesMinChildAge = filters.minChildAge ? pet.min_age_of_children >= Number(filters.minChildAge) : true;
        const matchesDogs = filters.canLiveWithDogs ? pet.can_live_with_dogs : true;
        const matchesCats = filters.canLiveWithCats ? pet.can_live_with_cats : true;
        const matchesVaccinated = filters.vaccinated ? pet.vaccinated : true;
        const matchesNeutered = filters.neutered ? pet.neutered : true;
        const matchesCity = filters.selectedCity ? pet.city_id === Number(filters.selectedCity) : true;
        const matchesSpecies = filters.selectedSpecies ? pet.pet_type === Number(filters.selectedSpecies) : true;
        const matchesBreed = filters.breed ? pet.pet_breed?.toLowerCase().includes(filters.breed.toLowerCase()) : true;

        return (
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
            <div className="fullBody" style={{ maxWidth: '90%', margin: '0 auto' }}>
                <FilterSection
                    onSearch={(filters) => setFilters((prev) => ({ ...prev, ...filters }))}
                />
                <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
                    <div className="flex w-full">
                        <div className="w-1/4 mr-4 vertical-search-bar">
                            <FosterVerticalSearchBar
                                onSearch={(newFilters) =>
                                    setFilters((prevFilters) => ({
                                        ...prevFilters,
                                        ...newFilters,
                                    }))
                                }
                                onReset={handleReset} // Pass reset function
                                onSearchAction={handleSearch} // Pass search function
                            />
                        </div>

                        <div className="w-3/4">
                            {loading ? (
                                <MoonLoader className="mt-5 mx-auto relative top-5" size={30} color={primaryColor} />
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
