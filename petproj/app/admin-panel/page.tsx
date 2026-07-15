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

const ADMIN_PANEL_PIN = "1212";

interface TileDef {
    href: string;
    title: string;
    desc: string;
    badge?: number;
    icon?: string;
}

interface CategoryDef {
    name: string;
    tiles: TileDef[];
}

const Tile = ({ href, title, desc, badge }: TileDef) => (
    <Link href={href}>
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-5 h-full min-h-[150px] flex flex-col justify-between border border-gray-200 hover:border-primary transition-all cursor-pointer">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm sm:text-base font-bold text-primary leading-snug">{title}</h4>
                    {!!badge && badge > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600">{desc}</p>
            </div>
            <img src="/arrow-right.svg" alt="" className="w-5 h-5 self-end opacity-60" />
        </div>
    </Link>
);

const AdminPanel = () => {
    const { user, isHydrating } = useAuth();
    const router = useRouter();

    const [pinVerified, setPinVerified] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState("");

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

    // PIN gate — asked for on every visit to this page, independent of the admin role check
    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinInput === ADMIN_PANEL_PIN) {
            setPinVerified(true);
            setPinError("");
        } else {
            setPinError("Incorrect PIN");
            setPinInput("");
        }
    };

    if (!pinVerified) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 px-4">
                <form
                    onSubmit={handlePinSubmit}
                    className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xs text-center border border-gray-200"
                >
                    <h3 className="text-lg font-bold text-primary mb-2">Admin Panel Locked</h3>
                    <p className="text-sm text-gray-500 mb-4">Enter the 4-digit PIN to continue</p>
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={pinInput}
                        onChange={(e) => {
                            setPinError("");
                            setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                        }}
                        className="w-full text-center tracking-[0.6em] text-2xl font-bold border border-gray-300 rounded-lg py-3 mb-3 focus:border-primary outline-none"
                        autoFocus
                    />
                    {pinError && <p className="text-red-600 text-sm mb-3">{pinError}</p>}
                    <button
                        type="submit"
                        disabled={pinInput.length !== 4}
                        className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Unlock
                    </button>
                </form>
            </div>
        );
    }

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

    const categories: CategoryDef[] = [
        {
            name: "Pets & Adoptions",
            tiles: [
                { href: "/admin-pet", title: "Pets", desc: "Manage all pet listings" },
                { href: "/admin-pet-approval", title: "Listing Approvals", desc: "Review pending pet listings" },
                { href: "/admin-approve-vets", title: "Vet Verifications", desc: "Approve vet verification applications" },
                { href: "/manage-clinics", title: "Clinics & Vets", desc: "Add/edit clinics, create vets, link vets to clinics" },
            ],
        },
        {
            name: "Users",
            tiles: [
                { href: "/admin-user", title: "Users", desc: "Manage user accounts" },
            ],
        },
        {
            name: "Commerce",
            tiles: [
                { href: "/orders", title: "Orders", desc: "View all marketplace orders" },
                { href: "/admin", title: "Bazaar Portal", desc: "Update products, vet custom items, and track sellers" },
            ],
        },
        {
            name: "Communications",
            tiles: [
                { href: "/admin/notifications", title: "Push Notifications", desc: "Send a custom push notification to all app users" },
            ],
        },
        {
            name: "Social Moderation",
            tiles: [
                { href: "/admin-panel/social/tagging", title: "🏷 Tagging Queue", desc: "Tag untagged posts for personalization", badge: socialCounts.untagged },
                { href: "/admin-panel/social/reports", title: "⚠ Report Queue", desc: "Review flagged posts and reporter trust", badge: socialCounts.reports },
                { href: "/admin-panel/social/tags", title: "🗂 Tag Taxonomy", desc: "Add, edit, and manage content tags" },
                { href: "/admin-panel/social/posts", title: "🔍 Post Browser", desc: "Search and moderate any post" },
                { href: "/admin-panel/social/experiment", title: "🧪 A/B Experiment", desc: "Compare personalized vs. current feed" },
            ],
        },
        {
            name: "Data",
            tiles: [
                { href: "/admin-panel/whatsapp-data", title: "WhatsApp Data", desc: "View collected WhatsApp lead data" },
            ],
        },
    ];

    return (
        <>

            <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
                {/* Personal Info Box */}
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-8 relative border border-gray-200 hover:border-primary">
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

                {/* Categorized Tiles */}
                {categories.map((category) => (
                    <div key={category.name} className="mb-8">
                        <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-3">{category.name}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {category.tiles.map((tile) => (
                                <Tile key={tile.href} {...tile} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default AdminPanel;
