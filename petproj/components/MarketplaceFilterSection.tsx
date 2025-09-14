"use client";
import { useState } from "react";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface MarketplaceFilterSectionProps {
    filters: {
        category: string;
        collection: string;
        keyword: string;
    };
    onSearch: (filters: any) => void;
    onReset: () => void;
}

const MarketplaceFilterSection: React.FC<MarketplaceFilterSectionProps> = ({ 
    filters, onSearch, onReset 
}) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isModalOpen, setIsModalOpen] = useState(false);

    

    const categories = [
        { id: "food", name: "Food" },
        { id: "accessories", name: "Accessories" },
        { id: "toys", name: "Toys" },
        { id: "grooming", name: "Grooming" },
        { id: "health", name: "Health" },
        { id: "beds", name: "Beds & Furniture" },
    ];

    const collections = [
        { id: "dogs", name: "For Dogs" },
        { id: "cats", name: "For Cats" },
        { id: "birds", name: "For Birds" },
        { id: "fish", name: "For Fish" },
        { id: "small", name: "For Small Animals" },
    ];

    const handleFilterChange = (key: string, value: string) => {
        const updatedFilters = { ...localFilters, [key]: value };
        setLocalFilters(updatedFilters);
    };

    const handleSearch = () => {
        onSearch(localFilters);
        setIsModalOpen(false);
    };

    const handleReset = () => {
        const resetFilters = {
            category: "",
            collection: "",
            keyword: "",
        };
        setLocalFilters(resetFilters);
        onReset();
    };

    return (
        <div className="filter-section bg-gray-100 sm:pt-6">
            <div className="bg-white hidden md:block mx-0 md:mx-8 px-6 pt-3 pb-5 w-700 rounded-2xl">
                {/* PC Layout */}
                <div className="md:flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Category</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={localFilters.category}
                            onChange={(e) => handleFilterChange("category", e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Collection</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={localFilters.collection}
                            onChange={(e) => handleFilterChange("collection", e.target.value)}
                        >
                            <option value="">All Collections</option>
                            {collections.map((collection) => (
                                <option key={collection.id} value={collection.id}>
                                    {collection.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs">Keyword</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl"
                            value={localFilters.keyword}
                            onChange={(e) => handleFilterChange("keyword", e.target.value)}
                            placeholder="Search products..."
                        />
                    </div>

                    <div className="flex gap-4 mt-5">
                        <button className="border-2 border-primary text-primary bg-white px-3 py-1 rounded-2xl" onClick={handleReset}>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-11/12 max-w-md relative">
                        <button
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl"
                            onClick={() => setIsModalOpen(false)}
                        >
                            &times;
                        </button>

                        <h2 className="text-lg font-semibold mb-4">Filters</h2>

                        <div className="mb-4">
                            <label className="text-xs">Category</label>
                            <select
                                className="w-full p-3 border rounded-xl"
                                value={localFilters.category}
                                onChange={(e) => handleFilterChange("category", e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs">Collection</label>
                            <select
                                className="w-full p-3 border rounded-xl"
                                value={localFilters.collection}
                                onChange={(e) => handleFilterChange("collection", e.target.value)}
                            >
                                <option value="">All Collections</option>
                                {collections.map((collection) => (
                                    <option key={collection.id} value={collection.id}>
                                        {collection.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs">Keyword</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl"
                                value={localFilters.keyword}
                                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                                placeholder="Search products..."
                            />
                        </div>

                        <div className="flex gap-4">
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

export default MarketplaceFilterSection;