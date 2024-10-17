"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVets } from "../store/slices/vetSlice";
import Navbar from "@/components/navbar";
import VetFilterSection from "@/components/vetfilterSelection";
import { RootState, AppDispatch } from "../store/store";

export default function PetCare() {
  const dispatch = useDispatch<AppDispatch>();
  const { vets, loading, error } = useSelector((state: RootState) => state.vets);

  // State for filter inputs
  const [filters, setFilters] = useState({
    degree: "",
    city: ""
  });

  useEffect(() => {
    dispatch(fetchVets());
  }, [dispatch]);

  // Reset filters to their initial state
  const handleReset = () => {
    setFilters({
      degree: "",
      city: ""
    });
  };

  // Handle search operation
  const handleSearch = () => {
    console.log("Searching with filters:", filters);
  };

  // Filter vets based on the current filters
  const filteredVets = vets.filter((vet) => {
    const matchesQualification = filters.degree ? vet.degree.includes(filters.degree) : true;
    const matchesCity = filters.city ? vet.city.includes(filters.city) : true;

    return matchesQualification && matchesCity;
  });

  return (
    <>
      <Navbar />
      <div className="fullBody">
        <VetFilterSection
          onSearch={(filters) =>
            setFilters((prev) => ({ ...prev, ...filters }))
          }
        />
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
          <h1 className="text-2xl font-bold mt-0"
              style={{ margin: "2px auto"}}  >Meet Our Vets</h1>

          {loading ? (
          <p>Loading vets...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : vets.length > 0 ? (
          <div className="flex flex-col items-center gap-8 mt-8">
          {vets.map((vet) => (
            <div
              key={vet.vet_id}
              className="border rounded-lg shadow p-10 bg-white w-full max-w-5xl mb-8 relative"
              style={{ margin: "10px auto" }} // Adding a little space on left and right
            >
              <h2 className="text-2xl font-bold">{vet.clinic_name}</h2>
              <p className="text-gray-500">Location: {vet.location}</p>
              <p className="text-gray-500">Minimum Fee: PKR {vet.minimum_fee}</p>
              <p className="text-gray-500">Contact: {vet.contact_details}</p>
              <p className="text-gray-500">Bio: {vet.bio}</p>
              <p
                className={`text-sm ${
                  vet.profile_verified ? "text-green-500" : "text-red-500"
                }`}
              >
                {vet.profile_verified ? "Verified" : "Not Verified"}
              </p>

              {/* Book Now button in the bottom-right corner */}
              <button
                className="absolute bottom-4 right-4 text-white p-2 rounded-2xl w-32"
                style={{ backgroundColor: "#A03048" }}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
        ) : (
          <p>No vets available at the moment.</p>
        )}
        </main>
      </div>
    </>
  );
}
