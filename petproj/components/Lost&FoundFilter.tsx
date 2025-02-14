"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store"; // Import store types
import { fetchCities } from "../app/store/slices/citiesSlice"; // Fetch cities from store
import { fetchPetCategories } from "../app/store/slices/petCategoriesSlice"; // Fetch pet categories from store
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface LostAndFoundFilterProps {
    onSearch: (filters: {
        selectedCity: string;
        location: string;
        selectedSpecies: string; // New pet category filter
    }) => void;
}

const LostAndFoundFilter: React.FC<LostAndFoundFilterProps> = ({ onSearch }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities); // Get cities from the store
    const { categories } = useSelector((state: RootState) => state.categories); // Get pet categories (species) from the store

    const [selectedCity, setSelectedCity] = useState("");
    const [location, setLocation] = useState("");
    const [selectedSpecies, setSelectedSpecies] = useState(""); // New state for pet category

    useSetPrimaryColor();

    // Fetch cities and pet categories on component mount
    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchPetCategories()); // Fetch pet categories from the store
    }, [dispatch]);

    const handleReset = () => {
        setSelectedCity("");
        setLocation("");
        setSelectedSpecies(""); // Reset pet category
        onSearch({ selectedCity: "", location: "", selectedSpecies: "" });
    };

    const handleSearch = () => {
        onSearch({ selectedCity, location, selectedSpecies });
    };

    return (
        <div className="bg-gray-100 pt-6">
            <div
                className="bg-white px-8 py-2 w-700"
                style={{ margin: "0px 32px", borderRadius: "2rem" }}>


                {/* PC Layout */}
                <div className="hidden md:flex flex-wrap gap-4 mb-4 mt-4 items-center">
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

                    {/* Location input field */}
                    

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

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Location</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter Location"
                        />
                    </div>

                    <div className="flex gap-4 mt-4">
                        <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl" onClick={handleReset}>
                            Reset
                        </button>
                        <button className="text-white p-3 rounded-2xl w-40 bg-primary" onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </div>

                {/* Tablet & Mobile Layout */}
                <div className="md:hidden flex flex-col gap-4">
                    <div>
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

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Location</label> 
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter Location"
                        />
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                        <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl w-full" onClick={handleReset}>
                            Reset
                        </button>
                        <button className="text-white p-3 rounded-2xl w-full bg-primary" onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </div>



            </div>
        </div>
    );
};

export default LostAndFoundFilter;
