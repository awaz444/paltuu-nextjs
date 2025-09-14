"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store";
import { fetchCities } from "../app/store/slices/citiesSlice";
import { fetchQualifications } from "../app/store/slices/qualificationsSlice";
import { fetchPetCategories } from "../app/store/slices/petCategoriesSlice";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface VetFilterSectionProps {
    onSearch: (filters: {
        selectedCity: string;
        selectedQualification: string;
        selectedCategory: string;
    }) => void;
    onReset?: () => void;
    onSearchAction?: () => void;
}

const VetFilterSection: React.FC<VetFilterSectionProps> = ({ onSearch }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { qualifications } = useSelector((state: RootState) => state.qualifications);
    const { categories } = useSelector((state: RootState) => state.categories);

    

    // Set default city to Karachi (assuming city_id for Karachi is "1")
    const [selectedCity, setSelectedCity] = useState("1");
    const [selectedQualification, setSelectedQualification] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchQualifications());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    const handleReset = () => {
        setSelectedCity("1"); // Reset to Karachi
        setSelectedQualification("");
        setSelectedCategory("");
        onSearch({ selectedCity: "1", selectedQualification: "", selectedCategory: "" });
    };

    const handleSearch = () => {
        onSearch({ selectedCity, selectedQualification, selectedCategory });
        setIsModalOpen(false);
    };

    return (
        <div className="bg-gray-100 sm:pt-6">
            <div className="bg-white hidden md:block mx-0 md:mx-8 px-5 py-5 w-700 rounded-2xl">
                {/* Desktop Layout */}
                <div className="hidden md:flex flex-wrap gap-4 mb-4 mt-4 items-center">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs block mb-1">Qualification</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={selectedQualification}
                            onChange={(e) => setSelectedQualification(e.target.value)}>
                            <option value="">Select Qualification</option>
                            {qualifications.map((q) => (
                                <option key={q.qualification_id} value={q.qualification_id}>
                                    {q.qualification_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs block mb-1">City</label>
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

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs block mb-1">Specialization</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}>
                            <option value="">Select Specialization</option>
                            {categories.map((category) => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
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
            </div>

            {/* More Filters Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">More Filters</h2>
                            <button className="text-xl" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs block mb-1">Qualification</label>
                            <select
                                className="w-full p-3 border rounded-xl"
                                value={selectedQualification}
                                onChange={(e) => setSelectedQualification(e.target.value)}>
                                <option value="">Select Qualification</option>
                                {qualifications.map((q) => (
                                    <option key={q.qualification_id} value={q.qualification_id}>
                                        {q.qualification_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs block mb-1">City</label>
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

                        <div className="flex flex-col gap-4">
                            <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl w-full" onClick={handleReset}>
                                Reset
                            </button>
                            <button className="text-white p-3 rounded-2xl w-full bg-primary" onClick={handleSearch}>
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

export default VetFilterSection;