'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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

const AdoptionApplicants = () => {
    const searchParams = useSearchParams();
    const petId = searchParams.get('pet_id');
    const [applications, setApplications] = useState<Application[] | null>(null);

    useEffect(() => {
        if (!petId) return;

        const fetchApplications = async () => {
            try {
                const response = await fetch(`/api/adoption_application/${petId}`);
                if (response.ok) {
                    const data = await response.json();
                    setApplications(Array.isArray(data) ? data : [data]);
                } else {
                    console.error('Failed to fetch applications:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching applications:', error);
            }
        };

        fetchApplications();
    }, [petId]);

    const handleApprove = async (adoptionId: number) => {
        try {
            const response = await fetch(`/api/adoption_application/${adoptionId}/approve`, {
                method: 'POST',
            });
            if (response.ok) {
                setApplications((prev) =>
                    prev ? prev.filter((app) => app.adoption_id !== adoptionId) : null
                );
            } else {
                console.error('Failed to approve application:', response.statusText);
            }
        } catch (error) {
            console.error('Error approving application:', error);
        }
    };

    const handleReject = async (adoptionId: number) => {
        try {
            const response = await fetch(`/api/adoption_application/${adoptionId}/reject`, {
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

    if (!petId) {
        return <div className="text-center text-red-600 font-bold mt-6">Invalid Pet ID</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Applications for Pet: {applications && applications[0]?.pet_name}
            </h1>
            {applications ? (
                applications.length > 0 ? (
                    <ul className="space-y-6">
                        {applications.map((app) => (
                            <li
                                key={app.adoption_id}
                                className="p-6 bg-gray-50 shadow-sm rounded-lg border border-gray-200"
                            >
                                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                                    Adopter: {app.adopter_name}
                                </h2>
                                <p className="text-gray-600">
                                    <span className="font-medium">Address:</span> {app.adopter_address}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Status:</span> {app.status}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Application Date:</span>{' '}
                                    {new Date(app.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Youngest Child Age:</span>{' '}
                                    {app.age_of_youngest_child || 'Not Provided'}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Other Pets Details:</span>{' '}
                                    {app.other_pets_details || 'Not Provided'}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Other Pets Neutered:</span>{' '}
                                    {app.other_pets_neutered ? 'Yes' : 'No'}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Secure Outdoor Area:</span>{' '}
                                    {app.has_secure_outdoor_area ? 'Yes' : 'No'}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Pet Sleep Location:</span>{' '}
                                    {app.pet_sleep_location || 'Not Provided'}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Pet Left Alone:</span>{' '}
                                    {app.pet_left_alone || 'Not Provided'}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Additional Details:</span>{' '}
                                    {app.additional_details || 'Not Provided'}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Agreed to Terms:</span>{' '}
                                    {app.agree_to_terms ? 'Yes' : 'No'}
                                </p>
                                <div className="mt-4 flex justify-between space-x-4">
                                    <button
                                        onClick={() => handleApprove(app.adoption_id)}
                                        className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(app.adoption_id)}
                                        className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 text-center">No applications found for this pet.</p>
                )
            ) : (
                <p className="text-gray-600 text-center">Loading applications...</p>
            )}
        </div>
    );
};

export default AdoptionApplicants;
