'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar';

interface Application {
    adoption_id: number;
    user_id: number;
    pet_name: string;
    pet_id: number;
    adopter_name: string;
    adopter_address: string;
    created_at: string;
    status: string;
    age_of_youngest_child: string | null;
    other_pets_details: string | null;
    other_pets_neutered: boolean | null;
    has_secure_outdoor_area: boolean | null;
    pet_sleep_location: string | null;
    pet_left_alone: string | null;
    additional_details: string | null;
    agree_to_terms: boolean;
}

const AdoptionApplications = () => {
    const searchParams = useSearchParams();
    const petId = searchParams.get('pet_id');
    const [applications, setApplications] = useState<Application[] | null>(null);
    const [expandedApplication, setExpandedApplication] = useState<number | null>(null);


    useEffect(() => {
        if (!petId) return;

        const fetchApplications = async () => {
            try {
                const response = await fetch(`/api/adoption_application/${petId}`);
                if (response.ok) {
                    const data = await response.json();
                    setApplications(Array.isArray(data) ? data : [data]);
                } else if (response.status === 404) {
                    console.error('No applications found for the given pet ID.');
                    setApplications([]); // Set applications to an empty array for 404
                } else {
                    console.error('Failed to fetch applications:', response.statusText);
                    setApplications(null); // Optionally handle other errors
                }
            } catch (error) {
                console.error('Error fetching applications:', error);
                setApplications(null); // Handle network or unexpected errors
            }
        };
        

        fetchApplications();
    }, [petId]);

    const handleApprove = async (fosterId: number) => {
        try {
            // Call the API to approve the foster application
            const response = await fetch(`/api/accept-adoption-application/${fosterId}`, {
                method: 'POST',
            });

            if (response.ok) {
                // Handle successful approval
                // Assuming you have a list of applications, you can update the list or remove the approved application.
                setApplications((prev) =>
                    prev ? prev.filter((app) => app.adoption_id !== fosterId) : []
                );
                console.log(`Foster application with ID ${fosterId} has been approved.`);
            } else {
                // Handle API error
                const errorData = await response.json();
                console.error('Failed to approve foster application:', errorData.error || response.statusText);
            }
        } catch (error) {
            console.error('Error approving foster application:', error);
        }
    };

    const handleReject = async (adoptionId: number) => {
        try {
            console.log(adoptionId);
            const response = await fetch(`/api/reject-adoption-application/${adoptionId}`, {
                method: 'POST',
            });
            if (response.ok) {
                setApplications((prev) =>
                    prev ? prev.filter((app) => app.adoption_id !== adoptionId) : null
                );
            } else {
                console.error('Failed to reject application:', response.statusText);
            }
        } catch (error) {
            console.error('Error rejecting application:', error);
        }
    };

    const handleExpand = (fosterId: number) => {
        setExpandedApplication(expandedApplication === fosterId ? null : fosterId);
    };

    if (!petId) {
        return <div className="text-center text-red-600 font-bold mt-6">Invalid Pet ID</div>;
    }

    return (
        <>
            <Navbar></Navbar>
            <div className="max-w-5xl min-h-screen mx-auto p-6 bg-gray-50 rounded-3xl shadow-lg">
    {applications ? (
        applications.length > 0 ? (
            <ul className="space-y-6">
                {applications.map((app) => (
                    <li
                        key={app.adoption_id}
                        className={`p-6 bg-gradient-to-r from-white to-gray-100 border-2 ${
                            expandedApplication === app.adoption_id ? "border-primary" : "border-primary"
                        } rounded-xl shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg`}
                        onClick={() => handleExpand(app.adoption_id)}
                    >
                        {/* Application Header */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Adopter: {app.adopter_name}</h2>
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    app.status === "Approved"
                                        ? "bg-green-100 text-green-800"
                                        : app.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                            >
                                {app.status}
                            </span>
                        </div>

                        {/* Accordion Content */}
                        {expandedApplication === app.adoption_id && (
                            <div className="mt-4 grid grid-cols-2 gap-6 text-gray-700 border-t border-gray-200 pt-4">
                                <p>
                                    <strong className="font-medium">Address:</strong> {app.adopter_address}
                                </p>
                                <p>
                                    <strong className="font-medium">Application Date:</strong>{" "}
                                    {new Date(app.created_at).toLocaleDateString()}
                                </p>
                                <p>
                                    <strong className="font-medium">Youngest Child Age:</strong>{" "}
                                    {app.age_of_youngest_child || "Not Provided"}
                                </p>
                                <p>
                                    <strong className="font-medium">Other Pets Details:</strong>{" "}
                                    {app.other_pets_details || "Not Provided"}
                                </p>
                                <p>
                                    <strong className="font-medium">Other Pets Neutered:</strong>{" "}
                                    {app.other_pets_neutered ? "Yes" : "No"}
                                </p>
                                <p>
                                    <strong className="font-medium">Secure Outdoor Area:</strong>{" "}
                                    {app.has_secure_outdoor_area ? "Yes" : "No"}
                                </p>
                                <p>
                                    <strong className="font-medium">Pet Sleep Location:</strong>{" "}
                                    {app.pet_sleep_location || "Not Provided"}
                                </p>
                                <p>
                                    <strong className="font-medium">Pet Left Alone:</strong>{" "}
                                    {app.pet_left_alone || "Not Provided"}
                                </p>
                                <p className="col-span-2">
                                    <strong className="font-medium">Additional Details:</strong>{" "}
                                    {app.additional_details || "Not Provided"}
                                </p>
                                <p className="col-span-2">
                                    <strong className="font-medium">Agreed to Terms:</strong>{" "}
                                    {app.agree_to_terms ? "Yes" : "No"}
                                </p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(app.adoption_id);
                                }}
                                className={`px-6 py-2 font-medium text-sm rounded-lg ${
                                    app.status === "Approved"
                                        ? "bg-white text-primary bordder border-primary"
                                        : "bg-primary text-white"
                                } transition-all`}
                                disabled={app.status === "Approved"}
                            >
                                Approve
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(app.adoption_id);
                                }}
                                className={`px-6 py-2 font-medium text-sm rounded-lg ${
                                    app.status === "Rejected"
                                        ? "bg-primary text-white cursor-not-allowed"
                                        : "bg-white text-primary border border-primary"
                                } transition-all`}
                                disabled={app.status === "Rejected"}
                            >
                                Reject
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-700 text-center text-lg">No applications found for this pet.</p>
        )
    ) : (
        <p className="text-gray-700 text-center text-lg">Loading applications...</p>
    )}
</div>


        </>
    );
};

const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-500">Loading specializations...</p>
    </div>

);
const AdoptionApplicants = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <AdoptionApplications />
        </Suspense>
    );
}

export default AdoptionApplicants;
