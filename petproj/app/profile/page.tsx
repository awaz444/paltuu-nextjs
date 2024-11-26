"use client";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);

    // Logout Function
    const logout = async () => {
        try {
            await axios.get('/api/users/logout');
            toast.success('Logout successful');
            router.push('/login');
        } catch (error: any) {
            console.log(error.message);
            toast.error("Error logging out. Please try again.");
        }
    };

    // Fetch User Details Function
    const getUserDetails = async () => {
        try {
            const res = await axios.get('/api/users/me');
            setUserData(res.data.data);
        } catch (error: any) {
            console.error("Error fetching user details:", error.message);
            toast.error("Unable to fetch user details. Please try again.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-6 bg-gray-100">
            <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-semibold text-center text-gray-700">User Profile</h1>
                <hr className="my-4" />

                {userData ? (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            {userData.profile_image_url ? (
                                <img
                                    src={userData.profile_image_url}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-xl font-semibold text-gray-600">
                                    {userData.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800">{userData.name}</h2>
                                <p className="text-lg text-gray-600">{userData.username}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <p className="font-medium text-gray-700">Email:</p>
                                <p className="text-gray-600">{userData.email}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="font-medium text-gray-700">Phone Number:</p>
                                <p className="text-gray-600">{userData.phone_number}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="font-medium text-gray-700">Date of Birth:</p>
                                <p className="text-gray-600">{userData.DOB}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="font-medium text-gray-700">Role:</p>
                                <p className="text-gray-600">{userData.role}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="font-medium text-gray-700">City:</p>
                                <p className="text-gray-600">{userData.city_id ? `City ${userData.city_id}` : 'Not specified'}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-lg text-gray-500">No user details available</p>
                )}

                <div className="mt-6 flex justify-between">
                    <button
                        onClick={logout}
                        className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-lg font-semibold"
                    >
                        Logout
                    </button>
                    <button
                        onClick={getUserDetails}
                        className="bg-green-600 text-white hover:bg-green-700 px-6 py-2 rounded-lg font-semibold"
                    >
                        Get User Details
                    </button>
                </div>
            </div>
        </div>
    );
}