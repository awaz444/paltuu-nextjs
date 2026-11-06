"use client";
import { useEffect, useState, useRef, Suspense, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "../store/store";
import { fetchAdoptionPets, fetchMoreAdoptionPets, clearAdoptionPets, setAdoptionPets, setAdoptionListKey } from "../store/slices/adoptionPetsSlice";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import VerticalSearchBar from "../../components/VerticalSearchBar";
import FilterSection from "../../components/FilterSection";
import PetGrid from "../../components/petGrid";
import SkeletonCard from "../../components/SkeletonCard";
import BackToTop from "../../components/BackToTop";
import { MoonLoader } from "react-spinners";
import "./styles.css";

const PAGE_SIZE = 11;

// Where the visitor was when they opened a pet, so the back button returns them there.
let savedScrollY = 0;
let arrivedByBack = false;
if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
        arrivedByBack = true;
    });
}

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
    /** Server-rendered content shown above the grid. */
    topSlot?: ReactNode;
}

function BrowsePetsContent({ initialPets = [], initialMeta, topSlot }: BrowsePetsClientProps) {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // The filters the list was last loaded for. Also keeps React's double-run of effects in dev from wiping a restored list.
    const loadedFor = useRef<string | null>(null);
    const { pets, loading, error, meta, requestId, loadingMore, loadMoreError, listKey } = useSelector((state: RootState) => state.adoptionPets);
    const sentinel = useRef<HTMLDivElement>(null);

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
    const filterKey = JSON.stringify(apiFilters);

    useEffect(() => {
        if (loadedFor.current === filterKey) return;
        const isFirstLoad = loadedFor.current === null;
        loadedFor.current = filterKey;

        if (isFirstLoad) {
            const cameBack = arrivedByBack;
            arrivedByBack = false;

            // Back from a pet page: keep everything already scrolled through, in place.
            if (cameBack && listKey === filterKey && pets.length > 0) {
                requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
                return;
            }

            // On first render: hydrate Redux from SSR data and skip the API call.
            // This keeps the content Google already saw in the HTML visible without a flash.
            const hasURLFilters = Object.values(filters).some(v => v !== "" && v !== false);
            if (initialPets.length > 0 && !hasURLFilters) {
                dispatch(setAdoptionPets({ pets: initialPets, meta: initialMeta }));
                dispatch(setAdoptionListKey(filterKey));
                return;
            }
        }

        dispatch(setAdoptionListKey(filterKey));
        dispatch(clearAdoptionPets());
        dispatch(fetchAdoptionPets({ page: 1, limit: PAGE_SIZE, filters: apiFilters }));

        const params = new URLSearchParams();
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
        // apiFilters is rebuilt each render; filterKey is its stable form.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey, dispatch, router]);

    const hasMore = Boolean(meta && meta.page < meta.totalPages);

    const loadMore = () => {
        if (!meta || !hasMore || loading || loadingMore) return;
        dispatch(fetchMoreAdoptionPets({ page: meta.page + 1, limit: PAGE_SIZE, filters: apiFilters, listRequestId: requestId }));
    };

    // Starts loading before the end comes into view. Re-observing after each page matters:
    // if a page is short and the sentinel is still on screen, nothing else would fire.
    useEffect(() => {
        const el = sentinel.current;
        if (!el || !hasMore || loadMoreError) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore();
            },
            { rootMargin: "700px 0px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasMore, loadMoreError, loading, loadingMore, pets.length, filterKey]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
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
    };

    return (
        <div className="fullBody" style={{ maxWidth: "90%", margin: "0 auto" }}>
            <FilterSection
                onSearch={handleFilterChange}
            />
            <main className="flex min-h-screen flex-col mx-0 md:mx-8 items-center pt-7 bg-gray-100">
                <h1 className="sr-only">Adopt a Pet in Pakistan — Browse Dogs, Cats &amp; More</h1>
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
                        {topSlot}
                        {loading && pets.length === 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-500">
                                <p>Error: {error}</p>
                                <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 underline">Try again</button>
                            </div>
                        ) : (
                            <>
                                <div
                                    onClickCapture={() => {
                                        savedScrollY = window.scrollY;
                                    }}
                                >
                                    <PetGrid pets={pets} />
                                </div>

                                {loadingMore && (
                                    <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Loading more pets" role="status">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <SkeletonCard key={i} />
                                        ))}
                                    </div>
                                )}
                                {loadMoreError && (
                                    <div className="my-8 text-center text-sm text-gray-600">
                                        <p>Couldn&apos;t load more pets.</p>
                                        <button type="button" onClick={loadMore} className="mt-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 font-semibold text-gray-800 hover:bg-gray-50">
                                            Try again
                                        </button>
                                    </div>
                                )}
                                {hasMore && !loadMoreError && <div ref={sentinel} aria-hidden className="h-px" />}
                                {!hasMore && !loadingMore && (meta?.totalPages ?? 0) > 1 && (
                                    <p className="my-8 text-center text-sm text-gray-500">That&apos;s everyone for now. New pets are added every week.</p>
                                )}
                                <BackToTop />
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function BrowsePetsClient({ initialPets, initialMeta, topSlot }: BrowsePetsClientProps) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><MoonLoader size={30} color="#A00000" /></div>}>
            <BrowsePetsContent initialPets={initialPets} initialMeta={initialMeta} topSlot={topSlot} />
        </Suspense>
    );
}
