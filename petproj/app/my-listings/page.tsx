"use client";

import { useState, useEffect } from "react";
import { Pet } from "@/components/MyListingGrid";
import Navbar from "@/components/navbar";
import MyListingGrid from "@/components/MyListingGrid";
import "./styles.css";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { MoonLoader } from "react-spinners";
import Link from "next/link";
import { Collapse } from "antd";
import {
    CheckCircleOutlined,
    EnvironmentOutlined,
    DollarOutlined,
    TeamOutlined,
    HeartOutlined,
    MedicineBoxOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Panel } = Collapse;

const ADOPTION_CHECKLIST = [
    {
        title: "Stable Home Environment",
        description:
            "Applicant has a stable home environment suitable for a pet",
        icon: <EnvironmentOutlined />,
    },
    {
        title: "Household Agreement",
        description: "All household members are on board with the adoption",
        icon: <TeamOutlined />,
    },
    {
        title: "Experience & Research",
        description:
            "Applicant has prior experience with pets or has done research",
        icon: <SafetyCertificateOutlined />,
    },
    {
        title: "Financial Capability",
        description:
            "Financially capable of covering pet expenses (food, vet, etc.)",
        icon: <DollarOutlined />,
    },
    {
        title: "Veterinary Care",
        description: "Willing to provide regular vet visits and vaccinations",
        icon: <MedicineBoxOutlined />,
    },
    {
        title: "Time Commitment",
        description: "Has time to properly care for and socialize with the pet",
        icon: <HeartOutlined />,
    },
];

const UserListingsPage = () => {
    const [listings, setListings] = useState<Pet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [userId, setUserId] = useState<number | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#000000");

    useEffect(() => {
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

            const numericUserId = Number(user_id);
            if (isNaN(numericUserId)) {
                setError("User ID is not a valid number");
                setLoading(false);
                return;
            }

            setUserId(numericUserId);
            setLoading(false);
        }
    }, []);

    

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch regular listings
                const listingsResponse = await fetch(
                    `/api/my-listings/${userId}`
                );
                if (!listingsResponse.ok) {
                    throw new Error("Failed to fetch listings");
                }
                const listingsData = await listingsResponse.json();
                setListings(listingsData.listings);

                setIsLoading(false);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("An unknown error occurred");
                }
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    useEffect(() => {
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
            
            <div className="mt-8 min-h-screen px-4 flex flex-col items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 text-center">
                    My Listings
                </h1>
                {/* Conditional rendering based on whether listings exist */}
                {listings.length === 0 ? (
                    <div className="w-full max-w-4xl mt-8 text-center">
                        <div className="bg-white p-8 rounded-xl shadow-sm">
                            <svg
                                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                No Listings Yet
                            </h2>
                            <p className="text-gray-600 mb-6">
                                You haven't created any adoption listings yet.
                            </p>
                            <Link href="/create-listing">
                                <button
                                    type="button"
                                    className="px-6 py-3 bg-primary text-white rounded-3xl hover:bg-dark transition-all duration-300">
                                    Create Your First Listing
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-full max-w-4xl mt-6 mb-8 bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                                    Adoption Readiness Checklist
                                </h2>
                                <p className="text-gray-600">
                                    Complete these requirements to ensure a
                                    successful adoption process
                                </p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ADOPTION_CHECKLIST.map((item, index) => (
                                        <div
                                            key={index}
                                            className="border border-gray-200 rounded-lg p-4 flex items-start transition-all duration-300 hover:border-primary hover:shadow-sm">
                                            <div className="rounded-full p-2 mr-3 bg-gray-100 text-gray-600">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-800">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Collapse
                                    bordered={false}
                                    className="bg-transparent mt-6"
                                    expandIconPosition="end">
                                    <Panel
                                        header={
                                            <span className="font-medium text-primary">
                                                Why are these checks important?
                                            </span>
                                        }
                                        key="1"
                                        className="border-0">
                                        <div className="text-gray-600 text-sm pl-5">
                                            <ul className="list-disc space-y-2">
                                                <li>
                                                    These requirements help
                                                    ensure pets are placed in
                                                    safe, loving, and permanent
                                                    homes
                                                </li>
                                                <li>
                                                    They minimize the risk of
                                                    pets being returned or
                                                    rehomed
                                                </li>
                                                <li>
                                                    They help match pets with
                                                    owners who can properly care
                                                    for them
                                                </li>
                                                <li>
                                                    They ensure adopters
                                                    understand the
                                                    responsibilities of pet
                                                    ownership
                                                </li>
                                            </ul>
                                        </div>
                                    </Panel>
                                </Collapse>
                            </div>
                        </div>

                        <div className="mt-6 w-full max-w-6xl mb-3">
                            <MyListingGrid pets={listings} />
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default UserListingsPage;
