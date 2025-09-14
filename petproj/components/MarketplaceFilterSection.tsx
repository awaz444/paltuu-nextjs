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
        <div className="filter-section bg-gray-100 pt-6">
            <div className="bg-white mx-0 md:mx-8 px-6 pt-3 pb-5 w-700 rounded-2xl">
                {/* PC Layout */}
                <div className="hidden md:flex flex-wrap gap-4 items-center">
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

                {/* Mobile Layout */}
                <div className="md:hidden flex flex-col gap-4">
                    <div>
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

                    <div className="flex gap-4 w-full">
                        <button className="text-white bg-primary text-sm p-3 rounded-2xl flex-1" onClick={handleSearch}>
                            Search
                        </button>
                        <button
                            className="border-2 border-primary text-sm text-primary bg-white p-3 rounded-2xl flex-1 whitespace-nowrap"
                            onClick={() => setIsModalOpen(true)}
                        >
                            More Filters
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

                        <h2 className="text-lg font-semibold mb-4">More Filters</h2>

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
        </div>
    );
};

export default MarketplaceFilterSection;