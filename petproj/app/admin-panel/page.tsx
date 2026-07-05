"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
// removed useSession import

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
    const { user, isHydrating } = useAuth();
    const router = useRouter();

    const [userId, setUserId] = useState<string | null>(null);
    const [data, setData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [socialCounts, setSocialCounts] = useState<{ untagged: number; reports: number }>({ untagged: 0, reports: 0 });

    const fetchedRef = React.useRef(false);

    // Check if user has admin role
    useEffect(() => {
        if (!isHydrating && user && user.role !== "admin") {
            console.warn("Unauthorized access to admin panel");
            router.push("/browse-pets");
        }
    }, [user, isHydrating, router]);

    useEffect(() => {
        // Get user_id from AuthContext
        const currentUserId = user?.id || null;

        if (!currentUserId || isHydrating) return;

        if (fetchedRef.current) return;

        setUserId(currentUserId);
        console.log(`Fetched user ID: ${currentUserId}`);

        // Fetch user profile
        const fetchUserProfile = async () => {
            if (!currentUserId) return;

            setLoading(true);
            try {
                fetchedRef.current = true;
                const res = await fetch(`/api/v1/users/profile/${currentUserId}`);
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
                fetchedRef.current = false;
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();

        // Fetch social moderation counts for hub card badges
        Promise.all([
            fetch("/api/v1/admin/social/tagging-queue?limit=1").then(r => r.json()).catch(() => ({})),
            fetch("/api/v1/admin/social/reports?status=pending&limit=50").then(r => r.json()).catch(() => ({})),
        ]).then(([queueData, reportsData]) => {
            setSocialCounts({
                untagged: queueData.total_untagged ?? 0,
                reports: (reportsData.reports ?? []).length,
            });
        });
    }, [user, isHydrating]);


    if (loading || isHydrating) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader"></div>
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-600">
                    Unauthorized. Only admins can access this page.
                </p>
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
                    <Link href="/my-profile">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Edit Personal Info">
                            <img src="/pen.svg" alt="Edit" />
                        </button>
                    </Link>
                    <h3 className="text-lg sm:text-xl font-bold mb-4 text-primary">
                        Personal Information
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <img
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-md mx-auto sm:mx-0"
                            src={profile_image_url || "/no-profile/no-profile.jpg"}
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

                    {/* Clinics & Vets → now /manage-clinics */}
                    <Link href="/manage-clinics">
                    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 relative border border-gray-200 hover:border-primary transition-all cursor-pointer">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Go to Clinics & Vets">
                            <img
                                src="/arrow-right.svg"
                                alt="Details"
                                className="hover:text-primary"
                            />
                        </button>
                        <h4 className="text-base sm:text-lg font-bold text-primary mb-4">
                            Manage Clinics & Vets
                        </h4>
                        <p className="text-sm text-gray-600">Add / edit clinics, create vets, link vets to clinics</p>
                    </div>
                    </Link>

                    {/* Bazaar Portal */}
                    <Link href="/admin">
                    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 relative border border-gray-200 hover:border-primary transition-all cursor-pointer">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Go to Bazaar Portal">
                            <img
                                src="/arrow-right.svg"
                                alt="Details"
                                className="hover:text-primary"
                            />
                        </button>
                        <h4 className="text-base sm:text-lg font-bold text-primary mb-4">
                            Go to Bazaar Portal
                        </h4>
                        <p className="text-sm text-gray-600">Update products, vet custom items, and track sellers</p>
                    </div>
                    </Link>

                    {/* Social Moderation */}
                    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 border border-gray-200 col-span-1 sm:col-span-2 lg:col-span-3">
                        <h4 className="text-base sm:text-lg font-bold text-primary mb-4">Social Moderation</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <Link href="/admin-panel/social/tagging">
                                <div className="border border-gray-200 hover:border-primary rounded-lg p-3 cursor-pointer transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-gray-800">🏷 Tagging Queue</p>
                                        {socialCounts.untagged > 0 && (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">{socialCounts.untagged}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Tag untagged posts for personalization</p>
                                </div>
                            </Link>
                            <Link href="/admin-panel/social/reports">
                                <div className="border border-gray-200 hover:border-primary rounded-lg p-3 cursor-pointer transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-gray-800">⚠ Report Queue</p>
                                        {socialCounts.reports > 0 && (
                                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">{socialCounts.reports}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Review flagged posts and reporter trust</p>
                                </div>
                            </Link>
                            <Link href="/admin-panel/social/tags">
                                <div className="border border-gray-200 hover:border-primary rounded-lg p-3 cursor-pointer transition-all">
                                    <p className="text-sm font-semibold text-gray-800 mb-1">🗂 Tag Taxonomy</p>
                                    <p className="text-xs text-gray-500">Add, edit, and manage content tags</p>
                                </div>
                            </Link>
                            <Link href="/admin-panel/social/posts">
                                <div className="border border-gray-200 hover:border-primary rounded-lg p-3 cursor-pointer transition-all">
                                    <p className="text-sm font-semibold text-gray-800 mb-1">🔍 Post Browser</p>
                                    <p className="text-xs text-gray-500">Search and moderate any post</p>
                                </div>
                            </Link>
                            <Link href="/admin-panel/social/experiment">
                                <div className="border border-gray-200 hover:border-primary rounded-lg p-3 cursor-pointer transition-all">
                                    <p className="text-sm font-semibold text-gray-800 mb-1">🧪 A/B Experiment</p>
                                    <p className="text-xs text-gray-500">Compare personalized vs. current feed</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminPanel;
