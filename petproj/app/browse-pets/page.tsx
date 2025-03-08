"use client";
import { useEffect, useState } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import VerticalSearchBar from "../../components/VerticalSearchBar";
import FilterSection from "../../components/FilterSection";
import PetGrid from "../../components/petGrid";
import "./styles.css";
import { MoonLoader } from "react-spinners";

export default function BrowsePets() {
    useSetPrimaryColor();

    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
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

    const [activeTab, setActiveTab] = useState<"adopt" | "buy">("adopt");

    useEffect(() => {
        const fetchPets = async () => {
            try {
                const response = await fetch("/api/browse-pets");
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

    const handleReset = () => {
        setFilters({
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

    const filteredPets = pets.filter((pet: any) => {
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

        const matchesAdopt = activeTab === "adopt" ? Number(pet.price) === 0 : Number(pet.price) > 0;

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
            matchesBreed &&
            matchesAdopt
        );
    });

    const handleTabToggle = (tab: "adopt" | "buy") => {
        setActiveTab(tab);
    };

    const [primaryColor, setPrimaryColor] = useState("#A00000");

    useEffect(() => {
        // Get the computed style of the `--primary-color` CSS variable
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    return (
        <>
            <Navbar />
            <div className="fullBody" style={{ maxWidth: "90%", margin: "0 auto" }}>
                <FilterSection onSearch={(filters) => setFilters((prev) => ({ ...prev, ...filters }))} />
                <main className="flex min-h-screen flex-col mx-0 md:mx-8 mt-1 items-center pt-7 bg-gray-100">
                    <div className="flex w-full">
                        <div className="w-1/4 mr-4 vertical-search-bar">
                            <VerticalSearchBar onSearch={setFilters} onReset={handleReset} onSearchAction={handleSearch} />
                        </div>

                        <div className="w-full">
                            <div className="tab-switch-container relative">
                                <div
                                    className="tab-switch-slider absolute w-1/2 h-full transition-transform duration-300 rounded-lg bg-primary"
                                    style={{
                                        transform: activeTab === "adopt" ? "translateX(0)" : "translateX(100%)",
                                    }}
                                />
                                <div
                                    className={`tab ${activeTab === "adopt" ? "active" : ""}`}
                                    onClick={() => setActiveTab("adopt")}
                                >
                                    Adopt
                                </div>
                                <div
                                    className={`tab ${activeTab === "buy" ? "active" : ""}`}
                                    onClick={() => setActiveTab("buy")}
                                >
                                    Buy
                                </div>
                            </div>


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
