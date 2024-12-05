'use client'

import { useState, useEffect } from "react";
import { Pet } from "@/components/MyListingGrid";
import Navbar from "@/components/navbar";
import { Spin } from "antd"; // Ant Design spinner
import MyListingGrid from "@/components/MyListingGrid";
import "./styles.css";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";

const UserListingsPage = () => {
  const [listings, setListings] = useState<Pet[]>([]);
  const [activeTab, setActiveTab] = useState("adoption");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user_id = 1; // Hardcoded user ID

  useSetPrimaryColor();

  // Function to refresh listings from the API
  const refreshListings = () => {
    setIsLoading(true); // Set loading to true before fetching
    fetch(`/api/my-listings/${user_id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch listings");
        }
        return res.json();
      })
      .then((data) => {
        setListings(data.listings);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  };

  // Fetch listings on component mount and when user_id changes
  useEffect(() => {
    if (user_id) {
      refreshListings();
    }
  }, [user_id]);

  const handleTabToggle = (tab: string) => {
    setActiveTab(tab);
  };

  const filteredListings = listings.filter(
    (listing) => listing.listing_type === activeTab
  );

  // Handle delete action
  const handleDelete = (petId: string) => {
    fetch(`/api/pets/${petId}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete pet");
        }
        // Refresh listings after successful deletion
        refreshListings();
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  // Handle update action (e.g., status update)
  const handleUpdate = (petId: string, status: string) => {
    fetch(`/api/pets/${petId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update pet");
        }
        // Refresh listings after successful update
        refreshListings();
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        Error: {error}
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="mt-8 px-4 flex flex-col items-center">
        {/* Tab Switch */}
        <div className="w-full max-w-2xl">
          <div className="tab-switch-container relative flex justify-between rounded-lg bg-gray-100 p-1">
            <div
              className="tab-switch-slider absolute top-0 left-0 h-full w-1/2 bg-blue-500 transition-transform duration-300 bg-primary"
              style={{
                transform: activeTab === "adoption" ? "translateX(0)" : "translateX(100%)",
              }}
            />
            <div
              className={`tab cursor-pointer py-2 text-center font-medium ${
                activeTab === "adoption" ? "active" : ""
              }`}
              onClick={() => handleTabToggle("adoption")}
            >
              Adopt
            </div>
            <div
              className={`tab cursor-pointer py-2 text-center font-medium ${
                activeTab === "foster" ? "active" : ""
              }`}
              onClick={() => handleTabToggle("foster")}
            >
              Foster
            </div>
          </div>
        </div>

        {/* PetGrid Component */}
        <div className="mt-6 w-full max-w-6xl">
          <MyListingGrid
            pets={filteredListings}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    </>
  );
};

export default UserListingsPage;
