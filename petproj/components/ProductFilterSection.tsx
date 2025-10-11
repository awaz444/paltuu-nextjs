"use client";
import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface Category {
    category_id: number;
    name: string;
    slug: string;
    description?: string;
}

interface ProductFilterSectionProps {
    filters: {
        keyword: string;
        sortBy: string;
        categorySlug?: string;
        petType?: string;
    };
    onSearch: (filters: any) => void;
    onReset: () => void;
}

const ProductFilterSection: React.FC<ProductFilterSectionProps> = ({
    filters, onSearch, onReset
}) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Pet type options
    const petTypes = [
        { value: "", label: "All Pets" },
        { value: "cat", label: "Cat" },
        { value: "dog", label: "Dog" },
        { value: "bird", label: "Bird" },
        { value: "fish", label: "Fish" },
        { value: "other", label: "Other" }
    ];

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const response = await fetch('/api/bazaar/categories');
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data || []);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
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
            keyword: "",
            sortBy: "",
            categorySlug: "",
            petType: "",
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

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-xs font-medium text-gray-700" htmlFor="category-select">
                            Category
                        </label>
                        <select
                            id="category-select"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                            value={localFilters.categorySlug || ""}
                            onChange={(e) => handleFilterChange("categorySlug", e.target.value)}
                            disabled={loadingCategories}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.category_id} value={category.slug}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium text-gray-700" htmlFor="pet-type-select">
                            Pet Type
                        </label>
                        <select
                            id="pet-type-select"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                            value={localFilters.petType || ""}
                            onChange={(e) => handleFilterChange("petType", e.target.value)}
                        >
                            {petTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
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
                                    <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="modal-category-select">
                                        Category
                                    </label>
                                    <select
                                        id="modal-category-select"
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                        value={localFilters.categorySlug || ""}
                                        onChange={(e) => handleFilterChange("categorySlug", e.target.value)}
                                        disabled={loadingCategories}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.category_id} value={category.slug}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="modal-pet-type-select">
                                        Pet Type
                                    </label>
                                    <select
                                        id="modal-pet-type-select"
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                        value={localFilters.petType || ""}
                                        onChange={(e) => handleFilterChange("petType", e.target.value)}
                                    >
                                        {petTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
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

export default ProductFilterSection;
