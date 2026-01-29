import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import React, { useState } from "react";

interface VerticalSearchBarProps {
    filters: {
        selectedSex: string;
        minAge: string;
        maxAge: string;
        minPrice: string;
        maxPrice: string;
        area: string;
        minChildAge: string;
        canLiveWithDogs: boolean;
        canLiveWithCats: boolean;
        vaccinated: boolean;
        neutered: boolean;
        selectedCity: string;
        selectedSpecies: string;
        breed: string;
    };
    onSearch: (filters: any) => void;
    onReset: () => void;
    onSearchAction: () => void;
}

const VerticalSearchBar: React.FC<VerticalSearchBarProps> = ({
    filters,
    onSearch,
    onReset,
    onSearchAction,
}) => {

    const [selectedSex, setSelectedSex] = useState(filters.selectedSex);
    const [minAge, setMinAge] = useState(filters.minAge);
    const [maxAge, setMaxAge] = useState(filters.maxAge);
    const [vaccinated, setVaccinated] = useState(filters.vaccinated);
    const [neutered, setNeutered] = useState(filters.neutered);

    // Sync state if props change (e.g. reset from parent)
    React.useEffect(() => {
        setSelectedSex(filters.selectedSex);
        setMinAge(filters.minAge);
        setMaxAge(filters.maxAge);
        setVaccinated(filters.vaccinated);
        setNeutered(filters.neutered);
    }, [filters]);

    // Helper to merge current local state with updates and notify parent
    const updateFilters = (update: Partial<typeof filters>) => {
        const newFilters = {
            selectedSex,
            minAge,
            maxAge,
            vaccinated,
            neutered,
            ...update
        };
        onSearch(newFilters);
    };

    const handleSexChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedSex(val);
        updateFilters({ selectedSex: val });
    };

    const handleMinAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(0, Math.min(30, Number(e.target.value))).toString();
        // If empty string, keep it empty
        const finalVal = e.target.value === "" ? "" : val;

        setMinAge(finalVal);
        // Ensure maxAge is consistent if needed, but user just said direct apply
        // Let's defer complex consistency logic or handle it simply:
        if (maxAge && finalVal !== "" && Number(maxAge) < Number(finalVal)) {
            setMaxAge(finalVal);
            updateFilters({ minAge: finalVal, maxAge: finalVal });
        } else {
            updateFilters({ minAge: finalVal });
        }
    };

    const handleMaxAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(0, Math.min(30, Number(e.target.value))).toString();
        const finalVal = e.target.value === "" ? "" : val;
        setMaxAge(finalVal);
        updateFilters({ maxAge: finalVal });
    };

    const handleVaccinatedChange = () => {
        const newVal = !vaccinated;
        setVaccinated(newVal);
        updateFilters({ vaccinated: newVal });
    };

    const handleNeuteredChange = () => {
        const newVal = !neutered;
        setNeutered(newVal);
        updateFilters({ neutered: newVal });
    };

    const handleReset = () => {
        setSelectedSex("");
        setMinAge("");
        setMaxAge("");
        setVaccinated(false);
        setNeutered(false);
        onReset();
    };

    return (
        <div className="bg-white shadow-sm p-6 rounded-3xl sticky top-4">

            {/* Sex Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Sex</label>
                <select
                    className="border rounded-xl w-full p-3"
                    value={selectedSex}
                    onChange={handleSexChange}
                >
                    <option value="">Select Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            {/* Age Range Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Age Range</label>
                <div className="flex space-x-2">
                    <input
                        type="number"
                        placeholder="Min"
                        className="border rounded-xl w-1/2 p-2"
                        value={minAge}
                        onChange={handleMinAgeChange}
                    />
                    <p className="mt-2">to</p>
                    <input
                        type="number"
                        placeholder="Max"
                        className="border rounded-xl w-1/2 p-2"
                        value={maxAge}
                        onChange={handleMaxAgeChange}
                    />
                </div>
            </div>

            {/* Checkboxes for Other Filters */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Additional Preferences</label>
                <div className="space-y-2">
                    <div>
                        <label style={{ cursor: 'pointer' }}>
                            <input
                                type="checkbox" style={{ cursor: 'pointer' }}
                                className="mr-2"
                                checked={vaccinated}
                                onChange={handleVaccinatedChange}
                            />
                            Vaccinated
                        </label>
                    </div>
                    <div>
                        <label style={{ cursor: 'pointer' }}>
                            <input
                                type="checkbox" style={{ cursor: 'pointer' }}
                                className="mr-2"
                                checked={neutered}
                                onChange={handleNeuteredChange}
                            />
                            Neutered
                        </label>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 mt-4">
                <button
                    className="border-2 border-primary text-primary bg-white p-3 rounded-xl"
                    onClick={handleReset}>
                    Reset
                </button>
            </div>
        </div>
    );
};

export default VerticalSearchBar;
