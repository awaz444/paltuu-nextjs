"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import EidBazaarGrid from "../../components/EidBazaarGrid";
import { MoonLoader } from "react-spinners";
import "./styles.css";

export interface QurbaniAnimal {
  id: string;
  species: "Goat" | "Cow" | "Bull" | "Sheep" | "Camel";
  breed: string;
  age: number;
  weight: number;
  description?: string;
  price: number;
  status: "Available" | "Sold" | "Reserved";
  location: string;
  city: string;
  sellerName: string;
  sellerContact: string;
  images: string[];
}

export default function EidBazaar() {
  const [animals, setAnimals] = useState<QurbaniAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: "",
    species: "",
    status: "Available"
  });

  // Dummy data - replace with API call
  useEffect(() => {
    setTimeout(() => {
      setAnimals([
        {
          id: "1",
          species: "Goat",
          breed: "Beetal",
          age: 2,
          weight: 40,
          price: 45000,
          status: "Available",
          location: "Gulshan",
          city: "Karachi",
          sellerName: "Ali Ahmed",
          sellerContact: "03001234567",
          images: ["/goat.jpg"]
        },
        {
          id: "2",
          species: "Cow",
          breed: "Sahiwal",
          age: 3,
          weight: 180,
          price: 120000,
          status: "Available",
          location: "DHA",
          city: "Lahore",
          sellerName: "Bilal Khan",
          sellerContact: "03331234567",
          images: ["/cow.jpg"]
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAnimals = animals.filter(animal => 
    (filters.city ? animal.city === filters.city : true) &&
    (filters.species ? animal.species === filters.species : true) &&
    animal.status === filters.status
  );

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8">Eid Bazaar</h1>
        
        {/* Simplified Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select 
            className="p-2 border rounded"
            value={filters.species}
            onChange={(e) => setFilters({...filters, species: e.target.value})}
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
            onChange={(e) => setFilters({...filters, city: e.target.value})}
          >
            <option value="">All Cities</option>
            <option value="Karachi">Karachi</option>
            <option value="Lahore">Lahore</option>
            <option value="Islamabad">Islamabad</option>
          </select>

          <select 
            className="p-2 border rounded"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value as any})}
          >
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <MoonLoader size={40} color="#3B82F6" />
          </div>
        ) : (
          <EidBazaarGrid animals={filteredAnimals} />
        )}
      </div>
    </>
  );
}