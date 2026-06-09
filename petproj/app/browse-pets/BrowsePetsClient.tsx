"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "../store/store";
import { fetchAdoptionPets, clearAdoptionPets, setAdoptionPets } from "../store/slices/adoptionPetsSlice";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import VerticalSearchBar from "../../components/VerticalSearchBar";
import FilterSection from "../../components/FilterSection";
import PetGrid from "../../components/petGrid";
import { MoonLoader } from "react-spinners";
import "./styles.css";

interface Pet {
    pet_id: number;
    owner_id: number;
    pet_name: string;
    pet_type: number;
    pet_breed: string | null;
    city_id: number;
    area: string;
    age_months: number;
    contact_number: string | null;
    description: string;
    adoption_status: string;
    price: string;
    min_age_of_children: number;
    can_live_with_dogs: boolean;
    can_live_with_cats: boolean;
    must_have_someone_home: boolean;
    energy_level: number;
    cuddliness_level: number;
    health_issues: string;
    created_at: string;
    sex: string | null;
    listing_type: string;
    vaccinated: boolean | null;
    neutered: boolean | null;
    city: string;
    profile_image_url: string | null;
    image_id: number | null;
    image_url: string | null;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface BrowsePetsClientProps {
    initialPets?: Pet[];
    initialMeta?: Meta;
}

function BrowsePetsContent({ initialPets = [], initialMeta }: BrowsePetsClientProps) {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isFirstRender = useRef(true);
    const { pets, loading, error, meta } = useSelector((state: RootState) => state.adoptionPets);

    // Initialize state from URL params
    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const [page, setPage] = useState(initialPage);

    const [filters, setFilters] = useState({
        selectedSex: searchParams.get("sex") || "",
        minAge: searchParams.get("minAge") || "",
        maxAge: searchParams.get("maxAge") || "",
        minPrice: searchParams.get("minPrice") || "",
        maxPrice: searchParams.get("maxPrice") || "",
        area: searchParams.get("area") || "",
        minChildAge: searchParams.get("minChildAge") || "",
        canLiveWithDogs: searchParams.get("dogs") === "true",
        canLiveWithCats: searchParams.get("cats") === "true",
        vaccinated: searchParams.get("vaccinated") === "true",
        neutered: searchParams.get("neutered") === "true",
        selectedCity: searchParams.get("city") || "",
        selectedSpecies: searchParams.get("species") || "",
        breed: searchParams.get("breed") || "",
    });

    const [primaryColor, setPrimaryColor] = useState("#A00000");

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) setPrimaryColor(color);
    }, []);

    useEffect(() => {
        // On first render: hydrate Redux from SSR data and skip the API call.
        // This keeps the content Google already saw in the HTML visible without a flash.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            const hasURLFilters = Object.values(filters).some(v => v !== "" && v !== false);
            if (initialPets.length > 0 && !hasURLFilters && page === 1) {
                dispatch(setAdoptionPets({ pets: initialPets, meta: initialMeta }));
                return;
            }
        }

        // Prepare filters for API
        const apiFilters: any = {
            ...(filters.selectedSex && { sex: filters.selectedSex }),
            ...(filters.minAge && { minAge: filters.minAge }),
            ...(filters.maxAge && { maxAge: filters.maxAge }),
            ...(filters.minPrice && { minPrice: filters.minPrice }),
            ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
            ...(filters.area && { area: filters.area }),
            ...(filters.minChildAge && { minChildAge: filters.minChildAge }),
            ...(filters.canLiveWithDogs && { dogs: "true" }),
            ...(filters.canLiveWithCats && { cats: "true" }),
            ...(filters.vaccinated && { vaccinated: "true" }),
            ...(filters.neutered && { neutered: "true" }),
            ...(filters.selectedCity && { city: filters.selectedCity }),
            ...(filters.selectedSpecies && { species: filters.selectedSpecies }),
            ...(filters.breed && { breed: filters.breed }),
        };

        dispatch(clearAdoptionPets());
        dispatch(fetchAdoptionPets({ page, limit: 11, filters: apiFilters }));

        const params = new URLSearchParams();
        if (page > 1) params.set("page", page.toString());
        if (filters.selectedSex) params.set("sex", filters.selectedSex);
        if (filters.minAge) params.set("minAge", filters.minAge);
        if (filters.maxAge) params.set("maxAge", filters.maxAge);
        if (filters.minPrice) params.set("minPrice", filters.minPrice);
        if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
        if (filters.area) params.set("area", filters.area);
        if (filters.minChildAge) params.set("minChildAge", filters.minChildAge);
        if (filters.canLiveWithDogs) params.set("dogs", "true");
        if (filters.canLiveWithCats) params.set("cats", "true");
        if (filters.vaccinated) params.set("vaccinated", "true");
        if (filters.neutered) params.set("neutered", "true");
        if (filters.selectedCity) params.set("city", filters.selectedCity);
        if (filters.selectedSpecies) params.set("species", filters.selectedSpecies);
        if (filters.breed) params.set("breed", filters.breed);

        const queryString = params.toString();
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });

    }, [page, filters, dispatch, router]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };

    const handleReset = () => {
        setFilters({
            selectedSex: "",
            minAge: "",
            maxAge: "",
            minPrice: "",
            maxPrice: "",
            area: "",
            minChildAge: "",
            canLiveWithDogs: false,
            canLiveWithCats: false,
            vaccinated: false,
            neutered: false,
            selectedCity: "",
            selectedSpecies: "",
            breed: "",
        });
        setPage(1);
    };

    const totalPages = meta ? meta.totalPages : 0;

    return (
        <div className="fullBody" style={{ maxWidth: "90%", margin: "0 auto" }}>
            <FilterSection
                onSearch={handleFilterChange}
            />
            <main className="flex min-h-screen flex-col mx-0 md:mx-8 items-center pt-7 bg-gray-100">
                <div className="flex w-full">
                    <div className="w-1/4 mr-4 vertical-search-bar hidden lg:block">
                        <VerticalSearchBar
                            filters={filters}
                            onSearch={handleFilterChange}
                            onReset={handleReset}
                            onSearchAction={() => {}}
                        />
                    </div>

                    <div className="w-full lg:w-3/4">
                        {loading && pets.length === 0 ? (
                            <div className="flex justify-center items-center py-20">
                                <MoonLoader size={30} color={primaryColor} />
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-500">
                                <p>Error: {error}</p>
                                <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 underline">Try again</button>
                            </div>
                        ) : (
                            <>
                                <PetGrid pets={pets} />

                                {meta && totalPages > 1 && (
                                    <div className="flex justify-center items-center mt-10 mb-6 space-x-2 flex-wrap">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-1 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                                            if (totalPages > 7) {
                                                if (num === 1 || num === totalPages || (num >= page - 1 && num <= page + 1)) {
                                                    // show
                                                } else if (num === page - 2 || num === page + 2) {
                                                    return <span key={num} className="px-2">...</span>;
                                                } else {
                                                    return null;
                                                }
                                            }

                                            return (
                                                <button
                                                    key={num}
                                                    onClick={() => setPage(num)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
                                                        page === num
                                                            ? "bg-primary text-white shadow-md font-bold"
                                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-3 py-1 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function BrowsePetsClient({ initialPets, initialMeta }: BrowsePetsClientProps) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><MoonLoader size={30} color="#A00000" /></div>}>
            <BrowsePetsContent initialPets={initialPets} initialMeta={initialMeta} />
        </Suspense>
    );
}
