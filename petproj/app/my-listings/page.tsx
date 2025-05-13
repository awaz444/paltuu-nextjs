"use client";

import { useState, useEffect } from "react";
import { Pet } from "@/components/MyListingGrid";
import Navbar from "@/components/navbar";
import { Spin } from "antd"; // Ant Design spinner
import MyListingGrid from "@/components/MyListingGrid";
import "./styles.css";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { MoonLoader } from "react-spinners";

const ADOPTION_CHECKLIST = [
  "Applicant has a stable home environment suitable for a pet",
  "All household members are on board with the adoption",
  "Applicant has prior experience with pets or has done research",
  "Financially capable of covering pet expenses (food, vet, etc.)",
  "Willing to provide regular vet visits and vaccinations",
  "No history of pet abuse or neglect",
  "Has time to properly care for and socialize with the pet"
];

const FOSTER_CHECKLIST = [
  "Has a dedicated space to house the pet safely",
  "Understands the temporary nature of fostering",
  "Can handle basic medical needs and medications if required",
  "Has access to emergency veterinary care",
  "Has flexible schedule/time to care for the pet",
  "No other pets that could pose a risk to the foster pet",
  "Has prior experience with fostering or handling animals",
  "Willing to communicate regularly with the original owner/shelter"
];


const UserListingsPage = () => {
    const [listings, setListings] = useState<Pet[]>([]);
    const [activeTab, setActiveTab] = useState("adoption");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [userId, setUserId] = useState<number | null>(null); // To store the user ID

    useEffect(() => {
        // Check for window object (client-side) and localStorage availability
        if (typeof window !== "undefined") {
            const userString = localStorage.getItem("user");
            if (!userString) {
                setError("User data not found in local storage");
                setLoading(false);
                return;
            }

            const user = JSON.parse(userString);
            const user_id = user?.id;
            if (!user_id) {
                setError("User ID is missing from the user object");
                setLoading(false);
                return;
            }

            // Convert user_id to a number
            const numericUserId = Number(user_id);
            if (isNaN(numericUserId)) {
                setError("User ID is not a valid number");
                setLoading(false);
                return;
            }

            setUserId(numericUserId); // Store the user ID in state
            setLoading(false);
        }
    }, []);
    useSetPrimaryColor();

    useEffect(() => {
        if (userId) {
            fetch(`/api/my-listings/${userId}`)
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
    }, [userId]);

    const handleTabToggle = (tab: string) => {
        setActiveTab(tab);
    };

    const filteredListings = listings.filter(
        (listing) => listing.listing_type === activeTab
    );

    const [primaryColor, setPrimaryColor] = useState("#000000"); // Default fallback color

    useEffect(() => {
        // Get the computed style of the `--primary-color` CSS variable
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    if (isLoading)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <MoonLoader size={30} color={primaryColor} />
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
            <div className="mt-8 min-h-screen px-4 flex flex-col items-center mb-6">
                {/* Tab Switch */}
                <div className="w-full max-w-2xl">
                    <div className="tab-switch-container relative flex justify-between rounded-lg bg-gray-100 p-1">
                        <div
                            className="tab-switch-slider absolute top-0 left-0 h-full w-1/2 bg-blue-500 transition-transform duration-300 bg-primary"
                            style={{
                                transform:
                                    activeTab === "adoption"
                                        ? "translateX(0)"
                                        : "translateX(100%)",
                            }}
                        />
                        <div
                            className={`tab cursor-pointer py-2 text-center font-medium ${
                                activeTab === "adoption" ? "active" : ""
                            }`}
                            onClick={() => handleTabToggle("adoption")}>
                            Adopt
                        </div>
                        <div
                            className={`tab cursor-pointer py-2 text-center font-medium ${
                                activeTab === "foster" ? "active" : ""
                            }`}
                            onClick={() => handleTabToggle("foster")}>
                            Foster
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-4xl mt-6 mb-8 p-6 bg-gray-50 rounded-xl shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                        Before You Proceed - Essential Checks
                    </h2>

                    {activeTab === "adoption" ? (
                        <div className="space-y-3">
                            <p className="text-gray-600 mb-4">
                                Ensure you've completed these mandatory
                                requirements for adoption:
                            </p>
                            {ADOPTION_CHECKLIST.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start space-x-3">
                                    <svg
                                        className="flex-shrink-0 w-5 h-5 text-green-600 mt-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <p className="text-gray-700">{item}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-600 mb-4">
                                Foster parents must confirm compliance with
                                these regulations:
                            </p>
                            {FOSTER_CHECKLIST.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-3 h-3 text-primary"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-gray-700">{item}</p>
                                </div>
                            ))}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    Note: Foster applications require home
                                    verification and 2-week trial period.
                                    Regular check-ins with our team are
                                    mandatory.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* PetGrid Component */}
                <div className="mt-6 w-full max-w-6xl mb-3">
                    <MyListingGrid pets={filteredListings} />
                </div>
            </div>
        </>
    );
};

export default UserListingsPage;
