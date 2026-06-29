"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchClinics } from "../store/slices/clinicSlice";
import ClinicGrid from "../../components/ClinicGrid";
import {
    FaClinicMedical,
    FaUserMd,
    FaHeart,
    FaShieldAlt,
    FaPaw,
    FaStar,
    FaMapMarkerAlt,
    FaCheckCircle,
    FaPhoneAlt,
    FaEnvelope,
    FaSearch,
    FaChevronDown,
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaArrowUp,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

export default function PetCare() {
    const dispatch = useDispatch<AppDispatch>();
    const { clinics, loading, error } = useSelector(
        (state: RootState) => state.clinics
    );

    const [cityFilter, setCityFilter] = useState("Karachi");
    const [searchQuery, setSearchQuery] = useState("");
    const [partnerFilter, setPartnerFilter] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        dispatch(fetchClinics());
    }, [dispatch]);

    // Reset visibleCount count when any filter changes
    useEffect(() => {
        setVisibleCount(12);
    }, [cityFilter, searchQuery, partnerFilter]);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 400) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        const element = document.getElementById("clinics-listings-start");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Gather available cities from clinic data dynamically
    const availableCities = Array.from(
        new Set(clinics.map((c) => c.city).filter(Boolean))
    ) as string[];

    // Filtering logic
    const filteredClinics = clinics.filter((clinic) => {
        // City filter (defaults to Karachi, "All" bypasses)
        if (
            cityFilter &&
            cityFilter !== "All" &&
            clinic.city?.toLowerCase() !== cityFilter.toLowerCase()
        ) {
            return false;
        }



        // Paltuu Partner filter
        if (partnerFilter && !clinic.is_paltuu_partner) {
            return false;
        }

        // Text search (name or address)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const nameMatch = clinic.name?.toLowerCase().includes(query);
            const addressMatch = clinic.address?.toLowerCase().includes(query);
            if (!nameMatch && !addressMatch) {
                return false;
            }
        }

        return true;
    });

    // Intersection Observer for seamless lazy loading
    useEffect(() => {
        if (loading || visibleCount >= filteredClinics.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => prev + 12);
                }
            },
            { rootMargin: "800px" } // Trigger loading when the user reaches the second-to-last row (approx 800px from the bottom)
        );

        const target = document.getElementById("lazy-load-trigger");
        if (target) {
            observer.observe(target);
        }

        return () => {
            if (target) {
                observer.unobserve(target);
            }
        };
    }, [visibleCount, filteredClinics.length, loading]);

    const displayedClinics = filteredClinics.slice(0, visibleCount);

    const stats = [
        { icon: <FaClinicMedical />, value: `${clinics.length || "10"}+`, label: "Verified Clinics" },
        { icon: <FaUserMd />, value: "50+", label: "Expert Vets" },
        { icon: <FaStar />, value: "4.8", label: "Avg. Rating" },
        { icon: <FaHeart />, value: "100%", label: "Pet-Focused" },
    ];

    return (
        <main className="min-h-screen bg-[#f0f0f0]">

            {/* ================= HERO SECTION ================= */}
            <section className="relative overflow-hidden bg-white border-b border-[#a03048]/10">
                {/* Background decorative blobs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#a03048]/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#a03048]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">

                        {/* Left: Text Content */}
                        <div>
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-[#a03048]/10 text-[#a03048] px-4 py-2 rounded-full text-sm font-semibold mb-6">
                                <HiSparkles className="text-base" />
                                Pakistan's Trusted Vet Network
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111827] leading-tight mb-5">
                                Find the Right Vet{" "}
                                <span
                                    className="relative"
                                    style={{ color: "#a03048" }}
                                >
                                    Near You
                                    <svg
                                        className="absolute -bottom-2 left-0 w-full"
                                        viewBox="0 0 300 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M2 9C72 3 164 1 298 9"
                                            stroke="#a03048"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                            </h1>

                            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
                                Browse verified veterinary clinics across Pakistan. Book directly, zero platform fees, real reviews from real pet owners.
                            </p>

                            {/* Trust Chips */}
                            <div className="flex flex-wrap gap-3">
                                {[
                                    "Verified Clinics",
                                    "Direct Contact",
                                    "No Hidden Fees",
                                ].map((chip) => (
                                    <div
                                        key={chip}
                                        className="flex items-center gap-1.5 bg-white border border-[#a03048]/20 text-[#a03048] text-sm font-medium px-4 py-2 rounded-full shadow-sm"
                                    >
                                        <FaCheckCircle className="text-xs" />
                                        {chip}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Feature Cards Stack */}
                        <div className="hidden lg:grid grid-cols-2 gap-4">
                            {[
                                {
                                    icon: <FaShieldAlt className="text-[#a03048] text-2xl" />,
                                    title: "Verified & Trusted",
                                    desc: "Every clinic is manually reviewed and verified by our team.",
                                },
                                {
                                    icon: <FaMapMarkerAlt className="text-[#a03048] text-2xl" />,
                                    title: "Instant Booking",
                                    desc: "Skip the wait—book appointments and manage visits instantly on call.",
                                },
                                {
                                    icon: <FaUserMd className="text-[#a03048] text-2xl" />,
                                    title: "Expert Veterinarians",
                                    desc: "Connect with qualified and experienced vet professionals.",
                                },
                                {
                                    icon: <FaHeart className="text-[#a03048] text-2xl" />,
                                    title: "Pet-First Always",
                                    desc: "Our platform is designed with your pet's wellbeing in mind.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#a03048]/20 transition-all duration-300"
                                >
                                    <div className="w-11 h-11 bg-[#a03048]/10 rounded-xl flex items-center justify-center mb-3">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-semibold text-[#111827] text-sm mb-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-500 text-xs leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FLOATING STATS BAR ================= */}
            {/*
            {!loading && clinics.length > 0 && (
                <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-10">
                    <div className="bg-white rounded-2xl shadow-xl border border-[#a03048]/10 px-6 py-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
                            {stats.map((stat, i) => (
                                <div key={i} className="flex flex-col items-center justify-center px-4 py-1 gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#a03048]">{stat.icon}</span>
                                        <span className="text-2xl font-bold text-[#111827]">
                                            {stat.value}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )} */}

            {/* ================= CLINICS SECTION ================= */}
            <section id="clinics-listings-start" className="max-w-[1600px] mx-auto px-4 lg:px-8 py-16 scroll-mt-6">
                <div className={`grid gap-8 items-start ${
                    (!loading && !error && clinics.length > 0)
                        ? "lg:grid-cols-[280px_1fr]"
                        : "grid-cols-1"
                }`}>
                    {/* Sticky Sidebar on Desktop */}
                    {!loading && !error && clinics.length > 0 && (
                        <div className="lg:sticky lg:top-24 z-20">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-950 text-lg mb-4">Filters</h3>
                                
                                <div className="space-y-5">
                                    {/* Search Bar */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search</label>
                                        <div className="relative">
                                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                            <input
                                                type="text"
                                                placeholder="Search name or address..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#a03048] focus:bg-white transition-all text-gray-800"
                                            />
                                        </div>
                                    </div>

                                    {/* City Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">City</label>
                                        <div className="relative">
                                            <select
                                                value={cityFilter}
                                                onChange={(e) => setCityFilter(e.target.value)}
                                                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#a03048] focus:bg-white transition-all appearance-none cursor-pointer text-gray-800"
                                            >
                                                <option value="All">All Cities</option>
                                                <option value="Karachi">Karachi</option>
                                                <option value="Lahore">Lahore</option>
                                                <option value="Islamabad">Islamabad</option>
                                                <option value="Rawalpindi">Rawalpindi</option>
                                                {availableCities
                                                    .filter(
                                                        (c) =>
                                                            ![
                                                                "karachi",
                                                                "lahore",
                                                                "islamabad",
                                                                "rawalpindi",
                                                            ].includes(c.toLowerCase())
                                                    )
                                                    .map((city) => (
                                                        <option key={city} value={city}>
                                                            {city}
                                                        </option>
                                                    ))}
                                            </select>
                                            <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Quick Cities */}
                                    <div className="space-y-1.5 pt-3 border-t border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Cities</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {["Karachi", "Lahore", "Islamabad", "All"].map((city) => (
                                                <button
                                                    key={city}
                                                    onClick={() => setCityFilter(city)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                        cityFilter === city
                                                            ? "bg-[#a03048] text-white shadow-sm"
                                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    {city === "All" ? "All" : city}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Partner Filter */}
                                    <div className="pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => setPartnerFilter(!partnerFilter)}
                                            className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                partnerFilter
                                                    ? "bg-amber-500 text-white shadow-sm"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        >
                                            <FaCheckCircle className="text-sm" />
                                            Paltuu Partner Only
                                        </button>
                                    </div>

                                    {/* Clear Filters */}
                                    {(cityFilter !== "Karachi" ||
                                        searchQuery !== "" ||
                                        partnerFilter) && (
                                        <button
                                            onClick={() => {
                                                setCityFilter("All");
                                                setSearchQuery("");
                                                setPartnerFilter(false);
                                            }}
                                            className="w-full py-2.5 rounded-2xl text-xs font-bold text-[#a03048] hover:bg-[#a03048]/5 transition-all flex items-center justify-center gap-1.5 border border-dashed border-[#a03048]/20"
                                        >
                                            <FaTimes />
                                            Reset Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Listings Grid */}
                    <div className="w-full">
                        {/* Clinic Grid / States */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-12 h-12 border-4 border-[#a03048]/20 border-t-[#a03048] rounded-full animate-spin" />
                                <p className="text-gray-500 text-sm font-medium">
                                    Loading clinics...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-10 text-center">
                                <div className="text-4xl mb-3">⚠️</div>
                                <h3 className="text-red-700 font-semibold text-lg mb-1">
                                    Error Loading Clinics
                                </h3>
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        ) : clinics.length === 0 ? (
                            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
                                <FaClinicMedical className="text-gray-200 text-6xl mx-auto mb-5" />
                                <h3 className="text-gray-700 font-semibold text-xl mb-2">
                                    No Clinics Found
                                </h3>
                                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                                    We're working on adding more veterinary clinics to your area. Check back soon!
                                </p>
                            </div>
                        ) : filteredClinics.length === 0 ? (
                            <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-[#a03048]/5 flex items-center justify-center mb-5 text-[#a03048]">
                                    <FaClinicMedical className="text-2xl" />
                                </div>
                                <h3 className="text-gray-950 font-bold text-xl mb-2">
                                    No Matches Found
                                </h3>
                                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                                    We couldn't find any veterinary clinics matching your selected filters or search query. Try resetting your filters to browse all options.
                                </p>
                                <button
                                    onClick={() => {
                                        setCityFilter("All");
                                        setSearchQuery("");
                                        setPartnerFilter(false);
                                    }}
                                    className="px-6 py-2.5 bg-[#a03048] hover:bg-[#8a2940] text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <ClinicGrid clinics={displayedClinics} />

                                {/* Lazy Loading spinner / trigger */}
                                <div id="lazy-load-trigger" className="w-full">
                                    {visibleCount < filteredClinics.length && (
                                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                                            <div className="w-8 h-8 border-4 border-[#a03048]/20 border-t-[#a03048] rounded-full animate-spin" />
                                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                                Scrolling to load more clinics...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ================= CTA SECTION ================= */}
            <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
                <div className="relative overflow-hidden rounded-3xl bg-[#a03048] px-8 md:px-16 py-14">
                    {/* Decorative Circles */}
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
                    <div className="absolute top-8 right-40 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />

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
                            Join Pakistan's leading pet care network and connect with thousands of pet owners searching for trusted veterinary services. Free listing, quick approval, and direct client contact.
                        </p>

                        {/* <div className="flex flex-wrap gap-4 mb-8">
                            <a
                                href="https://wa.me/923394022468"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white text-[#a03048] hover:bg-white/90 transition-all px-8 py-3.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform inline-flex items-center gap-2"
                            >
                                <FaClinicMedical />
                                List Your Clinic
                            </a>
                            <a
                                href="mailto:contact@paltuu.pk"
                                className="bg-white/10 hover:bg-white/20 transition-all text-white border border-white/20 px-8 py-3.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2"
                            >
                                <FaEnvelope />
                                Contact Us
                            </a>
                        </div> */}

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

            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-8 z-50 bg-[#a03048] hover:bg-[#8a2940] text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center text-lg border border-white/20 animate-fade-in"
                    title="Back to Top"
                >
                    <FaArrowUp />
                </button>
            )}
        </main>
    );
}