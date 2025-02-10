"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store";
import { fetchCities } from "../app/store/slices/citiesSlice";
import { fetchPetCategories } from "../app/store/slices/petCategoriesSlice";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface FilterSectionProps {
    onSearch: (filters: {
        selectedCity: string;
        selectedSpecies: string;
        breed: string;
    }) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ onSearch }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    const [selectedCity, setSelectedCity] = useState("");
    const [selectedSpecies, setSelectedSpecies] = useState("");
    const [breed, setBreed] = useState("");
    const [showMoreFilters, setShowMoreFilters] = useState(false);

    useSetPrimaryColor();

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    const handleReset = () => {
        setSelectedCity("");
        setSelectedSpecies("");
        setBreed("");
        onSearch({ selectedCity: "", selectedSpecies: "", breed: "" });
    };

    const handleSearch = () => {
        onSearch({ selectedCity, selectedSpecies, breed });
    };

    return (
        <div className="bg-gray-100 pt-6">
            <div className="bg-white px-8 py-2 w-700" style={{ margin: "0px 32px", borderRadius: "2rem" }}>
                {/* Large screen layout (Original) */}
                <div className="hidden md:flex flex-wrap gap-4 mb-4 mt-4 items-center">
                    {/* Species dropdown */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Species</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={selectedSpecies}
                            onChange={(e) => setSelectedSpecies(e.target.value)}
                        >
                            <option value="">Select Species</option>
                            {categories.map((category) => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Breed input field */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Breed</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl"
                            value={breed}
                            onChange={(e) => setBreed(e.target.value)}
                            placeholder="Enter Breed"
                        />
                    </div>

                    {/* Cities dropdown */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">City</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            <option value="">Select City</option>
                            {cities.map((city) => (
                                <option key={city.city_id} value={city.city_id}>
                                    {city.city_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 mt-4">
                        <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl" onClick={handleReset}>
                            Reset
                        </button>
                        <button className="text-white p-3 rounded-2xl w-40 bg-primary" onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </div>

                {/* Small screen layout */}
                <div className="md:hidden flex flex-col gap-4">
                    {/* Species dropdown */}
                    <div className="species-filter">
                        <label className="text-xs">Species</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={selectedSpecies}
                            onChange={(e) => setSelectedSpecies(e.target.value)}
                        >
                            <option value="">Select Species</option>
                            {categories.map((category) => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

{/* Search & More Filters buttons */}
<div className="search-more-container flex justify-between w-full px-4 gap-4">
    <button className="text-white p-3 rounded-xl bg-primary flex-1 whitespace-nowrap" onClick={handleSearch}>
        Search
    </button>
    <button
        className="border-2 border-primary text-primary bg-white p-3 rounded-xl flex-1 whitespace-nowrap text-sm"
        onClick={() => setShowMoreFilters(!showMoreFilters)}
    >
        More Filters
    </button>
</div>


                    {/* More Filters Section */}
                    {showMoreFilters && (
                        <div className="more-filters open flex flex-col gap-4 mt-4">
                            {/* Breed input field */}
                            <div>
                                <label className="text-xs">Breed</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-xl"
                                    value={breed}
                                    onChange={(e) => setBreed(e.target.value)}
                                    placeholder="Enter Breed"
                                />
                            </div>

                            {/* Cities dropdown */}
                            <div>
                                <label className="text-xs">City</label>
                                <select
                                    className="w-full p-3 border rounded-xl"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                >
                                    <option value="">Select City</option>
                                    {cities.map((city) => (
                                        <option key={city.city_id} value={city.city_id}>
                                            {city.city_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 mt-4">
                                <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl" onClick={handleReset}>
                                    Reset
                                </button>
                                <button className="text-white p-3 rounded-2xl w-40 bg-primary" onClick={handleSearch}>
                                    Search
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterSection;
