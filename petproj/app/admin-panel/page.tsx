"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "next-auth/react";

interface UserProfileData {
    user_id: string;
    name: string;
    dob: string;
    email: string;
    profile_image_url: string;
    city: string;
    created_at: string;
}

const AdminPanel = () => {
    const { user } = useAuth();
    const { data: session, status } = useSession();

    const [userId, setUserId] = useState<string | null>(null);
    const [data, setData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Get user_id from session (NO localStorage)
        const currentUserId = user?.id || (session?.user as any)?.user_id || null;

        if (!currentUserId) {
            console.error("No user ID found in session.");
            setLoading(false);
            return;
        }

        setUserId(currentUserId);
        console.log(`Fetched user ID: ${currentUserId}`);

        // Fetch user profile
        const fetchUserProfile = async () => {
            if (!currentUserId) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/my-profile/${currentUserId}`);
                if (!res.ok) {
                    throw new Error(
                        `Failed to fetch user data. Status: ${res.status}`
                    );
                }
                const responseData: UserProfileData = await res.json();
                console.log(responseData)
                setData(responseData);
            } catch (error) {
                console.error("Error fetching user profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [user, session]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-600">
                    Error loading data. Please try again later.
                </p>
            </div>
        );
    }

    const { name, dob, email, profile_image_url, city, created_at } = data;

    return (
        <>

            <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
                {/* Personal Info Box */}
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-6 relative border border-gray-200 hover:border-primary">
                    <button
                        className="absolute top-4 right-4 w-6 h-6"
                        title="Edit Personal Info">
                        <img src="/pen.svg" alt="Edit" />
                    </button>
                    <h3 className="text-lg sm:text-xl font-bold mb-4 text-primary">
                        Personal Information
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <img
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-md mx-auto sm:mx-0"
                            src={profile_image_url || "/placeholder.jpg"}
                            alt={name}
                        />
                        <div className="flex-1 text-center sm:text-left">
                            <p className="mb-2">
                                <span className="font-bold">Name:</span> {name}
                            </p>
                            <p className="mb-2">
                                <span className="font-bold">Email:</span> <span className="break-all">{email}</span>
                            </p>
                            <p className="mb-2">
                                <span className="font-bold">City:</span> {city}
                            </p>
                            <p className="mb-2">
                                <span className="font-bold">Date of Birth:</span>{" "}
                                {dob}
                            </p>
                            <p className="mb-2">
                                <span className="font-bold">Joined:</span>{" "}
                                {new Date(created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>


                {/* Grid for Action Cards */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Pets */}
                    <Link href="/admin-pet">
                        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 relative border border-gray-200 hover:border-primary transition-all cursor-pointer">
                            <button
                                className="absolute top-4 right-4 w-6 h-6"
                                title="Go to Pets">
                                <img
                                    src="/arrow-right.svg"
                                    alt="Details"
                                    className="hover:text-primary"
                                />
                            </button>

                            <h4 className="text-base sm:text-lg font-bold text-primary mb-4">
                                Go to Pets
                            </h4>
                            <p className="text-sm text-gray-600">Manage all pet listings</p>
                        </div>
                    </Link>

                    {/* Listing Approvals */}
                    <Link href="/admin-pet-approval">
                    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 relative border border-gray-200 hover:border-primary transition-all cursor-pointer">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Go to Approvals">
                            <img
                                src="/arrow-right.svg"
                                alt="Details"
                                className="hover:text-primary"
                            />
                        </button>
                        <h4 className="text-base sm:text-lg font-bold text-primary mb-4">
                            Go to Listing Approvals
                        </h4>
                        <p className="text-sm text-gray-600">Review pending pet listings</p>
                    </div>
                    </Link>

                    {/* Users */}
                    <Link href="/admin-user">
                        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 relative border border-gray-200 hover:border-primary transition-all cursor-pointer">
                            <div className="absolute top-4 right-4 w-6 h-6">
                                <img
                                    src="/arrow-right.svg"
                                    alt="Details"
                                    className="hover:text-primary text-primary"
                                />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-primary mb-4">
                                Go to Users
                            </h4>
                            <p className="text-sm text-gray-600">Manage user accounts</p>
                        </div>
                    </Link>

                    {/* Verification Applications */}
                    <Link href="/admin-approve-vets">
                    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 relative border border-gray-200 hover:border-primary transition-all cursor-pointer">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Go to Verification">
                            <img
                                src="/arrow-right.svg"
                                alt="Details"
                                className="hover:text-primary"
                            />
                        </button>
                        <h4 className="text-base sm:text-lg font-bold text-primary mb-4">
                            Go to Verification Applications
                        </h4>
                        <p className="text-sm text-gray-600">Approve vet verifications</p>
                    </div>
                    </Link>

                    {/* Orders */}
                    <Link href="/orders">
                    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 relative border border-gray-200 hover:border-primary transition-all cursor-pointer">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Go to Orders">
                            <img
                                src="/arrow-right.svg"
                                alt="Details"
                                className="hover:text-primary"
                            />
                        </button>
                        <h4 className="text-base sm:text-lg font-bold text-primary mb-4">
                            Go to Orders
                        </h4>
                        <p className="text-sm text-gray-600">View all marketplace orders</p>
                    </div>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default AdminPanel;
