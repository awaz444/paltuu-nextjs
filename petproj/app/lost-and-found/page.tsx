"use client";
import { useEffect, useState } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import LostAndFoundFilter from "../../components/Lost&FoundFilter"; 
import LostAndFoundGrid from "../../components/LostAndFoundGrid"; // Use LostAndFoundGrid instead of PetGrid
import axios from "axios"; // Import axios for API calls
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
}

export default function LostFound() {
    useSetPrimaryColor();

    const [pets, setPets] = useState<LostAndFoundPet[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        selectedCity: "",
        location: "",
        selectedCategory: "", 
    });

    const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");

    // **Fetch lost & found posts from API**
    const fetchLostAndFoundPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("/api/get-all-lost-and-found-posts"); // Update the URL for the correct API endpoint
            setPets(response.data);
        } catch (error: any) {
            setError(
                error.response?.data?.message || 
                "Failed to fetch lost and found posts. Please try again later."
            );
        } finally {
            setLoading(false);
        }
    };

    // **Fetch posts when the component mounts**
    useEffect(() => {
        fetchLostAndFoundPosts();
    }, []);

    // **Reset filters to default values**
    const handleReset = () => {
        setFilters({
            selectedCity: "",
            location: "",
            selectedCategory: "", 
        });
    };

    // **Search based on filters**
    const handleSearch = () => {
        console.log("Searching with filters:", filters);
    };

    // **Filter pets based on city, location, category, and status**
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
                ? pet.status === "lost"
                : pet.status === "found";

        return matchesCity && matchesLocation && matchesCategory && matchesStatus;
    });

    // **Toggle active tab (Lost / Found)**
    const handleTabToggle = (tab: "lost" | "found") => {
        setActiveTab(tab);
    };

    return (
        <>
            <Navbar />
            <div className="fullBody" style={{ maxWidth: "90%", margin: "0 auto" }}>
                <LostAndFoundFilter 
                    onSearch={(filters) => setFilters((prev) => ({ ...prev, ...filters }))}
                />
                <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
                    <div className="w-full">
                        {/* **Tab Switch for Lost and Found** */}
                        <div className="tab-switch-container">
                            <div
                                className="tab-switch-slider bg-primary"
                                style={{
                                    transform: activeTab === "lost" 
                                        ? "translateX(0)" 
                                        : "translateX(100%)",
                                }}
                            />
                            <div
                                className={`tab ${activeTab === "lost" ? "active" : ""}`}
                                onClick={() => handleTabToggle("lost")}
                            >
                                Lost
                            </div>
                            <div
                                className={`tab ${activeTab === "found" ? "active" : ""}`}
                                onClick={() => handleTabToggle("found")}
                            >
                                Found
                            </div>
                        </div>

                        {loading ? (
                            <p>Loading pets...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : (
                            <LostAndFoundGrid pets={filteredPets} />
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
