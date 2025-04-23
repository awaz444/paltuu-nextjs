"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store";
import { fetchCities } from "../app/store/slices/citiesSlice";
import { fetchPetCategories } from "../app/store/slices/petCategoriesSlice";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface RescueFilterProps {
    onSearch: (filters: {
        urgency: string;
        petType: string;
        location: string;
        status: string;
    }) => void;
    onReset: () => void;
}

const RescueFilter: React.FC<RescueFilterProps> = ({ onSearch, onReset }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    const [urgency, setUrgency] = useState("");
    const [petType, setPetType] = useState("");
    const [location, setLocation] = useState("");
    const [status, setStatus] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useSetPrimaryColor();

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    const handleReset = () => {
        setUrgency("");
        setPetType("");
        setLocation("");
        setStatus("");
        onReset();
    };

    const handleSearch = () => {
        onSearch({
            urgency,
            petType,
            location,
            status
        });
    };

    return (
        <div className="bg-gray-100 pt-6">
            <div className="bg-white mx-0 md:mx-8 px-5 py-5 w-700 rounded-2xl">
                {/* Desktop Layout */}
                <div className="hidden md:flex flex-wrap gap-4 mb-4 mt-4 items-center">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Pet Type</label>
                        <select 
                            className="w-full p-3 border rounded-xl" 
                            value={petType} 
                            onChange={(e) => setPetType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {categories.map((category) => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Urgency</label>
                        <select 
                            className="w-full p-3 border rounded-xl" 
                            value={urgency} 
                            onChange={(e) => setUrgency(e.target.value)}
                        >
                            <option value="">All Urgency Levels</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="moderate">Moderate</option>
                            <option value="stable">Stable</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Shelter Location</label>
                        <select 
                            className="w-full p-3 border rounded-xl" 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)}
                        >
                            <option value="">All Locations</option>
                            {cities.map((city) => (
                                <option key={city.city_id} value={city.city_name}>
                                    {city.city_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Status</label>
                        <select 
                            className="w-full p-3 border rounded-xl" 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="at shelter">At Shelter</option>
                            <option value="fostered">In Foster Care</option>
                            <option value="medical care">In Medical Care</option>
                            <option value="adopted">Adopted</option>
                        </select>
                    </div>

                    <div className="flex gap-4 mt-4">
                        <button 
                            className="border-2 border-primary text-primary bg-white p-3 rounded-2xl" 
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                        <button 
                            className="text-white p-3 rounded-2xl w-40 bg-primary" 
                            onClick={handleSearch}
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden flex flex-col gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Urgency</label>
                        <select 
                            className="w-full p-3 border rounded-xl" 
                            value={urgency} 
                            onChange={(e) => setUrgency(e.target.value)}
                        >
                            <option value="">All Urgency Levels</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="moderate">Moderate</option>
                            <option value="stable">Stable</option>
                        </select>
                    </div>

                    <div className="flex gap-4 w-full">
                        <button 
                            className="text-white p-3 rounded-2xl flex-1 bg-primary" 
                            onClick={handleSearch}
                        >
                            Search
                        </button>
                        <button 
                            className="border-2 border-primary text-primary bg-white p-3 rounded-2xl flex-1 whitespace-nowrap" 
                            onClick={() => setIsModalOpen(true)}
                        >
                            More Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-11/12 max-w-md relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-3 right-3 text-2xl font-bold text-gray-700"
                        >
                            &times;
                        </button>

                        <h2 className="text-lg font-bold">More Filters</h2>

                        <div className="mt-4 flex flex-col gap-4">
                            <div>
                                <label className="text-xs">Pet Type</label>
                                <select 
                                    className="w-full p-3 border rounded-xl" 
                                    value={petType} 
                                    onChange={(e) => setPetType(e.target.value)}
                                >
                                    <option value="">All Types</option>
                                    {categories.map((category) => (
                                        <option key={category.category_id} value={category.category_id}>
                                            {category.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs">Shelter Location</label>
                                <select 
                                    className="w-full p-3 border rounded-xl" 
                                    value={location} 
                                    onChange={(e) => setLocation(e.target.value)}
                                >
                                    <option value="">All Locations</option>
                                    {cities.map((city) => (
                                        <option key={city.city_id} value={city.city_name}>
                                            {city.city_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs">Status</label>
                                <select 
                                    className="w-full p-3 border rounded-xl" 
                                    value={status} 
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="at shelter">At Shelter</option>
                                    <option value="fostered">In Foster Care</option>
                                    <option value="medical care">In Medical Care</option>
                                    <option value="adopted">Adopted</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                            <button 
                                className="border-2 border-primary text-primary bg-white p-3 rounded-2xl flex-1" 
                                onClick={handleReset}
                            >
                                Reset
                            </button>
                            <button 
                                className="text-white p-3 rounded-2xl flex-1 bg-primary" 
                                onClick={() => {
                                    handleSearch();
                                    setIsModalOpen(false);
                                }}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RescueFilter;