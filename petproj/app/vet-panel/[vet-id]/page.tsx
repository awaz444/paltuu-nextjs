"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";

interface VetPanelPageProps {
    params: {
        vetId: string;
    };
}

interface VetPanelData {
    personal_info: {
        profile_image_url: string;
        vet_name: string;
        clinic_name: string;
        location: string;
        city: string;
        contact_details: string;
        email: string;
        minimum_fee: number;
        profile_verified: boolean;
    };
    reviews_summary: {
        average_rating: number;
        total_reviews: number;
    };
    qualifications: string[];
    specializations: string[];
    schedules: { day_of_week: string; start_time: string; end_time: string }[];
}

const VetPanel = ({ params }: VetPanelPageProps) => {
    const { vetId } = params;
    const [data, setData] = useState<VetPanelData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchVetData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/vet-panel/1`);
                if (!res.ok) {
                    throw new Error(
                        `Failed to fetch vet data. Status: ${res.status}`
                    );
                }
                const responseData: VetPanelData = await res.json();
                setData(responseData);
            } catch (error) {
                console.error("Error fetching vet panel data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVetData();
    }, [vetId]);

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

    const {
        personal_info,
        reviews_summary,
        qualifications,
        specializations,
        schedules,
    } = data;

    return (
        <>
            <Navbar />
            <div className="bg-gray-100 min-h-screen px-6 py-8">
                {/* Personal Info Box */}
                <div className="bg-white shadow-lg rounded-lg p-6 mb-6 relative border border-gray-200 hover:border-[#A03048]">
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
                            src={personal_info.profile_image_url}
                            alt={personal_info.vet_name}
                        />
                        <div>
                            <p>
                                <span className="font-bold">Vet Name:</span>{" "}
                                {personal_info.vet_name}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">Clinic Name:</span>{" "}
                                {personal_info.clinic_name}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">Location:</span>{" "}
                                {personal_info.location}, {personal_info.city}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">Contact:</span>{" "}
                                {personal_info.contact_details}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">Email:</span>{" "}
                                {personal_info.email}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">Minimum Fee:</span>{" "}
                                PKR {personal_info.minimum_fee}
                            </p>
                            <p className="mt-2">
                                <span className="font-bold">
                                    Profile Verified:
                                </span>{" "}
                                <span
                                    className={`px-2 py-1 rounded ${
                                        personal_info.profile_verified
                                            ? "bg-green-200 text-green-800 border border-green-800"
                                            : "bg-red-200 text-red-800 border border-red-800"
                                    }`}>
                                    {personal_info.profile_verified
                                        ? "Yes"
                                        : "No"}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2x2 Grid for Smaller Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Qualifications */}
                    <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200 hover:border-[#A03048]">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Edit Qualifications">
                            <img src="/pen.svg" alt="Edit" />
                        </button>
                        <h4 className="text-lg font-bold text-primary mb-4">
                            Qualifications
                        </h4>
                        {qualifications.length > 0 ? (
                            <ul className="list-disc list-inside">
                                {qualifications.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No qualifications listed.</p>
                        )}
                    </div>

                    {/* Specializations */}
                    <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200 hover:border-[#A03048] border border-gray-200 hover:border-[#A03048]">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Edit Specializations">
                            <img src="/pen.svg" alt="Edit" />
                        </button>
                        <h4 className="text-lg font-bold text-primary mb-4">
                            Specializations
                        </h4>
                        {specializations.length > 0 ? (
                            <ul className="list-disc list-inside">
                                {specializations.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No specializations listed.</p>
                        )}
                    </div>

                    {/* Reviews Summary */}
                    <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200 hover:border-[#A03048] border border-gray-200 hover:border-[#A03048] border border-gray-200 hover:border-[#A03048]">
                        <div
                            className="absolute top-4 right-4 w-6 h-6"
                            title="View Reviews">
                            <img src="/arrow-right.svg" alt="Details" />
                        </div>
                        <h4 className="text-lg font-bold text-primary mb-4">
                            Reviews Summary
                        </h4>
                        <p>
                            <span className="font-bold">Average Rating:</span>{" "}
                            {reviews_summary.average_rating} / 5
                        </p>
                        <p>
                            <span className="font-bold">Total Reviews:</span>{" "}
                            {reviews_summary.total_reviews}
                        </p>
                    </div>

                    {/* Schedule */}
                    <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200 hover:border-[#A03048] border border-gray-200 hover:border-[#A03048]">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Edit Schedule">
                            <img src="/pen.svg" alt="Edit" />
                        </button>
                        <h4 className="text-lg font-bold text-primary mb-4">
                            Schedule
                        </h4>
                        {schedules.length > 0 ? (
                            <ul>
                                {schedules.map((item, index) => (
                                    <li key={index}>
                                        <span className="font-bold">
                                            {item.day_of_week}:
                                        </span>{" "}
                                        {item.start_time} - {item.end_time}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No schedule available.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default VetPanel;
