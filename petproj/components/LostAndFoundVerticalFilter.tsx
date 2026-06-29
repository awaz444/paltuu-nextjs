"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../app/store/store";
import { fetchCities } from "../app/store/slices/citiesSlice";
import { fetchPetCategories } from "../app/store/slices/petCategoriesSlice";

interface LostAndFoundVerticalFilterProps {
    filters: {
        selectedCity: string;
        location: string;
        selectedSpecies: string;
    };
    onChange: (filters: { selectedCity: string; location: string; selectedSpecies: string }) => void;
    onReset: () => void;
}

const LostAndFoundVerticalFilter: React.FC<LostAndFoundVerticalFilterProps> = ({
    filters,
    onChange,
    onReset,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    const [selectedCity, setSelectedCity] = useState(filters.selectedCity);
    const [location, setLocation] = useState(filters.location);
    const [selectedSpecies, setSelectedSpecies] = useState(filters.selectedSpecies);

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    useEffect(() => {
        setSelectedCity(filters.selectedCity);
        setLocation(filters.location);
        setSelectedSpecies(filters.selectedSpecies);
    }, [filters]);

    const update = (patch: Partial<typeof filters>) => {
        onChange({ selectedCity, location, selectedSpecies, ...patch });
    };

    const handleReset = () => {
        setSelectedCity("");
        setLocation("");
        setSelectedSpecies("");
        onReset();
    };

    return (
        <div className="bg-white shadow-sm p-6 rounded-3xl sticky top-4">
            {/* Species Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Species</label>
                <select
                    className="border rounded-xl w-full p-3"
                    value={selectedSpecies}
                    onChange={(e) => {
                        setSelectedSpecies(e.target.value);
                        update({ selectedSpecies: e.target.value });
                    }}
                >
                    <option value="">All Species</option>
                    {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* City Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">City</label>
                <select
                    className="border rounded-xl w-full p-3"
                    value={selectedCity}
                    onChange={(e) => {
                        setSelectedCity(e.target.value);
                        update({ selectedCity: e.target.value });
                    }}
                >
                    <option value="">All Cities</option>
                    {cities.map((city) => (
                        <option key={city.city_id} value={city.city_id}>
                            {city.city_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Location Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                    type="text"
                    className="border rounded-xl w-full p-3"
                    value={location}
                    placeholder="Enter area or neighbourhood"
                    onChange={(e) => {
                        setLocation(e.target.value);
                        update({ location: e.target.value });
                    }}
                />
            </div>

            {/* Reset */}
            <div className="flex flex-col gap-3 mt-4">
                <button
                    className="border-2 border-primary text-primary bg-white p-3 rounded-xl"
                    onClick={handleReset}
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default LostAndFoundVerticalFilter;
