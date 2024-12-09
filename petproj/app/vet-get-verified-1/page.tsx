// pages/verification-info.tsx
"use client"; // Ensures this component is run on the client side

import React from "react";
import { useRouter } from "next/navigation"; // Use 'next/navigation' instead of 'next/router' for client-side routing
import Navbar from "@/components/navbar";
import Image from "next/image";
import "./styles.css";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";

const VerificationInfo = () => {
    useSetPrimaryColor();
    const router = useRouter();

    const handleStartVerification = () => {
        // Navigate to the verification page or start the process
        router.push("/vet-get-verified-2"); // Adjust the route accordingly
    };

    return (
        <>
            <Navbar></Navbar>

            <div className="verification-info-container min-h-screen">
                <div className="mt-4">
                    <h1>Important: Verification Process</h1>
                    <p>
                        Dear Vet, you are about to start your verification
                        process. Please make sure that you have entered your
                        qualifications correctly in the system. This is an
                        important step to ensure we have the most accurate
                        information for your profile.
                    </p>
                    <p>
                        As part of the verification process, we will be asking
                        for document proof of the qualifications you claim to
                        have. Please ensure that you have the necessary
                        documents available and ready to upload.
                    </p>
                    <p>
                        If you do not have proof of the qualifications you
                        listed, please make sure to update your information
                        before proceeding. Incomplete or incorrect qualification
                        details may result in a delay or failure to complete
                        your verification.
                    </p>
                    <button
                        onClick={handleStartVerification}
                        className="bg-primary text-white rounded-3xl px-4 py-2 flex items-center gap-2">
                        <span>Start Verification Process</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right text-white" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
</svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default VerificationInfo;
