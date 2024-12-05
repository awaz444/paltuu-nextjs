"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";

interface UserProfileData {
    user_id: string;
    name: string;
    dob: string;
    email: string;
    profile_image_url: string;
    city: string;
    created_at: string;
}

const MyProfile = () => {
    useSetPrimaryColor();

    const [userId, setUserId] = useState<string | null>(null);
    const [data, setData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Get user_id from local storage
        const storedUserId = localStorage.getItem("user_id");
        if (!storedUserId) {
            console.error("No user_id found in local storage.");
            setLoading(false);
            return;
        }
        setUserId(storedUserId);

        // Fetch user profile
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/my-profile/${storedUserId}`);
                if (!res.ok) {
                    throw new Error(
                        `Failed to fetch user data. Status: ${res.status}`
                    );
                }
                const responseData: UserProfileData = await res.json();
                setData(responseData);
            } catch (error) {
                console.error("Error fetching user profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

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
            <Navbar />
            <div className="bg-gray-100 min-h-screen px-6 py-8">
                {/* Personal Info Box */}
                <div className="bg-white shadow-lg rounded-lg p-6 mb-6 relative border border-gray-200 hover:border-primary">
                    <button
                        className="absolute top-4 right-4 w-6 h-6"
                        title="Edit Personal Info">
                        <img src="/pen.svg" alt="Edit" />
                    </button>
                    <h3 className="text-xl font-bold mb-4 text-primary">
                        Personal Information
                    </h3>
                    <div className="flex gap-4">
                        <img
                            className="w-24 h-24 rounded-full shadow-md"
                            src={profile_image_url || "/placeholder.jpg"}
                            alt={name}
                        />
                        <div>
                            <p>
                                <span className="font-bold">Name:</span> {name}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">Email:</span> {email}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">City:</span> {city}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">Date of Birth:</span>{" "}
                                {dob}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">Joined:</span>{" "}
                                {new Date(created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MyProfile;
