// pages/verification-info.tsx
"use client"; // Ensures this component is run on the client side

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Use 'next/navigation' instead of 'next/router' for client-side routing
import Navbar from "@/components/navbar";
import Image from "next/image";
import "./styles.css";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";

const VerificationInfoContent  = () => {

    const searchParams = useSearchParams();
    const vetId = searchParams.get("vet_id");


    if (!vetId) {
        console.error("Vet ID is missing.");
        return null;
    }

    // Convert vet_id to number
    const vetIdNumber = Number(vetId);
    if (isNaN(vetIdNumber)) {
        console.error("Invalid vet_id");
        return null;
    }

    useSetPrimaryColor();
    const router = useRouter();

    const handleStartVerification = () => {
        // Navigate to the verification page or start the process
        router.push(`/vet-get-verified-2?vet_id=${vetId}`); // Adjust the route accordingly 
    };

    return (
        <div className="min-h-screen flex">
            <div className="sm:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-r-3xl">
                <img src="/paltu_logo.svg" alt="Paltu Logo" className="mb-6" />
            </div>

            {/* Right Section (Form) - Updated for responsiveness */}
            <div className="lg:w-1/2 bg-gray-100 flex items-center justify-center px-4 py-8 lg:px-8 lg:py-12">
                <div className="w-full max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">

                    <h1 className="bold">Important: Document Upload</h1>
                    <br />
                    <p>
                        Dear Vet, you are about to be asked to upload your documents. Please ensure that you have entered your qualifications correctly in the system. This step is crucial to maintain accurate information for your profile.
                    </p>
                    <br />
                    <p>
                        As part of this step, we will request document proof for the qualifications you have listed. Please make sure you have the necessary documents ready to upload.
                    </p>
                    <br />
                    <p>
                        If you do not have proof for the qualifications you’ve provided, we recommend updating your information before proceeding. Incomplete or incorrect details may result in delays or issues in completing this step.
                    </p>
                    <br />

                    <button
                        onClick={handleStartVerification}
                        className="bg-primary text-white rounded-3xl px-4 py-2 flex items-center gap-2">
                        <span>Proceed to Upload Documents</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right text-white" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const VerificationInfo = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerificationInfoContent />
        </Suspense>
    );
};

export default VerificationInfo;

