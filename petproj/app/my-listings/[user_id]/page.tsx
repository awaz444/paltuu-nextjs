"use client";

import { useState, useEffect } from "react";
import { PetWithImages } from "../../types/petWithImages";
import PetGrid from "@/components/petGrid";
import Navbar from "@/components/navbar";
import "./styles.css";

const UserListingsPage = () => {
  const [listings, setListings] = useState<PetWithImages[]>([]);
  const [activeTab, setActiveTab] = useState("adoption");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user_id = 1; // Hardcoded user ID

  useEffect(() => {
    if (user_id) {
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
    }
  }, [user_id]);

  const handleTabToggle = (tab: string) => {
    setActiveTab(tab);
  };

  const filteredListings = listings.filter(
    (listing) => listing.listing_type === activeTab
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
    <Navbar/>
    <div className="user-listings-page mt-4">
      {/* Adopt and Foster Tab Switch */}
      <div className="w-3/4">
        <div className="tab-switch-container relative">
          <div
            className="tab-switch-slider"
            style={{
              transform: activeTab === "adoption" ? "translateX(0)" : "translateX(100%)",
            }}
          />
          <div
            className={`tab ${activeTab === "adoption" ? "active" : ""}`}
            onClick={() => handleTabToggle("adoption")}
          >
            Adopt
          </div>
          <div
            className={`tab ${activeTab === "foster" ? "active" : ""}`}
            onClick={() => handleTabToggle("foster")}
          >
            Foster
          </div>
        </div>
      </div>

      {/* PetGrid Component with filtered listings */}
      <PetGrid pets={filteredListings} />
    </div>
    </>
  );
};

export default UserListingsPage;
