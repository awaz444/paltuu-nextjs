"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store";
import { fetchCities } from "../app/store/slices/citiesSlice";
import { fetchPetCategories } from "../app/store/slices/petCategoriesSlice";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface LostAndFoundFilterProps {
    onSearch: (filters: { selectedCity: string; location: string; selectedSpecies: string }) => void;
}

const LostAndFoundFilter: React.FC<LostAndFoundFilterProps> = ({ onSearch }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    const [selectedCity, setSelectedCity] = useState("");
    const [location, setLocation] = useState("");
    const [selectedSpecies, setSelectedSpecies] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // Controls modal visibility

    useSetPrimaryColor();

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    const handleReset = () => {
        setSelectedCity("");
        setLocation("");
        setSelectedSpecies("");
        onSearch({ selectedCity: "", location: "", selectedSpecies: "" });
    };

    const handleSearch = () => {
        onSearch({ selectedCity, location, selectedSpecies });
    };

    return (
        <div className="bg-gray-100 pt-6">
            <div className="bg-white px-8 py-2 w-700 mx-8 rounded-2xl">
                {/* PC Layout (Full Filters Visible) */}
                <div className="hidden md:flex flex-wrap gap-4 mb-4 mt-4 items-center">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Species</label>
                        <select className="w-full p-3 border rounded-xl" value={selectedSpecies} onChange={(e) => setSelectedSpecies(e.target.value)}>
                            <option value="">Select Species</option>
                            {categories.map((category) => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">City</label>
                        <select className="w-full p-3 border rounded-xl" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
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

                {/* Mobile Layout - Show "Species" filter + Search & More Filters buttons */}
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

                    <div className="flex gap-4 w-full">
                        <button className="text-white p-3 rounded-2xl flex-1 bg-primary" onClick={handleSearch}>
                            Search
                        </button>
                        <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl flex-1 whitespace-nowrap" onClick={() => setIsModalOpen(true)}>
                            More Filters
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-2xl w-11/12 max-w-md relative">
            {/* Close Button */}
            <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-3 text-2xl font-bold text-gray-700"
            >
                &times;
            </button>

            {/* Modal Content */}
            <h2 className="text-lg font-bold">More Filters</h2>

            <div className="mt-4 flex flex-col gap-4">
                {/* Species Filter */}
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

                {/* City Filter */}
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

                {/* Location Filter */}
                <div>
                    <label className="text-xs">Location</label>
                    <input
                        type="text"
                        className="w-full p-3 border rounded-xl"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter Location"
                    />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-4">
                <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl flex-1" onClick={handleReset}>
                    Reset
                </button>
                <button className="text-white p-3 rounded-2xl flex-1 bg-primary" onClick={handleSearch}>
                    Search
                </button>
            </div>
        </div>
    </div>
)}

        </div>
    );
};

export default LostAndFoundFilter;
