"use client";
import { useState, useEffect } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import RescueFilter from "../../components/RescueFilter";
import RescueGrid from "../../components/RescueGrid";
import { MoonLoader } from "react-spinners";
import { RescuePet } from "@/types/rescue";
import "./styles.css";

export default function RescuePets() {
    

    const [pets, setPets] = useState<RescuePet[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        petType: "",
        location: "",
    });

    const [primaryColor, setPrimaryColor] = useState("#000000");

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) setPrimaryColor(color);
    }, []);

    useEffect(() => {
        const fetchPets = async () => {
            try {
                const res = await fetch("/api/v1/rescue/pets");
                if (!res.ok) throw new Error("Failed to fetch pets");
                const data = await res.json();
                setPets(data);
            } catch (err) {
                console.error("Error fetching rescue pets:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPets();
    }, []);

    const filteredPets = pets.filter((pet) => {
        const matchesStatus = filters.status
            ? (pet.adoption_status || "available") === filters.status
            : true;
        const matchesType = filters.petType
            ? pet.pet_type === Number(filters.petType)
            : true;
        const matchesLocation = filters.location
            ? pet.city_id === Number(filters.location)
            : true;

        return matchesStatus && matchesType && matchesLocation;
    });

    // The API already returns adopted pets last, newest first.
    const sortedPets = filteredPets;

    return (
        <>
            
            <div className="fullBody" style={{ maxWidth: "90%", margin: "0 auto" }}>
                <RescueFilter
                    onSearch={(filters) => setFilters(filters)}
                    onReset={() =>
                        setFilters({
                            status: "",
                            petType: "",
                            location: "",
                        })
                    }
                />
                <main className="flex min-h-screen flex-col mx-0 md:mx-8 mt-1 items-center pt-7 bg-gray-100">
                    <div className="w-full">
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-bold text-gray-800">Rescue Pets Needing Homes</h1>
                            <p className="text-gray-600 mt-2">
                                These animals have been rescued and are looking for their forever homes
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-16">
                                <MoonLoader color={primaryColor} size={30} />
                            </div>
                        ) : sortedPets.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500">No rescue pets match your filters</p>
                                <button
                                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                                    onClick={() =>
                                        setFilters({
                                            status: "",
                                            petType: "",
                                            location: "",
                                        })
                                    }
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <RescueGrid pets={sortedPets} />
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
