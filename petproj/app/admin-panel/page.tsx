"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Link from "next/link";
import Image from "next/image";

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
    useSetPrimaryColor();

    useSetPrimaryColor();

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
                <div className="bg-white shadow-lg rounded-lg p-6 mb-6 relative border border-gray-200 hover:border-primary">
                    <button
                        className="absolute top-4 right-4 w-6 h-6"
                        title="Edit Personal Info">
                        <img src="/pen.svg" alt="Edit" />
                    </button>
                    <h3 className="text-xl font-bold mb-4 text-primary">
                        Admin Information
                    </h3>
                    <div className="flex gap-4">
                        <img
                            className="w-24 h-24 rounded-full shadow-md"
                            src={personal_info.profile_image_url}
                            alt={personal_info.vet_name}
                        />
                        <div>
                            <p>
                                <span className="font-bold">Name:</span>{" "}
                                {personal_info.vet_name}
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
                        </div>
                    </div>
                </div>

                {/* 2x2 Grid for Smaller Cards */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pets */}
                    <Link href="/admin-pet">
                        <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200 hover:border-primary">
                            <button
                                className="absolute top-4 right-4 w-6 h-6"
                                title="Edit Pets">
                                <img
                                    src="/arrow-right.svg"
                                    alt="Details"
                                    className="hover:text-primary"
                                />
                            </button>

                            <h4 className="text-lg font-bold text-primary mb-4">
                                Go to Pets
                            </h4>
                            {/* Content for Pets */}
                        </div>
                    </Link>

                    {/* Vets */}
                    <Link href="/admin-pet-approval">
                    <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200 hover:border-primary">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Edit Vets">
                            <img
                                src="/arrow-right.svg"
                                alt="Details"
                                className="hover:text-primary"
                            />
                        </button>
                        <h4 className="text-lg font-bold text-primary mb-4">
                            Go to Listing Approvals
                        </h4>
                        {/* Content for Vets */}
                    </div>
                    </Link>

                    {/* Users */}
                    <Link href="/admin-user">
                        <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200 hover:border-primary">
                            <div className="absolute top-4 right-4 w-6 h-6">
                                <img
                                    src="/arrow-right.svg"
                                    alt="Details"
                                    className="hover:text-primary text-primary"
                                />
                            </div>
                                <h4 className="text-lg font-bold text-primary mb-4">
                                    Go to Users
                                </h4>

                            {/* Content for Users */}
                        </div>
                    </Link>

                    {/* Verification Applications */}
                    <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200 hover:border-primary">
                        <button
                            className="absolute top-4 right-4 w-6 h-6"
                            title="Edit Verification Applications">
                            <img
                                src="/arrow-right.svg"
                                alt="Details"
                                className="hover:text-primary"
                            />
                        </button>
                        <h4 className="text-lg font-bold text-primary mb-4">
                            Go to Verification Applications
                        </h4>
                        {/* Content for Verification Applications */}
                    </div>
                </div>
            </div>
        </>
    );
};

export default VetPanel;
