"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchClinics } from "../store/slices/clinicSlice";
import ClinicGrid from "../../components/ClinicGrid";
import { MoonLoader } from "react-spinners";
import {
    FaCheckCircle,
    FaPhoneAlt,
    FaShieldAlt,
    FaMoneyBillWave,
    FaClinicMedical,
    FaUserMd,
    FaHeart,
    FaPaw
} from "react-icons/fa";
import { MdVerified, MdLocationOn } from "react-icons/md";

export default function PetCare() {
    const dispatch = useDispatch<AppDispatch>();
    const { clinics, loading, error } = useSelector(
        (state: RootState) => state.clinics
    );

    const [primaryColor, setPrimaryColor] = useState("#FBC000"); // Paltuu yellow fallback

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) setPrimaryColor(color);
    }, []);

    useEffect(() => {
        dispatch(fetchClinics());
    }, [dispatch]);

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* ================= HERO SECTION ================= */}
                <section className="mb-12">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                            <FaPaw className="text-primary" />
                            <span className="text-sm font-medium text-primary">
                                Trusted Veterinary Care Network
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Find Trusted Vets <span className="text-primary">Near You</span>
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Connect directly with verified veterinary clinics across Pakistan.
                        </p>
                    </div>

                    {/* Trust Features Grid */}
                    {/* <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                <MdVerified className="text-primary text-2xl" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Verified Clinics</h3>
                            <p className="text-sm text-gray-600">
                                All veterinary clinics are verified for quality care
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                <FaPhoneAlt className="text-primary text-xl" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Direct Contact</h3>
                            <p className="text-sm text-gray-600">
                                Connect directly with clinics via phone or WhatsApp
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                <FaMoneyBillWave className="text-primary text-xl" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">No Hidden Fees</h3>
                            <p className="text-sm text-gray-600">
                                Zero booking fees or platform charges
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                <MdLocationOn className="text-primary text-2xl" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Nationwide Coverage</h3>
                            <p className="text-sm text-gray-600">
                                Trusted pet care services across Pakistan
                            </p>
                        </div>
                    </div> */}
                </section>

                {/* ================= STATS BAR ================= */}
                {!loading && clinics.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <FaClinicMedical className="text-primary text-xl" />
                                    <div className="text-3xl font-bold text-gray-900">
                                        {clinics.length}+
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">Verified Clinics</div>
                            </div>


                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <FaHeart className="text-primary text-xl" />
                                    <div className="text-3xl font-bold text-gray-900">100%</div>
                                </div>
                                <div className="text-sm text-gray-600">Pet Care Focused</div>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <FaShieldAlt className="text-primary text-xl" />
                                    <div className="text-3xl font-bold text-gray-900">24/7</div>
                                </div>
                                <div className="text-sm text-gray-600">Support Available</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= SECTION HEADER ================= */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl text-center font-bold text-gray-900 mb-2">
                        Browse Veterinary Clinics
                    </h2>
                    <p className="text-center text-gray-600">
                        Find the perfect veterinary clinic for your pet's needs
                    </p>
                </div>

                {/* ================= CLINIC GRID ================= */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <FaPaw className="text-primary text-3xl animate-pulse" />
                            </div>
                            <MoonLoader
                                size={90}
                                color={primaryColor}
                                cssOverride={{
                                    position: 'absolute',
                                    top: '-5px',
                                    left: '-5px'
                                }}
                            />
                        </div>
                        <p className="text-gray-500 mt-6">
                            Finding the best veterinary clinics for you...
                        </p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-red-800 font-semibold mb-2">Error Loading Clinics</h3>
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : clinics.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
                        <FaClinicMedical className="text-gray-300 text-6xl mx-auto mb-4" />
                        <h3 className="text-gray-700 font-semibold mb-2">No Clinics Found</h3>
                        <p className="text-gray-500">
                            We're working on adding more veterinary clinics to your area.
                        </p>
                    </div>
                ) : (
                    <ClinicGrid clinics={clinics} />
                )}

                {/* ================= VET CTA ================= */}
                <section className="mt-20 mb-10 relative overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl border-2 border-primary/20 p-8 md:p-12 relative">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl -z-10"></div>

                        <div className="max-w-3xl mx-auto text-center relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 shadow-sm">
                                <FaClinicMedical className="text-primary" />
                                <span className="text-sm font-medium text-gray-700">
                                    For Veterinary Professionals
                                </span>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Own a Veterinary Clinic?
                            </h2>
                            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                                Join Pakistan's leading pet care network and connect with thousands of
                                pet owners searching for trusted veterinary services.
                            </p>

                            {/* Benefits List */}
                            {/* <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <FaCheckCircle className="text-green-500 text-xl mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-700">Free Listing</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <FaCheckCircle className="text-green-500 text-xl mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-700">Direct Client Contact</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <FaCheckCircle className="text-green-500 text-xl mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-700">Grow Your Practice</p>
                                </div>
                            </div> */}

                            <button
                                className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                            >
                                <FaClinicMedical />
                                List Your Clinic
                            </button>

                            <p className="text-sm text-gray-500 mt-4">
                                No setup fees • Quick approval • Start connecting today
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}