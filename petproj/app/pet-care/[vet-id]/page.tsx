'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import { Spin, Card, List, Divider } from 'antd';
import Navbar from '@/components/navbar';

interface VetDetails {
    vet_id: string;
    user_id: string;
    clinic_name: string;
    location: string;
    minimum_fee: number;
    contact_details: string;
    profile_verified: boolean;
    created_at: string;
    bio: string;
    vet_name: string;
    dob: string;
    email: string;
    profile_image_url: string;
    city: string;
    availability: {
        availability_id: string;
        day_of_week: string;
        start_time: string;
        end_time: string;
    }[];
    reviews: {
        review_id: string;
        rating: number;
        review_content: string;
        review_date: string;
        review_maker_name: string;
    }[];
    specializations: {
        category_id: string;
        category_name: string;
    }[];
    qualifications: {
        qualification_id: string;
        year_acquired: string;
        qualification_note: string;
        qualification_name: string;
    }[];
}

export default function VetDetailsPage({ params }: { params: { 'vet-id': string } }) {
    const [vetDetails, setVetDetails] = useState<VetDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchVetDetails = async () => {
            try {
                const response = await fetch(`/api/vets/${params['vet-id']}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch vet details');
                }
                const data = await response.json();
                setVetDetails(data);
            } catch (err) {
                console.error(err);
                router.push('/404'); // Redirect to a 404 page if the vet is not found
            } finally {
                setLoading(false);
            }
        };

        fetchVetDetails();
    }, [params, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (!vetDetails) {
        return <div className="text-center mt-10">Vet details not available.</div>;
    }

    return (
        <>
        <Navbar></Navbar>
        <div className="container mx-auto p-6">
            <Card>
                <div className="flex items-center space-x-4">
                    <img
                        src={vetDetails.profile_image_url || '/placeholder.jpg'}
                        alt={vetDetails.vet_name}
                        className="w-24 h-24 rounded-full object-cover"
                    />
                    <div>
                        <h1 className="text-2xl font-bold">{vetDetails.vet_name}</h1>
                        <p className="text-gray-600">{vetDetails.clinic_name}</p>
                        <p>
                            <strong>Location:</strong> {vetDetails.location} ({vetDetails.city})
                        </p>
                        <p>
                            <strong>Minimum Fee:</strong> PKR {vetDetails.minimum_fee}
                        </p>
                        <p>
                            <strong>Contact:</strong> {vetDetails.contact_details}
                        </p>
                    </div>
                </div>
                <Divider />

                <h2 className="text-lg font-semibold">Biography</h2>
                <p>{vetDetails.bio}</p>
                <Divider />

                <h2 className="text-lg font-semibold">Specializations</h2>
                <ul>
                    {vetDetails.specializations.map(spec => (
                        <li key={spec.category_id}>{spec.category_name}</li>
                    ))}
                </ul>
                <Divider />

                <h2 className="text-lg font-semibold">Qualifications</h2>
                <List
                    dataSource={vetDetails.qualifications}
                    renderItem={qual => (
                        <List.Item>
                            <strong>{qual.qualification_name}</strong> - {qual.year_acquired} ({qual.qualification_note})
                        </List.Item>
                    )}
                />
                <Divider />

                <h2 className="text-lg font-semibold">Availability</h2>
                <List
                    dataSource={vetDetails.availability}
                    renderItem={avail => (
                        <List.Item>
                            {avail.day_of_week}: {avail.start_time} - {avail.end_time}
                        </List.Item>
                    )}
                />
                <Divider />

                <h2 className="text-lg font-semibold">Reviews</h2>
                {vetDetails.reviews.length > 0 ? (
                    <List
                        dataSource={vetDetails.reviews}
                        renderItem={review => (
                            <List.Item>
                                <div>
                                    <strong>{review.review_maker_name}</strong> ({review.rating} ★)
                                    <p>{review.review_content}</p>
                                    <p className="text-gray-500">{new Date(review.review_date).toDateString()}</p>
                                </div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <p>No reviews available.</p>
                )}
            </Card>
        </div>
        </>
    );
}
