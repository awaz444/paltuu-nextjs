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
}

const VetFilterSection: React.FC<VetFilterSectionProps> = ({ onSearch }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { qualifications } = useSelector((state: RootState) => state.qualifications);
    const { categories } = useSelector((state: RootState) => state.categories);

    useSetPrimaryColor();

    const [selectedCity, setSelectedCity] = useState("");
    const [selectedQualification, setSelectedQualification] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchQualifications());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    const handleReset = () => {
        setSelectedCity("");
        setSelectedQualification("");
        setSelectedCategory("");
        onSearch({ selectedCity: "", selectedQualification: "", selectedCategory: "" });
    };

    const handleSearch = () => {
        onSearch({ selectedCity, selectedQualification, selectedCategory });
        setIsModalOpen(false);
    };

    return (
        <div className="bg-gray-100 pt-6">
            <div className="bg-white px-8 py-4 w-700 mx-8 rounded-2xl">
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

                {/* Mobile & Tablet Layout */}
                <div className="md:hidden flex flex-col gap-4">
                    {/* Species filter (outside modal) */}
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

                    {/* Search & More Filters buttons */}
                    <div className="flex gap-4 w-full">
                        <button className="text-white p-3 rounded-2xl flex-1 bg-primary" onClick={handleSearch}>
                            Search
                        </button>

                        {/* More Filters Button */}
                        <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl flex-1 whitespace-nowrap" onClick={() => setIsModalOpen(true)}>
                            More Filters
                        </button>
                    </div>

                    {/* More Filters Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
                            <div className="bg-white p-6 rounded-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">More Filters</h2>
                                    <button className="text-xl" onClick={() => setIsModalOpen(false)}>✕</button>
                                </div>

                                {/* Qualification inside modal */}
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

                                {/* City inside modal */}
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

                                {/* Reset & Apply Buttons */}
                                <div className="flex flex-col gap-4">
                                    <button className="border-2 border-primary text-primary bg-white p-3 rounded-2xl w-full" onClick={handleReset}>
                                        Reset
                                    </button>
                                    <button className="text-white p-3 rounded-2xl w-full bg-primary" onClick={handleSearch}>
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VetFilterSection;
