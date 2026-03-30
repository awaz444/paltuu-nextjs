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
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

export default function PetCare() {
    const dispatch = useDispatch<AppDispatch>();
    const { clinics, loading, error } = useSelector(
        (state: RootState) => state.clinics
    );

    useEffect(() => {
        dispatch(fetchClinics());
    }, [dispatch]);

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
            <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                {/* Section Header */}
                {/* <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-white text-[#a03048] px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <FaPaw className="text-xs" />
                        All Clinics
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-3">
                        Browse Veterinary Clinics
                    </h2>
                    <p className="text-gray-500 text-base max-w-xl mx-auto">
                        Find the perfect veterinary clinic for your pet's needs across Pakistan.
                    </p>
                </div> */}

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
                ) : (
                    <ClinicGrid clinics={clinics} />
                )}
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

        </main>
    );
}