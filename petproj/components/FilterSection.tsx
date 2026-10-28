"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store";
import { fetchCities } from "../app/store/slices/citiesSlice";
import { fetchPetCategories } from "../app/store/slices/petCategoriesSlice";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { MOBILE_BUTTON } from "./community/MobileActions";

interface FilterSectionProps {
    filters?: {
        selectedCity: string;
        selectedSpecies: string;
        breed: string;
    };
    onSearch: (filters: {
        selectedCity: string;
        selectedSpecies: string;
        breed: string;
    }) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ onSearch, filters }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    const [selectedCity, setSelectedCity] = useState(filters?.selectedCity || "");
    const [selectedSpecies, setSelectedSpecies] = useState(filters?.selectedSpecies || "");
    const [breed, setBreed] = useState(filters?.breed || "");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    useEffect(() => {
        if (filters) {
            setSelectedCity(filters.selectedCity || "");
            setSelectedSpecies(filters.selectedSpecies || "");
            setBreed(filters.breed || "");
        }
    }, [filters]);

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
                            {Array.isArray(categories) && categories.map((category) => (
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
                            {Array.isArray(cities) && cities.map((city) => (
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9996]">
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
                                {Array.isArray(categories) && categories.map((category) => (
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
                                {Array.isArray(cities) && cities.map((city) => (
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

            {/* Floating Filter Button for Mobile: same style and spot as Home's Adopt button */}
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={`fixed bottom-4 left-4 z-40 md:hidden ${MOBILE_BUTTON}`}>
                Filters
            </button>
        </div>
    );
};

export default FilterSection;
