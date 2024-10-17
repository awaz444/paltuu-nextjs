'use client';
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store"; // Import store types
import { fetchCities } from "../app/store/slices/citiesSlice"; // Fetch cities from store
import { fetchQualifications } from "../app/store/slices/qualificationsSlice"; // Fetch qualifications from store

interface VetFilterSectionProps {
    onSearch: (filters: {
        selectedCity: string;
        selectedQualification: string;
    }) => void;
}

const VetFilterSection: React.FC<VetFilterSectionProps> = ({ onSearch }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities); // Get cities from the store
    const { qualifications } = useSelector((state: RootState) => state.qualifications); // Get qualifications from the store

    const [selectedCity, setSelectedCity] = useState("");
    const [selectedQualification, setSelectedQualification] = useState("");

    // Fetch cities and qualifications on component mount
    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchQualifications());
    }, [dispatch]);

    const handleReset = () => {
        setSelectedCity("");
        setSelectedQualification("");
        onSearch({ selectedCity: "", selectedQualification: "" });
    };

    const handleSearch = () => {
        onSearch({ selectedCity, selectedQualification });
    };

    return (
        <div className="bg-gray-100 pt-6">
            <div
                className="bg-white px-8 py-2 w-700"
                style={{ margin: "0px 20px", borderRadius: "2rem" }}>
                <div className="flex flex-wrap gap-4 mb-4 mt-4 items-center">
                    {/* Qualifications dropdown */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Qualification</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={selectedQualification}
                            onChange={(e) =>
                                setSelectedQualification(e.target.value)
                            }>
                            <option value="">Select Qualification</option>
                            {qualifications.map((qualification) => (
                                <option
                                    key={qualification.id}
                                    value={qualification.id}>
                                    {qualification.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cities dropdown */}
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

                    {/* Buttons */}
                    <div className="flex gap-4 mt-4">
                        <button
                            className="border-2 border-primary text-primary bg-white p-3 rounded-2xl"
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
