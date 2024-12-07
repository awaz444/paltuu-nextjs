'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';

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
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold">Foster Applications for Pet ID: {petId}</h1>
            {loading ? (
                <p className="mt-4">Loading applications...</p>
            ) : applications && applications.length > 0 ? (
                <ul className="mt-4 space-y-6">
                    {applications.map((app) => (
                        <li
                            key={app.foster_id}
                            className="border p-4 rounded-lg shadow-md bg-white cursor-pointer"
                            onClick={() => handleExpand(app.foster_id)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-lg">{app.fosterer_name}</h2>
                                    <p>
                                        <strong>Address:</strong> {app.fosterer_address}
                                    </p>
                                    <p>
                                        <strong>Foster Dates:</strong> {app.foster_start_date
                                            ? new Date(app.foster_start_date).toLocaleDateString()
                                            : 'Not provided'}{' '}
                                        -{' '}
                                        {app.foster_end_date
                                            ? new Date(app.foster_end_date).toLocaleDateString()
                                            : 'Not provided'}
                                    </p>
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleApprove(app.foster_id);
                                        }}
                                        disabled={app.status === 'approved'}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReject(app.foster_id);
                                        }}
                                        disabled={app.status === 'rejected'}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                            {expandedApplication === app.foster_id && (
                                <div className="mt-4 space-y-2">
                                    <p><strong>Fostering Experience:</strong> {app.fostering_experience}</p>
                                    <p><strong>Age of Youngest Child:</strong> {app.age_of_youngest_child || 'Not provided'}</p>
                                    <p><strong>Other Pets Details:</strong> {app.other_pets_details}</p>
                                    <p><strong>Other Pets Neutered:</strong> {app.other_pets_neutered ? 'Yes' : 'No'}</p>
                                    <p><strong>Has Secure Outdoor Area:</strong> {app.has_secure_outdoor_area ? 'Yes' : 'No'}</p>
                                    <p><strong>Pet Sleep Location:</strong> {app.pet_sleep_location}</p>
                                    <p><strong>Pet Left Alone:</strong> {app.pet_left_alone}</p>
                                    <p><strong>Time at Home:</strong> {app.time_at_home}</p>
                                    <p><strong>Reason for Fostering:</strong> {app.reason_for_fostering}</p>
                                    <p><strong>Additional Details:</strong> {app.additional_details}</p>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-4">No applications found for this pet.</p>
            )}
        </div>
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
