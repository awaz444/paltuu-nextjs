"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchClinics } from "../store/slices/clinicSlice";
import ClinicGrid from "../../components/ClinicGrid";
import SkeletonCard, { SidebarSkeleton, MapSkeleton } from "../../components/SkeletonCard";
import dynamic from "next/dynamic";
import {
    FaClinicMedical,
    FaCheckCircle,
    FaPhoneAlt,
    FaEnvelope,
    FaSearch,
    FaArrowUp,
    FaPercentage,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";

const ClinicMap = dynamic(() => import("../../components/ClinicMap"), { ssr: false });

const ITEMS_PER_PAGE = 15;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PetCare() {
    const dispatch = useDispatch<AppDispatch>();
    const { clinics, loading, error } = useSelector(
        (state: RootState) => state.clinics
    );

    const [cityFilter, setCityFilter] = useState("Karachi");
    const [searchQuery, setSearchQuery] = useState("");
    const [partnerFilter, setPartnerFilter] = useState(false);
    const [verifiedFilter, setVerifiedFilter] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [sortedByDistance, setSortedByDistance] = useState(false);

    useEffect(() => {
        dispatch(fetchClinics());
    }, [dispatch]);

    // Attempt geolocation on mount
    useEffect(() => {
        if (typeof window !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setSortedByDistance(true);
                    // Switch city filter to All so distance sort applies across cities
                    setCityFilter("All");
                },
                () => {
                    // Permission denied or unavailable — keep default city sort
                }
            );
        }
    }, []);

    // Reset page on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [cityFilter, searchQuery, partnerFilter, verifiedFilter, sortedByDistance]);

    useEffect(() => {
        const toggleVisibility = () => setShowBackToTop(window.scrollY > 400);
        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        const el = document.getElementById("clinics-listings-start");
        if (el) el.scrollIntoView({ behavior: "smooth" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const availableCities = Array.from(
        new Set(clinics.map((c) => c.city).filter(Boolean))
    ) as string[];

    // Filter
    const filteredClinics = clinics.filter((clinic) => {
        if (cityFilter && cityFilter !== "All" && clinic.city?.toLowerCase() !== cityFilter.toLowerCase()) {
            return false;
        }
        if (partnerFilter && !clinic.is_paltuu_partner) {
            return false;
        }
        if (verifiedFilter && !clinic.is_verified) {
            return false;
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!clinic.name?.toLowerCase().includes(q) && !clinic.address?.toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });

    // Sort: nearest-first if geolocation granted, else by rating (API default order preserved)
    const sortedClinics = sortedByDistance && userCoords
        ? [...filteredClinics].sort((a, b) => {
            const hasA = a.latitude != null && a.longitude != null;
            const hasB = b.latitude != null && b.longitude != null;
            if (!hasA && !hasB) return 0;
            if (!hasA) return 1;
            if (!hasB) return -1;
            return (
                haversineKm(userCoords.lat, userCoords.lng, a.latitude!, a.longitude!) -
                haversineKm(userCoords.lat, userCoords.lng, b.latitude!, b.longitude!)
            );
        })
        : filteredClinics;

    const totalPages = Math.ceil(sortedClinics.length / ITEMS_PER_PAGE);
    const displayedClinics = sortedClinics.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const resetFilters = () => {
        setCityFilter("All");
        setSearchQuery("");
        setPartnerFilter(false);
        setVerifiedFilter(false);
        setSortedByDistance(false);
        setUserCoords(null);
    };

    const hasActiveFilters = cityFilter !== "Karachi" || searchQuery !== "" || partnerFilter || verifiedFilter || sortedByDistance;

    return (
        <main className="min-h-screen bg-gray-100">
            {/* Visually hidden h1 — SEO signal without disrupting layout */}
            <h1 className="sr-only">Find Veterinary Clinics &amp; Pet Care Near You in Pakistan</h1>

            {/* ===== SLIM HERO BANNER ===== */}
            <div className="bg-white border-b border-gray-100">
                <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-6 px-4 md:px-8">
                    <p className="text-gray-500 text-sm text-center">
                        Pakistan&apos;s trusted vet network
                        {!loading && clinics.length > 0 && (
                            <span className="ml-1 font-semibold text-[#a03048]">— {clinics.length}+ verified clinics</span>
                        )}
                    </p>
                </div>
            </div>

            {/* ===== MAP ===== */}
            {!error && (
                <div className="hidden lg:block" style={{ maxWidth: "90%", margin: "0 auto" }}>
                    <div className="mx-0 md:mx-8 mt-6 rounded-3xl overflow-hidden shadow-sm" style={{ isolation: "isolate" }}>
                        {loading || clinics.length === 0 ? (
                            <MapSkeleton />
                        ) : (
                            <ClinicMap clinics={filteredClinics} userCoords={userCoords} />
                        )}
                    </div>
                </div>
            )}

            {/* ===== CLINICS SECTION ===== */}
            <section id="clinics-listings-start" className="scroll-mt-6" style={{ maxWidth: "90%", margin: "0 auto" }}>
                <div className="flex mx-0 md:mx-8 mt-6 pb-16 items-start">

                    {/* Vertical Sidebar — desktop only, matches Browse Pets & Lost & Found */}
                    {!error && (
                        <div className="w-1/4 mr-4 vertical-search-bar hidden lg:block">
                            {loading || clinics.length === 0 ? <SidebarSkeleton /> :
                            <div className="bg-white shadow-sm p-6 rounded-3xl sticky top-4">

                                {/* Search */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Search</label>
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                        <input
                                            type="text"
                                            placeholder="Clinic name or address..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="border rounded-xl w-full p-3 pl-9 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* City */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">City</label>
                                    <select
                                        value={cityFilter}
                                        onChange={(e) => { setCityFilter(e.target.value); setSortedByDistance(false); }}
                                        className="border rounded-xl w-full p-3"
                                    >
                                        <option value="All">All Cities</option>
                                        <option value="Karachi">Karachi</option>
                                        <option value="Lahore">Lahore</option>
                                        <option value="Islamabad">Islamabad</option>
                                        <option value="Rawalpindi">Rawalpindi</option>
                                        {availableCities
                                            .filter((c) => !["karachi", "lahore", "islamabad", "rawalpindi"].includes(c.toLowerCase()))
                                            .map((city) => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                    </select>
                                </div>

                                {/* Discounts */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Discounts</label>
                                    <button
                                        onClick={() => setPartnerFilter(!partnerFilter)}
                                        className={`w-full p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border-2 ${
                                            partnerFilter
                                                ? "bg-primary text-white border-primary"
                                                : "border-primary text-primary bg-white"
                                        }`}
                                    >
                                        <FaPercentage className="text-xs" />
                                        Paltuu Discounts Only
                                    </button>
                                </div>

                                {/* Verified */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Verified</label>
                                    <button
                                        onClick={() => setVerifiedFilter(!verifiedFilter)}
                                        className={`w-full p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border-2 ${
                                            verifiedFilter
                                                ? "bg-primary text-white border-primary"
                                                : "border-primary text-primary bg-white"
                                        }`}
                                    >
                                        <MdVerified className="text-sm" />
                                        Verified Clinics Only
                                    </button>
                                </div>

                                {/* Reset */}
                                <div className="flex flex-col gap-3 mt-4">
                                    <button
                                        className="border-2 border-primary text-primary bg-white p-3 rounded-xl"
                                        onClick={resetFilters}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        }
                        </div>
                    )}

                    {/* Main content */}
                    <div className="w-full lg:w-3/4">

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonCard key={i} variant="clinic" />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-10 text-center">
                                <div className="text-4xl mb-3">⚠️</div>
                                <h3 className="text-red-700 font-semibold text-lg mb-1">Error Loading Clinics</h3>
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        ) : clinics.length === 0 ? (
                            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
                                <FaClinicMedical className="text-gray-200 text-6xl mx-auto mb-5" />
                                <h3 className="text-gray-700 font-semibold text-xl mb-2">No Clinics Found</h3>
                                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                                    We&apos;re working on adding more veterinary clinics to your area. Check back soon!
                                </p>
                            </div>
                        ) : sortedClinics.length === 0 ? (
                            <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center">
                                <FaClinicMedical className="text-[#a03048]/20 text-5xl mb-5" />
                                <h3 className="text-gray-950 font-bold text-xl mb-2">No Matches Found</h3>
                                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                                    No clinics match your current filters. Try resetting to browse all options.
                                </p>
                                <button
                                    onClick={resetFilters}
                                    className="px-6 py-2.5 bg-[#a03048] hover:bg-[#8a2940] text-white rounded-xl text-sm font-semibold transition-all"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <ClinicGrid clinics={displayedClinics} />

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center mt-10 mb-6 space-x-2 flex-wrap">
                                        <button
                                            onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); scrollToTop(); }}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                                            if (totalPages > 7) {
                                                if (num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1)) {
                                                    // show
                                                } else if (num === currentPage - 2 || num === currentPage + 2) {
                                                    return <span key={num} className="px-2">...</span>;
                                                } else {
                                                    return null;
                                                }
                                            }
                                            return (
                                                <button
                                                    key={num}
                                                    onClick={() => { setCurrentPage(num); scrollToTop(); }}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
                                                        currentPage === num
                                                            ? "bg-primary text-white shadow-md font-bold"
                                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); scrollToTop(); }}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="pb-20" style={{ maxWidth: "90%", margin: "0 auto" }}>
                <div className="mx-0 md:mx-8 relative overflow-hidden rounded-3xl bg-[#a03048] px-8 md:px-16 py-14">
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />

                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-full text-sm font-semibold mb-5">
                            <FaClinicMedical />
                            For Veterinary Professionals
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                            Own a Veterinary Clinic?
                            <br />
                            <span className="text-white/80">Join Our Network Today.</span>
                        </h2>
                        <p className="text-white/70 text-base mb-8 max-w-lg leading-relaxed">
                            Join Pakistan&apos;s leading pet care network and connect with thousands of pet owners searching for trusted veterinary services. Free listing, quick approval, and direct client contact.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center text-white/80 text-sm">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                    <FaPhoneAlt className="text-xs" />
                                </div>
                                <a href="tel:+923394022468" className="hover:text-white transition-colors">
                                    +92 339 4022468
                                </a>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                    <FaEnvelope className="text-xs" />
                                </div>
                                <a href="mailto:contact@paltuu.pk" className="hover:text-white transition-colors">
                                    contact@paltuu.pk
                                </a>
                            </div>
                        </div>

                        <p className="text-white/50 text-xs mt-8">
                            No setup fees • Quick approval • Start connecting today
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== BROWSE BY CITY — SEO ===== */}
            <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-8 px-4 md:px-8">
                <div className="mx-0 md:mx-8">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Browse vets by city</p>
                    <div className="flex flex-wrap gap-2">
                        {["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"].map((city) => (
                            <a
                                key={city}
                                href={`/pet-care/${city.toLowerCase()}`}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 hover:text-primary hover:border-primary transition-colors shadow-sm"
                            >
                                Vets in {city}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-8 z-50 bg-[#a03048] hover:bg-[#8a2940] text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center text-lg border border-white/20"
                    title="Back to Top"
                >
                    <FaArrowUp />
                </button>
            )}
        </main>
    );
}
