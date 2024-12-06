'use client';
import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";

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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <>
            <div style={{ padding: "20px" }}>
                <h1>Vet Verification Applications</h1>
                {vets.map((vet) => (
                    <div
                        key={vet.vet_id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "20px",
                            marginBottom: "20px",
                        }}>
                        <h2>
                            {vet.vet_name} ({vet.vet_email})
                        </h2>
                        <p>
                            <strong>Profile Verified:</strong>{" "}
                            {vet.profile_verified ? "Yes" : "No"}
                        </p>
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
