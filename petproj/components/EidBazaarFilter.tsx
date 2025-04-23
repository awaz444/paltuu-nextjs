import React from "react";
import { EnvironmentOutlined } from "@ant-design/icons";

interface EidBazaarFilterProps {
  onSearch: (filters: {
    selectedCity: string;
    location: string;
    selectedSpecies: string;
    minPrice: string;
    maxPrice: string;
  }) => void;
}

const EidBazaarFilter: React.FC<EidBazaarFilterProps> = ({ onSearch }) => {
  const [filters, setFilters] = React.useState({
    selectedCity: "",
    location: "",
    selectedSpecies: "",
    minPrice: "",
    maxPrice: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      selectedCity: "",
      location: "",
      selectedSpecies: "",
      minPrice: "",
      maxPrice: ""
    });
    onSearch({
      selectedCity: "",
      location: "",
      selectedSpecies: "",
      minPrice: "",
      maxPrice: ""
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Species Filter - Full width on mobile, 1/4 on desktop */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="selectedSpecies" className="text-sm font-medium text-gray-600">
              Animal Type
            </label>
            <select
              id="selectedSpecies"
              name="selectedSpecies"
              value={filters.selectedSpecies}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Goat">Goat</option>
              <option value="Sheep">Sheep</option>
              <option value="Cow">Cow</option>
              <option value="Bull">Bull</option>
              <option value="Camel">Camel</option>
            </select>
          </div>

          {/* City Filter */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="selectedCity" className="text-sm font-medium text-gray-600">
              City
            </label>
            <select
              id="selectedCity"
              name="selectedCity"
              value={filters.selectedCity}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Cities</option>
              <option value="Karachi">Karachi</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Peshawar">Peshawar</option>
              <option value="Quetta">Quetta</option>
            </select>
          </div>

          {/* Location Search */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="location" className="text-sm font-medium text-gray-600 flex items-center">
              <EnvironmentOutlined className="mr-1" /> Area
            </label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="Neighborhood or landmark"
              value={filters.location}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Price Range - Now takes full width on mobile */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Price Range (PKR)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                name="minPrice"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons - Now in their own row on mobile */}
          <div className="flex space-x-2 col-span-1 md:col-span-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EidBazaarFilter;