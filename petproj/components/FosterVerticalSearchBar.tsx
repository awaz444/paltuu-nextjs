import React, { useState } from "react";

interface VerticalSearchBarProps {
    onSearch: (filters: {
        selectedSex: string;
        minAge: string;
        maxAge: string;
        area: string;
        minChildAge: string;
        canLiveWithDogs: boolean;
        canLiveWithCats: boolean;
        vaccinated: boolean;
        neutered: boolean;
        selectedCity: string;
        selectedSpecies: string;
        breed: string;
    }) => void;
    onReset: () => void;
    onSearchAction: () => void;
}

const FosterVerticalSearchBar: React.FC<VerticalSearchBarProps> = ({
    onSearch,
    onReset,
    onSearchAction,
}) => {
    const [selectedSex, setSelectedSex] = useState("");
    const [minAge, setMinAge] = useState("");
    const [maxAge, setMaxAge] = useState("");
    const [area, setArea] = useState("");
    const [minChildAge, setMinChildAge] = useState("");
    const [canLiveWithDogs, setCanLiveWithDogs] = useState(false);
    const [canLiveWithCats, setCanLiveWithCats] = useState(false);
    const [vaccinated, setVaccinated] = useState(false);
    const [neutered, setNeutered] = useState(false);
    const [selectedCity, setSelectedCity] = useState(""); // Added state for city
    const [selectedSpecies, setSelectedSpecies] = useState(""); // Added state for species
    const [breed, setBreed] = useState(""); // Added state for breed

    const handleSearch = () => {
        onSearch({
            selectedSex,
            minAge,
            maxAge,
            area,
            minChildAge,
            canLiveWithDogs,
            canLiveWithCats,
            vaccinated,
            neutered,
            selectedCity, // Include selectedCity
            selectedSpecies, // Include selectedSpecies
            breed, // Include breed
        });
        onSearchAction(); // Trigger the search action from the parent component
    };

    return (
        <div className="bg-white shadow-sm p-6 rounded-3xl">

            {/* Sex Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Sex</label>
                <select
                    className="border rounded w-full p-2"
                    value={selectedSex}
                    onChange={(e) => setSelectedSex(e.target.value)}
                >
                    <option value="">Select Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            {/* Age Range Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                    Age Range
                </label>
                <div className="flex space-x-2">
                    <input
                        type="number"
                        placeholder="Min yrs"
                        className="border rounded w-1/2 p-2"
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value)}
                    />
                    <p className="mt-2">to</p>
                    <input
                        type="number"
                        placeholder="Max yrs"
                        className="border rounded w-1/2 p-2"
                        value={maxAge}
                        onChange={(e) => setMaxAge(e.target.value)}
                    />
                </div>
            </div>

            {/* Location Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Area</label>
                <input
                    type="text"
                    placeholder="Enter area"
                    className="border rounded w-full p-2"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                />
            </div>

            {/* Age of Youngest Child Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                    Min Age of Children in Home
                </label>
                <input
                    type="number"
                    placeholder="Min age"
                    className="border rounded w-full p-2"
                    value={minChildAge}
                    onChange={(e) => setMinChildAge(e.target.value)}
                />
            </div>

            {/* Checkboxes for Other Filters */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                    Additional Preferences
                </label>
                <div className="space-y-2">
                    <div>
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={canLiveWithDogs}
                            onChange={() =>
                                setCanLiveWithDogs(!canLiveWithDogs)
                            }
                        />
                        <label>Can live with dogs</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={canLiveWithCats}
                            onChange={() =>
                                setCanLiveWithCats(!canLiveWithCats)
                            }
                        />
                        <label>Can live with cats</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={vaccinated}
                            onChange={() => setVaccinated(!vaccinated)}
                        />
                        <label>Vaccinated</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={neutered}
                            onChange={() => setNeutered(!neutered)}
                        />
                        <label>Neutered</label>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 mt-4">
                <button
                    className="border-2 border-primary text-primary bg-white p-3 rounded-xl"
                    onClick={onReset}>
                    Reset
                </button>
                <button
                    className="text-white p-3 rounded-xl"
                    style={{ backgroundColor: "#A03048" }}
                    onClick={handleSearch}>
                    Search
                </button>
            </div>
        </div>
    );
};

export default FosterVerticalSearchBar;
