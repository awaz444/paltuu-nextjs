"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import EidBazaarGrid from "../../components/EidBazaarGrid";
import { MoonLoader } from "react-spinners";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import "./styles.css";

export interface QurbaniAnimal {
    id: string;
    species: "Goat" | "Cow" | "Bull" | "Sheep" | "Camel";
    breed: string;
    age: number;
    weight: number;
    height: number;
    teethCount: number;
    hornCondition?: 'Good' | 'Damaged' | 'Broken' | 'None';
    isVaccinated: boolean;
    description?: string;
    price: number | null;
    status: "Available" | "Sold" | "Reserved";
    location: string;
    city: string;
    sellerId: string;  // Only sellerId from the database
    images: string[];  // This will come from joined photo table
}

export interface QurbaniAnimalWithSeller extends QurbaniAnimal {
    sellerName: string;
    sellerContact: string;
    sellerProfileImage?: string;
}

export default function EidBazaar() {
    const [animals, setAnimals] = useState<QurbaniAnimalWithSeller[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        city: "",
        species: "",
        status: "Available"
    });
    const [primaryColor, setPrimaryColor] = useState("#000000");

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                const response = await fetch("/api/qurbani-animals");
                if (!response.ok) {
                    throw new Error('Failed to fetch animals');
                }
                const data = await response.json();
                console.log('Fetched animals:', data);
                
                // Transform the data to match the expected format
                const transformedData = data.map((animal: any) => ({
                    ...animal,
                    sellerId: animal.sellerId.toString(), // Convert sellerId to string if it's a number
                    weight: parseFloat(animal.weight),     // Convert weight string to number
                    height: parseFloat(animal.height),     // Convert height string to number
                    price: animal.price ? parseFloat(animal.price) : null // Convert price string to number or null
                }));
                
                setAnimals(transformedData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching animals:', error);
                setLoading(false);
            }
        };

        fetchAnimals();
    }, []);

    useSetPrimaryColor();

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    const filteredAnimals = animals.filter(animal =>
        (filters.city ? animal.city === filters.city : true) &&
        (filters.species ? animal.species === filters.species : true) &&
        animal.status === filters.status
    );

    console.log('Filtered animals:', filteredAnimals);

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* Simplified Filter */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                        className="p-2 border rounded"
                        value={filters.species}
                        onChange={(e) => setFilters({ ...filters, species: e.target.value })}
                    >
                        <option value="">All Animals</option>
                        <option value="Goat">Goat</option>
                        <option value="Sheep">Sheep</option>
                        <option value="Cow">Cow</option>
                        <option value="Bull">Bull</option>
                        <option value="Camel">Camel</option>
                    </select>

                    <select
                        className="p-2 border rounded"
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    >
                        <option value="">All Cities</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center my-12">
                        <MoonLoader size={40} color={primaryColor} />
                    </div>
                ) : (
                    <EidBazaarGrid animals={filteredAnimals} />
                )}
            </div>
        </>
    );
}