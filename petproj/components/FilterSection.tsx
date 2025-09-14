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
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        setIsModalOpen(false); // Close modal after search
    };

    return (
        <div className="filter-section bg-gray-100 sm:pt-6">
            <div className="bg-white hidden md:block mx-0 md:mx-8 px-6 pt-3 pb-5 w-700 rounded-2xl">
                {/* PC Layout */}
                <div className=" md:flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Species</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={selectedSpecies}
                            onChange={(e) =>
                                setSelectedSpecies(e.target.value)
                            }>
                            <option value="">Select Species</option>
                            {categories.map((category) => (
                                <option
                                    key={category.category_id}
                                    value={category.category_id}>
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

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

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">City</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}>
                            <option value="">Select City</option>
                            {cities.map((city) => (
                                <option key={city.city_id} value={city.city_id}>
                                    {city.city_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4 mt-5">
                        <button
                            className="border-2 border-primary text-primary bg-white px-3 py-1 rounded-2xl"
                            onClick={handleReset}>
                            Reset
                        </button>
                        <button
                            className="text-white p-3 rounded-2xl w-40 bg-primary"
                            onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </div>

                
            </div>

            {/* More Filters Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-11/12 max-w-md relative">
                        {/* Cross button at the top-right */}
                        <button
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl"
                            onClick={() => setIsModalOpen(false)}>
                            &times;
                        </button>

                        <h2 className="text-lg font-semibold mb-4">
                            Filters
                        </h2>

                        <div className="mb-4">
                            <label className="text-xs">Species</label>
                            <select
                                className="w-full p-3 border rounded-xl species-filter"
                                value={selectedSpecies}
                                onChange={(e) =>
                                    setSelectedSpecies(e.target.value)
                                }>
                                <option value="">Select Species</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.category_id}
                                        value={category.category_id}>
                                        {category.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs">Breed</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl"
                                value={breed}
                                onChange={(e) => setBreed(e.target.value)}
                                placeholder="Enter Breed"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="text-xs">City</label>
                            <select
                                className="w-full p-3 border rounded-xl"
                                value={selectedCity}
                                onChange={(e) =>
                                    setSelectedCity(e.target.value)
                                }>
                                <option value="">Select City</option>
                                {cities.map((city) => (
                                    <option
                                        key={city.city_id}
                                        value={city.city_id}>
                                        {city.city_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <button
                                className="border-2 border-primary text-primary bg-white p-3 rounded-2xl flex-1"
                                onClick={handleReset}>
                                Reset
                            </button>
                            <button
                                className="text-white p-3 rounded-2xl flex-1 bg-primary"
                                onClick={handleSearch}>
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Filter Button for Mobile */}
            <div className="fixed bottom-4 left-4 md:hidden z-40">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white text-primary p-2 rounded-xl shadow-lg border-2 border-transparent border-primary hover:scale-105 transition-all duration-300 flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        fill="currentColor"
                        className="h-4 w-4"
                        viewBox="0 0 16 16">
                        <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6A.5.5 0 0 1 3 8zm0-2.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z" />
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z" />
                    </svg>
                    <span className="text-xs ml-1">Filters</span>
                </button>
            </div>
        </div>
    );
};

export default FilterSection;
