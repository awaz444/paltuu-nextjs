'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';
import Navbar from '@/components/navbar';

interface FosterApplication {
    foster_id: number;
    user_id: number;
    pet_name:string;
    pet_id: number;
    fosterer_name: string;
    fosterer_address: string;
    foster_start_date: string | null;
    foster_end_date: string | null;
    created_at: string;
    status: string;
    fostering_experience: string;
    age_of_youngest_child: number | null;
    other_pets_details: string;
    other_pets_neutered: boolean;
    has_secure_outdoor_area: boolean;
    pet_sleep_location: string;
    pet_left_alone: string;
    time_at_home: string;
    reason_for_fostering: string;
    additional_details: string;
    agree_to_terms: boolean;
}

const FosterApplications = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const petId = searchParams.get('pet_id');
    const [applications, setApplications] = useState<FosterApplication[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [expandedApplication, setExpandedApplication] = useState<number | null>(null);
    useSetPrimaryColor();

    useEffect(() => {
        if (!petId) return;

        const fetchApplications = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/foster_application/${petId}`);
                if (response.ok) {
                    const data = await response.json();
                     setApplications(data);
                } else {
                    console.error('Failed to fetch applications:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching applications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [petId]);

    const handleApprove = async (fosterId: number) => {
        try {
            // Call the API to approve the foster application
            const response = await fetch(`/api/accept-foster-application/${fosterId}`, {
                method: 'POST',
            });
    
            if (response.ok) {
                // Handle successful approval
                // Assuming you have a list of applications, you can update the list or remove the approved application.
                setApplications((prev) => 
                    prev ? prev.filter((app) => app.foster_id !== fosterId) : []
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
    

    const handleReject = async (fosterId: number) => {
        try {
            console.log(fosterId);
            const response = await fetch(`/api/reject-foster-application/${fosterId}`, {
                method: 'POST',
            });
            if (response.ok) {
                setApplications((prev) =>
                    prev ? prev.filter((app) => app.foster_id !== fosterId) : null
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
        return <div>Invalid pet ID</div>;
    }

    return (
        <>
        <Navbar></Navbar>
        <div className="max-w-5xl min-h-screen mx-auto p-6">

    {loading ? (
        <p className="text-lg text-gray-600 text-center mt-4">Loading applications...</p>
    ) : applications && applications.length > 0 ? (
        <ul className="space-y-6">
            {applications.map((app) => (
                <li
                    key={app.foster_id}
                    className={`p-6 bg-white border-2 ${
                        expandedApplication === app.foster_id ? "border-primary" : "border-primary"
                    } rounded-xl shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg`}
                    onClick={() => handleExpand(app.foster_id)}
                >
                    {/* Application Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{app.fosterer_name}</h2>
                            <p className="text-sm text-gray-600">
                                <strong>Address:</strong> {app.fosterer_address}
                            </p>
                            <p className="text-sm text-gray-600">
                                <strong>Foster Dates:</strong>{" "}
                                {app.foster_start_date
                                    ? new Date(app.foster_start_date).toLocaleDateString()
                                    : "Not provided"}{" "}
                                -{" "}
                                {app.foster_end_date
                                    ? new Date(app.foster_end_date).toLocaleDateString()
                                    : "Not provided"}
                            </p>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                app.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : app.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                    </div>

                    {/* Accordion Content */}
                    {expandedApplication === app.foster_id && (
                        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-gray-700">
                            <p>
                                <strong>Fostering Experience:</strong> {app.fostering_experience || "Not provided"}
                            </p>
                            <p>
                                <strong>Age of Youngest Child:</strong>{" "}
                                {app.age_of_youngest_child || "Not provided"}
                            </p>
                            <p>
                                <strong>Other Pets Details:</strong> {app.other_pets_details || "Not provided"}
                            </p>
                            <p>
                                <strong>Other Pets Neutered:</strong>{" "}
                                {app.other_pets_neutered ? "Yes" : "No"}
                            </p>
                            <p>
                                <strong>Has Secure Outdoor Area:</strong>{" "}
                                {app.has_secure_outdoor_area ? "Yes" : "No"}
                            </p>
                            <p>
                                <strong>Pet Sleep Location:</strong> {app.pet_sleep_location || "Not provided"}
                            </p>
                            <p>
                                <strong>Pet Left Alone:</strong> {app.pet_left_alone || "Not provided"}
                            </p>
                            <p>
                                <strong>Time at Home:</strong> {app.time_at_home || "Not provided"}
                            </p>
                            <p>
                                <strong>Reason for Fostering:</strong> {app.reason_for_fostering || "Not provided"}
                            </p>
                            <p>
                                <strong>Additional Details:</strong> {app.additional_details || "Not provided"}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end space-x-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(app.foster_id);
                            }}
                            className={`px-6 py-2 font-medium text-sm rounded-lg ${
                                app.status === "approved"
                                        ? "bg-white text-primary bordder border-primary"
                                        : "bg-primary text-white"
                            } transition-all`}
                            disabled={app.status === "approved"}
                        >
                            Approve
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReject(app.foster_id);
                            }}
                            className={`px-6 py-2 font-medium text-sm rounded-lg ${
                                app.status === "rejected"
                                        ? "bg-primary text-white cursor-not-allowed"
                                        : "bg-white text-primary border border-primary"
                            } transition-all`}
                            disabled={app.status === "rejected"}
                        >
                            Reject
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    ) : (
        <p className="text-lg text-gray-600 text-center mt-4">
            No applications found for this pet.
        </p>
    )}
</div>

        </>
    );
};

const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg text-gray-500">Loading FosterApplicants...</p>
    </div>
  );
const FosterApplicants = () =>{
    return (
      <Suspense fallback={<LoadingFallback />}>
        <FosterApplications />
      </Suspense>
    );
  }


export default FosterApplicants;
