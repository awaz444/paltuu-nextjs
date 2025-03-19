"use client";
import { useEffect, useState } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import LostAndFoundFilter from "../../components/Lost&FoundFilter";
import LostAndFoundGrid from "../../components/LostAndFoundGrid";
import axios from "axios";
import { MoonLoader } from "react-spinners";
import "./styles.css";

interface LostAndFoundPet {
    post_id: number;
    user_id: number;
    post_type: string;
    pet_description: string;
    city_id: number;
    location: string;
    contact_info: string;
    post_date: string;
    status: string;
    category_id: number;
    image_url: string | null;
    city: string;
    category_name: string;
    date: string | null;
    user_name: string;
    user_profile_image: string | null;
}

export default function LostFound() {
    useSetPrimaryColor();

    const [pets, setPets] = useState<LostAndFoundPet[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        selectedCity: "1",
        location: "",
        selectedCategory: "",
    });

    const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");

    const fetchLostAndFoundPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("/api/lost-and-found");
            console.log("API Response:", response);

            if (!response.data || !Array.isArray(response.data)) {
                throw new Error("Invalid API response");
            }

            const mappedPets = response.data.map((pet: any) => ({
                post_id: pet.post_id,
                user_id: pet.user_id,
                post_type: pet.post_type,
                pet_description: pet.pet_description,
                city_id: pet.city_id,
                location: pet.location,
                contact_info: pet.contact_info,
                post_date: pet.post_date,
                status: pet.status,
                category_id: pet.category_id,
                image_url: pet.image || null,
                city: pet.city,
                category_name: pet.category,
                date: pet.date || null,
                user_name: pet.user_name,
                user_profile_image: pet.user_profile_image || null,
            }));

            setPets(mappedPets);
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                "Failed to fetch lost and found posts. Please try again later."
            );
            console.error("API Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLostAndFoundPosts();
    }, []);

    const handleReset = () => {
        setFilters({
            selectedCity: "",
            location: "",
            selectedCategory: "",
        });
    };

    const handleSearch = () => {
        console.log("Searching with filters:", filters);
    };

    const [primaryColor, setPrimaryColor] = useState("#000000");

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    const filteredPets = pets.filter((pet) => {
        const matchesCity = filters.selectedCity
            ? pet.city_id === Number(filters.selectedCity)
            : true;
        const matchesLocation = filters.location
            ? pet.location?.toLowerCase().includes(filters.location.toLowerCase())
            : true;
        const matchesCategory = filters.selectedCategory
            ? pet.category_id === Number(filters.selectedCategory)
            : true;

        const matchesStatus =
            activeTab === "lost"
                ? pet.post_type === "lost"
                : pet.post_type === "found";

        return matchesCity && matchesLocation && matchesCategory && matchesStatus;
    });

    const sortedPets = filteredPets.sort((a, b) => {
        const dateA = new Date(a.date ?? 0);
        const dateB = new Date(b.date ?? 0);
        return dateB.getTime() - dateA.getTime();
    });

    const handleTabToggle = (tab: "lost" | "found") => {
        setActiveTab(tab);
    };

    return (
        <>
            <Navbar />
            <div
                className="fullBody lg:w-3/4"
                style={{ maxWidth: "90%", margin: "0 auto" }}>
                <LostAndFoundFilter
                    onSearch={(filters) => {
                        console.log("Filters updated:", filters);
                        setFilters((prev) => ({ ...prev, ...filters }));
                    }}
                />
                <main className="flex min-h-screen flex-col mx-0 md:mx-8 mt-1 items-center pt-7 bg-gray-100">
                    <div className="w-full">
                        <div className="tab-switch-container">
                            <div
                                className="tab-switch-slider bg-primary"
                                style={{
                                    transform:
                                        activeTab === "lost"
                                            ? "translateX(0)"
                                            : "translateX(100%)",
                                }}
                            />
                            <div
                                className={`tab ${activeTab === "lost" ? "active" : ""
                                    }`}
                                onClick={() => handleTabToggle("lost")}>
                                Lost
                            </div>
                            <div
                                className={`tab ${activeTab === "found" ? "active" : ""
                                    }`}
                                onClick={() => handleTabToggle("found")}>
                                Found
                            </div>
                        </div>

                        {loading ? (
                            <MoonLoader
                                className="mt-5 mx-auto relative top-5"
                                size={30}
                                color={primaryColor}
                            />
                        ) : error ? (
                            <div className="text-center">
                                <p className="text-red-500">{error}</p>
                                <button
                                    className="mt-2 px-4 py-2 bg-primary text-white rounded"
                                    onClick={fetchLostAndFoundPosts}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <LostAndFoundGrid pets={sortedPets} />
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}