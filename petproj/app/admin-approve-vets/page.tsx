"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";

interface Qualification {
    qualification_id: number;
    year_acquired: number;
    note: string;
    images: string[];
}

interface Vet {
    vet_id: number;
    vet_name: string;
    vet_email: string;
    profile_verified: boolean;
    qualifications: Qualification[];
}

const VetVerificationPage = () => {
    const [vets, setVets] = useState<Vet[]>([]); // State to hold vet data
    const [loading, setLoading] = useState<boolean>(true); // Loading state
    const [error, setError] = useState<string | null>(null); // Error state

    useSetPrimaryColor();

    // Fetch data from API
    useEffect(() => {
        const fetchVets = async () => {
            try {
                const response = await fetch(
                    "/api/vets-applied-for-verification"
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch vet data");
                }
                const data = await response.json();
                setVets(data.vets);
            } catch (error) {
                setError(
                    error instanceof Error ? error.message : "An error occurred"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchVets();
    }, []); // Empty dependency array means this runs once when the component mounts

    // Button functions
    const handleAccept = async (vetId: number) => {
        try {
            const response = await fetch("/api/admin-verify-vet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ vet_id: vetId }),
            });

            if (!response.ok) {
                throw new Error("Failed to verify vet profile");
            }

            const data = await response.json();
            console.log(data.message);

            // Update the vet list to reflect the changes
            setVets((prevVets) =>
                prevVets.map((vet) =>
                    vet.vet_id === vetId
                        ? { ...vet, profile_verified: true }
                        : vet
                )
            );
        } catch (error) {
            console.error(
                error instanceof Error ? error.message : "An unexpected error occurred"
            );
            alert("Failed to approve vet verification.");
        }
    };

        const handleReject = async (vetId: number) => {
            try {
                const response = await fetch("/api/admin-reject-vet", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ vet_id: vetId }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to reject vet application");
                }

                const data = await response.json();
                console.log(`Rejected vet with ID: ${vetId}`);
                console.log("Response:", data.message);

                // Optional: Update state or UI to reflect the rejection
                alert(`Vet application for ID ${vetId} has been rejected successfully.`);
            } catch (error) {
                console.error("Error rejecting vet application:", error);
                alert(`Failed to reject vet application for ID ${vetId}.`);
            }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <>
            <Navbar />
            <div style={{ padding: "20px" }}>
                {vets.map((vet) => (
                    <div
                        key={vet.vet_id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "20px",
                            marginBottom: "20px",
                        }}>
                        <div className="flex flex-row gap-10">
                            <div className="flex flex-col">
                                <h2>
                                    {vet.vet_name} ({vet.vet_email})
                                </h2>
                                <p>
                                    <strong>Profile Verified:</strong>{" "}
                                    {vet.profile_verified ? "Yes" : "No"}
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleAccept(vet.vet_id)}
                                    className="hover:opacity-75"
                                    aria-label="Accept Review">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-6 h-6 text-primary">
                                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 22 6 20.6 4.6z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleReject(vet.vet_id)}
                                    className="hover:opacity-75"
                                    aria-label="Reject Review">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-6 h-6 text-primary">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13l-1.41 1.41L12 13.41 8.41 16.41 7 15l3.59-3.59L7 8.41 8.41 7l3.59 3.59L15.59 7 17 8.41l-3.59 3.59L17 15z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <h3>Qualifications:</h3>
                        {vet.qualifications.map((qualification) => (
                            <div
                                key={qualification.qualification_id}
                                style={{
                                    border: "1px solid #ccc",
                                    borderRadius: "8px",
                                    padding: "15px",
                                    margin: "10px 0",
                                }}>
                                <p>
                                    <strong>Qualification ID:</strong>{" "}
                                    {qualification.qualification_id}
                                </p>
                                <p>
                                    <strong>Year Acquired:</strong>{" "}
                                    {qualification.year_acquired}
                                </p>
                                <p>
                                    <strong>Note:</strong> {qualification.note}
                                </p>
                                <h4>Images:</h4>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                    }}>
                                    {qualification.images.map(
                                        (image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Qualification ${
                                                    qualification.qualification_id
                                                } - Proof ${index + 1}`}
                                                style={{
                                                    width: "150px",
                                                    height: "150px",
                                                    objectFit: "cover",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
};

export default VetVerificationPage;
