"use client";

import { useState, useEffect } from "react";
import PetGrid from "@/components/petGrid";
import Navbar from "@/components/navbar";
import "./styles.css";

interface Pet {
  pet_id: number;
  owner_id: number;
  pet_name: string;
  pet_type: number;
  pet_breed: string | null;
  city_id: number;
  area: string;
  age: number;
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
  payment_frequency: string | null;
  city: string;
  profile_image_url: string | null;
  image_id: number | null;
  image_url: string | null;
}

const UserListingsPage = () => {
  const [listings, setListings] = useState<Pet[]>([]);
  const [activeTab, setActiveTab] = useState("adoption");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user_id = 2; 

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
      </div>``

      {/* PetGrid Component with filtered listings */}
      <PetGrid pets={filteredListings} />
    </div>
    </>
  );
};

export default UserListingsPage;
