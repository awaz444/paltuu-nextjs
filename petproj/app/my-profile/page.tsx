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
    phone_number: string;
    city: string;
    created_at: string;
}

const MyProfile = () => {
    useSetPrimaryColor();

    const [userId, setUserId] = useState<string | null>(null);
    const [data, setData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [editing, setEditing] = useState<boolean>(false);
    const [updatedData, setUpdatedData] = useState<UserProfileData | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            console.error("No user data found in local storage.");
            setLoading(false);
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser?.id;
        if (!userId) {
            console.error("User ID is missing in the stored user data.");
            setLoading(false);
            return;
        }

        setUserId(userId);

        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/my-profile/${userId}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch user data. Status: ${res.status}`);
                }
                const responseData: UserProfileData = await res.json();
                setData(responseData);
                setUpdatedData(responseData);
            } catch (error) {
                console.error("Error fetching user profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (updatedData) {
            setUpdatedData({
                ...updatedData,
                [e.target.name]: e.target.value,
            });
        }
    };
    console.log(userId);

    const handleSaveChanges = async () => {
        if (!userId) {
            console.error("No user ID available");
            return;
        }

        try {
            const res = await fetch(`/api/my-profile/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData),
            });

            if (!res.ok) {
                throw new Error("Failed to update user profile.");
            }

            const updatedProfile = await res.json();
            setData(updatedProfile);
            setEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader"></div>
            </div>
        );
    }

    if (!data || !updatedData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-600">Error loading data. Please try again later.</p>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="bg-gray-100 min-h-screen px-6 py-8">
                <div className="bg-white shadow-lg rounded-lg p-6 mb-6 relative border border-gray-200 hover:border-primary">
                    <h3 className="text-xl font-bold mb-4 text-primary">
                        Personal Information
                    </h3>
                    <div className="flex gap-4">
                        <img
                            className="w-24 h-24 rounded-full shadow-md"
                            src={data.profile_image_url || "/placeholder.jpg"}
                            alt={data.name}
                        />
                        <div className="flex-1">
                            {/* Editable Fields */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={updatedData.name}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={updatedData.email}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={updatedData.city}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone_Number"
                                    value={updatedData.phone_number}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={updatedData.dob}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={handleSaveChanges}
                                className="px-6 py-2 text-white bg-primary rounded-xl hover:bg-primary-dark">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MyProfile;