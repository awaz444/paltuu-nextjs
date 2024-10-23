"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store"; // Adjust the import path
import { fetchFosterPets } from "../store/slices/fosterPetsSlice"; // Import the action
import Navbar from "@/components/navbar";
import FosterVerticalSearchBar from "../../components/FosterVerticalSearchBar";
import FilterSection from "../../components/FilterSection";
import PetGrid from "../../components/petGrid";

export default function FosterPets() {
    // Redux Dispatch and Selector
    const dispatch = useDispatch<AppDispatch>();
    const { pets, loading, error } = useSelector((state: RootState) => state.fosterPets); // Get foster pets from Redux store

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

    // Fetch foster pets from the Redux store
    useEffect(() => {
        dispatch(fetchFosterPets()); // Dispatch action to fetch foster pets
    }, [dispatch]);

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

    const handleSearch = () => {
        console.log("Searching with filters:", filters);
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
            <div className="fullBody" style={{maxWidth: '90%', margin: '0 auto'}}>
                <FilterSection
                    onSearch={(filters) => setFilters((prev) => ({ ...prev, ...filters }))}
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
