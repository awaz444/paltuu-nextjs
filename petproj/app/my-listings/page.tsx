"use client";

import { useState, useEffect, useRef } from "react";
import { Pet } from "@/components/MyListingGrid";
import MyListingGrid from "@/components/MyListingGrid";
import "./styles.css";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const ADOPTION_CHECKLIST = [
    { title: "Stable Home Environment", description: "Applicant has a stable home environment suitable for a pet", icon: "🏠" },
    { title: "Household Agreement", description: "All household members are on board with the adoption", icon: "👨‍👩‍👧" },
    { title: "Experience & Research", description: "Applicant has prior experience with pets or has done research", icon: "📋" },
    { title: "Financial Capability", description: "Financially capable of covering pet expenses (food, vet, etc.)", icon: "💳" },
    { title: "Veterinary Care", description: "Willing to provide regular vet visits and vaccinations", icon: "🏥" },
    { title: "Time Commitment", description: "Has time to properly care for and socialise with the pet", icon: "❤️" },
];

const UserListingsPage = () => {
    const { user, isAuthenticated } = useAuth();
    const [listings, setListings] = useState<Pet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [whyOpen, setWhyOpen] = useState(false);
    const lastFetchedUserId = useRef<string | null>(null);
    const isFetching = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) { setIsLoading(false); return; }
        if (isFetching.current || lastFetchedUserId.current === user.id) { setIsLoading(false); return; }

        const fetchData = async () => {
            try {
                isFetching.current = true;
                setIsLoading(true);
                const res = await fetch("/api/v1/profile/listings", { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } });
                if (!res.ok) throw new Error("Failed to fetch listings");
                const data = await res.json();
                setListings(data.listings || []);
                lastFetchedUserId.current = user.id!;
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setIsLoading(false);
                isFetching.current = false;
            }
        };
        fetchData();
    }, [user?.id, isAuthenticated]);

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-10 shadow-sm text-center max-w-sm w-full mx-4">
                    <p className="text-gray-500 mb-5 text-sm">Please log in to view your listings.</p>
                    <Link href="/auth" className="bg-primary text-white px-6 py-3 rounded-2xl font-medium inline-block">Sign In</Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-[#a03048] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-10 shadow-sm text-center max-w-sm w-full mx-4">
                    <p className="text-red-500 text-sm mb-5">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-3 rounded-2xl font-medium">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100">
            {/* Slim banner */}
            <div className="bg-white border-b border-gray-100">
                <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-6 px-4 md:px-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                    {user.name && <p className="text-gray-500 text-sm mt-0.5">Hi, <span className="font-medium text-gray-700">{user.name}</span></p>}
                </div>
            </div>

            <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-8 px-4 md:px-8">
                {listings.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 shadow-sm text-center max-w-lg mx-auto">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">No Listings Yet</h2>
                        <p className="text-gray-500 text-sm mb-6">You haven't created any adoption listings yet.</p>
                        <Link href="/create-listing" className="bg-primary text-white px-6 py-3 rounded-2xl font-medium inline-block">Create Your First Listing</Link>
                    </div>
                ) : (
                    <>
                        {/* Adoption Readiness Checklist */}
                        <div className="bg-white rounded-3xl shadow-sm mb-8">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-base font-semibold text-gray-900">Adoption Readiness Checklist</h2>
                                <p className="text-gray-500 text-sm mt-0.5">Ensure a successful adoption process for your listing</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {ADOPTION_CHECKLIST.map((item, i) => (
                                        <div key={i} className="border border-gray-100 rounded-2xl p-4 flex items-start gap-3 hover:border-primary transition-colors">
                                            <span className="text-xl flex-shrink-0 leading-none">{item.icon}</span>
                                            <div>
                                                <h3 className="font-medium text-gray-800 text-sm">{item.title}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Custom accordion */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setWhyOpen(!whyOpen)}
                                        className="flex items-center justify-between w-full text-left text-sm font-medium text-primary"
                                    >
                                        <span>Why are these checks important?</span>
                                        <svg className={`w-4 h-4 transition-transform duration-200 ${whyOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {whyOpen && (
                                        <ul className="mt-3 pl-4 space-y-2 text-sm text-gray-500 list-disc">
                                            <li>Ensures pets are placed in safe, loving, and permanent homes</li>
                                            <li>Minimises the risk of pets being returned or rehomed</li>
                                            <li>Helps match pets with owners who can properly care for them</li>
                                            <li>Ensures adopters understand the responsibilities of pet ownership</li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        <MyListingGrid pets={listings} />
                    </>
                )}
            </div>
        </main>
    );
};

export default UserListingsPage;
