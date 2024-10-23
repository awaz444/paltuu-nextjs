"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store";
import { fetchCities } from "../app/store/slices/citiesSlice";
import { fetchQualifications } from "../app/store/slices/qualificationsSlice";
import { fetchPetCategories } from "../app/store/slices/petCategoriesSlice";

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
    const { qualifications } = useSelector(
        (state: RootState) => state.qualifications
    );
    const { categories } = useSelector((state: RootState) => state.categories);

    const [selectedCity, setSelectedCity] = useState("");
    const [selectedQualification, setSelectedQualification] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    // Fetch cities, qualifications, and pet categories on component mount
    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchQualifications());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    const handleReset = () => {
        setSelectedCity("");
        setSelectedQualification("");
        setSelectedCategory("");
        onSearch({
            selectedCity: "",
            selectedQualification: "",
            selectedCategory: "",
        });
    };

    const handleSearch = () => {
        onSearch({ selectedCity, selectedQualification, selectedCategory });
    };

    return (
<div className="bg-gray-100 pt-6">
    <div
        className="bg-white px-8 py-4 w-700"
        style={{ margin: "0px 32px", borderRadius: "2rem" }}>
        <div className="flex flex-wrap gap-4 mb-4 mt-4 items-center">
            {/* Qualifications Dropdown */}
            <div className="flex-1 min-w-[150px]">
                <label className="text-xs block mb-1">Qualification</label>
                <select
                    className="w-full p-3 border rounded-xl"
                    value={selectedQualification}
                    onChange={(e) => setSelectedQualification(e.target.value)}>
                    <option value="">Select Qualification</option>
                    {qualifications.map((qualification) => (
                        <option key={qualification.qualification_id} value={qualification.qualification_id}>
                            {qualification.qualification_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Cities Dropdown */}
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

            {/* Pet Specialization Dropdown */}
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

            {/* Search and Reset Buttons */}
            <div className="flex gap-4 mt-4">
                <button
                    className="border-2 border-[#A03048] text-[#A03048] bg-white p-3 rounded-2xl"
                    onClick={handleReset}>
                    Reset
                </button>
                <button
                    className="text-white p-3 rounded-2xl w-40"
                    style={{ backgroundColor: "#A03048" }}
                    onClick={handleSearch}>
                    Search
                </button>
            </div>
        </div>
    </div>
</div>


    );
};

export default VetFilterSection;
