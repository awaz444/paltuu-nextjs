"use client";
import { useState, useEffect } from "react";
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

interface Category {
    category_id: number;
    name: string;
    slug?: string;
}

interface Collection {
    collection_id: number;
    name: string;
    slug?: string;
}

const MarketplaceFilterSection: React.FC<MarketplaceFilterSectionProps> = ({
    filters, onSearch, onReset
}) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);

    // Load categories and collections from API
    useEffect(() => {
        const loadFilterData = async () => {
            try {
                const [categoriesRes, collectionsRes] = await Promise.all([
                    fetch('/api/v1/bazaar/categories'),
                    fetch('/api/v1/bazaar/collections')
                ]);

                if (categoriesRes.ok) {
                    const categoriesData = await categoriesRes.json();
                    setCategories(categoriesData);
                }

                if (collectionsRes.ok) {
                    const collectionsData = await collectionsRes.json();
                    setCollections(collectionsData);
                }
            } catch (error) {
                console.error('Failed to load filter data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFilterData();
    }, []);

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
                        <label className="text-xs" htmlFor="category-select">Category</label>
                        <select
                            id="category-select"
                            className="w-full p-3 border rounded-xl"
                            value={localFilters.category}
                            onChange={(e) => handleFilterChange("category", e.target.value)}
                            disabled={loading}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs" htmlFor="collection-select">Collection</label>
                        <select
                            id="collection-select"
                            className="w-full p-3 border rounded-xl"
                            value={localFilters.collection}
                            onChange={(e) => handleFilterChange("collection", e.target.value)}
                            disabled={loading}
                        >
                            <option value="">All Collections</option>
                            {collections.map((collection) => (
                                <option key={collection.collection_id} value={collection.collection_id}>
                                    {collection.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs" htmlFor="keyword-input">Keyword</label>
                        <input
                            id="keyword-input"
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
                            <label className="text-xs" htmlFor="modal-category-select">Category</label>
                            <select
                                id="modal-category-select"
                                className="w-full p-3 border rounded-xl"
                                value={localFilters.category}
                                onChange={(e) => handleFilterChange("category", e.target.value)}
                                disabled={loading}
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.category_id} value={category.category_id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs" htmlFor="modal-collection-select">Collection</label>
                            <select
                                id="modal-collection-select"
                                className="w-full p-3 border rounded-xl"
                                value={localFilters.collection}
                                onChange={(e) => handleFilterChange("collection", e.target.value)}
                                disabled={loading}
                            >
                                <option value="">All Collections</option>
                                {collections.map((collection) => (
                                    <option key={collection.collection_id} value={collection.collection_id}>
                                        {collection.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs" htmlFor="modal-keyword-input">Keyword</label>
                            <input
                                id="modal-keyword-input"
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