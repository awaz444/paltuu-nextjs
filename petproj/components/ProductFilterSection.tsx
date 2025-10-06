"use client";
import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface ProductFilterSectionProps {
    filters: {
        keyword: string;
        minPrice: string;
        maxPrice: string;
        sortBy: string;
        categorySlug?: string;
    };
    onSearch: (filters: any) => void;
    onReset: () => void;
}

const ProductFilterSection: React.FC<ProductFilterSectionProps> = ({
    filters, onSearch, onReset
}) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

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
            keyword: "",
            minPrice: "",
            maxPrice: "",
            sortBy: "",
            categorySlug: localFilters.categorySlug || "", // Preserve category filter
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
                        <label className="text-xs font-medium text-gray-700" htmlFor="keyword-input">
                            Search
                        </label>
                        <input
                            id="keyword-input"
                            type="text"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                            value={localFilters.keyword}
                            onChange={(e) => handleFilterChange("keyword", e.target.value)}
                            placeholder="Search products..."
                        />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium text-gray-700" htmlFor="min-price">
                            Min Price
                        </label>
                        <input
                            id="min-price"
                            type="number"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                            value={localFilters.minPrice}
                            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                            placeholder="₨ 0"
                            min="0"
                        />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium text-gray-700" htmlFor="max-price">
                            Max Price
                        </label>
                        <input
                            id="max-price"
                            type="number"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                            value={localFilters.maxPrice}
                            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                            placeholder="₨ 10000"
                            min="0"
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs font-medium text-gray-700" htmlFor="sort-select">
                            Sort By
                        </label>
                        <select
                            id="sort-select"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                            value={localFilters.sortBy}
                            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                        >
                            <option value="">Default</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="new">Newest First</option>
                            <option value="trending">Trending</option>
                            <option value="discount">Most Discounted</option>
                        </select>
                    </div>

                    <div className="flex gap-4 mt-5">
                        <button
                            className="border-2 border-primary text-primary bg-white px-4 py-2 rounded-2xl hover:bg-primary/5 transition-colors"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                        <button
                            className="text-white px-6 py-2 rounded-2xl bg-primary hover:bg-primary/90 transition-colors"
                            onClick={handleSearch}
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50 md:hidden">
                    <div className="bg-white p-6 rounded-t-3xl w-full max-h-[90vh] overflow-y-auto relative animate-slide-up">
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close filters"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <SlidersHorizontal size={20} />
                            Filters
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="modal-keyword-input">
                                    Search
                                </label>
                                <input
                                    id="modal-keyword-input"
                                    type="text"
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                    value={localFilters.keyword}
                                    onChange={(e) => handleFilterChange("keyword", e.target.value)}
                                    placeholder="Search products..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="modal-min-price">
                                        Min Price
                                    </label>
                                    <input
                                        id="modal-min-price"
                                        type="number"
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                        value={localFilters.minPrice}
                                        onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                                        placeholder="₨ 0"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="modal-max-price">
                                        Max Price
                                    </label>
                                    <input
                                        id="modal-max-price"
                                        type="number"
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                        value={localFilters.maxPrice}
                                        onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                                        placeholder="₨ 10000"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="modal-sort-select">
                                    Sort By
                                </label>
                                <select
                                    id="modal-sort-select"
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                    value={localFilters.sortBy}
                                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                                >
                                    <option value="">Default</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="new">Newest First</option>
                                    <option value="trending">Trending</option>
                                    <option value="discount">Most Discounted</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-4 border-t">
                            <button
                                className="flex-1 border-2 border-primary text-primary bg-white p-3 rounded-xl font-medium"
                                onClick={handleReset}
                            >
                                Reset
                            </button>
                            <button
                                className="flex-1 text-white p-3 rounded-xl bg-primary font-medium"
                                onClick={handleSearch}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Filter Button for Mobile */}
            <div className="fixed bottom-4 right-4 md:hidden z-40">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-white p-4 rounded-full shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    aria-label="Open filters"
                >
                    <SlidersHorizontal size={24} />
                </button>
            </div>
        </div>
    );
};

export default ProductFilterSection;
