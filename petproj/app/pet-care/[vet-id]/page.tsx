"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spin, Card, List, Divider, Button, Modal, message } from "antd";
import { CopyOutlined, WhatsAppOutlined } from "@ant-design/icons";
import Navbar from "../../../components/navbar";

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

export default function VetDetailsPage({
    params,
}: {
    params: { "vet-id": string };
}) {
    const [vetDetails, setVetDetails] = useState<VetDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviewStats, setReviewStats] = useState<{
        averageRating: number;
        approvedCount: number;
    } | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Fetch vet details
        const fetchVetDetails = async () => {
            try {
                const response = await fetch(`/api/vets/${params["vet-id"]}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch vet details");
                }
                const data = await response.json();

                // Deduplicate related data
                const uniqueByKey = <T, K extends keyof T>(
                    array: T[],
                    key: K
                ): T[] => {
                    const seen = new Set<T[K]>();
                    return array.filter((item) => {
                        const value = item[key];
                        if (seen.has(value)) {
                            return false;
                        }
                        seen.add(value);
                        return true;
                    });
                };

                // Set vet details with deduplicated fields
                setVetDetails({
                    ...data,
                    specializations: uniqueByKey(
                        data.specializations,
                        "category_id"
                    ),
                    qualifications: uniqueByKey(
                        data.qualifications,
                        "qualification_id"
                    ),
                    availability: uniqueByKey(
                        data.availability,
                        "availability_id"
                    ),
                    reviews: uniqueByKey(data.reviews, "review_id"),
                });
            } catch (err) {
                console.error("Error fetching vet details:", err);
                router.push("/404"); // Redirect to 404 page if the vet is not found
            } finally {
                setLoading(false);
            }
        };

        // Fetch review stats
        const fetchReviewStats = async () => {
            try {
                // Append vet_id as a query parameter
                const response = await fetch(
                    `/api/vet-reviews-stats?vet_id=${params["vet-id"]}`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch review stats");
                }
                const stats = await response.json();

                // Update review stats
                setReviewStats({
                    averageRating: stats.average_rating,
                    approvedCount: stats.approved_reviews_count,
                });
            } catch (err) {
                console.error("Error fetching review stats:", err);
            }
        };

        // Call both fetch functions
        fetchVetDetails();
        fetchReviewStats();
    }, [params, router]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success("Copied to clipboard!");
    };

    const handleWhatsApp = (phone: string) => {
        const whatsappUrl = `https://wa.me/${phone}`;
        window.open(whatsappUrl, "_blank");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (!vetDetails) {
        return (
            <div className="text-center mt-10">Vet details not available.</div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto p-6">
                <Card>
                    <div className="flex items-center space-x-4">
                        <img
                            src={
                                vetDetails.profile_image_url ||
                                "/placeholder.jpg"
                            }
                            alt={vetDetails.vet_name}
                            className="w-24 h-24 rounded-full object-cover"
                        />
                        <div>
                            <h1 className="text-2xl font-bold">
                                {vetDetails.vet_name}
                            </h1>
                            <p className="text-gray-600">
                                {vetDetails.clinic_name}
                            </p>
                            <p>
                                <strong>Location:</strong> {vetDetails.location}{" "}
                                ({vetDetails.city})
                            </p>
                            <p>
                                <strong>Minimum Fee:</strong> PKR{" "}
                                {vetDetails.minimum_fee}
                            </p>
                            <p>
                                <strong>Contact:</strong>{" "}
                                {vetDetails.contact_details}
                            </p>
                        </div>
                    </div>
                    <Divider />

                    <Button
                        type="primary"
                        onClick={() => setIsModalVisible(true)}
                        className="mr-4 bg-primary text-white">
                        Contact
                    </Button>
                    <Button
                        type="default"
                        className="border-primary text-primary"
                        onClick={() =>
                            router.push(`/add-review/${vetDetails.vet_id}`)
                        }>
                        Add Review
                    </Button>

                    <Divider />

                    {vetDetails.bio && (
                        <>
                            <h2 className="text-lg font-semibold">Biography</h2>
                            <p>{vetDetails.bio}</p>
                            <Divider />
                        </>
                    )}

                    <h2 className="text-lg font-semibold">Specializations</h2>
                    <ul>
                        {vetDetails.specializations.map((spec) => (
                            <li key={spec.category_id}>{spec.category_name}</li>
                        ))}
                    </ul>
                    <Divider />

                    <h2 className="text-lg font-semibold">Qualifications</h2>
                    <List
                        dataSource={vetDetails.qualifications}
                        renderItem={(qual) => (
                            <List.Item>
                                <strong>{qual.qualification_name}</strong> -{" "}
                                {qual.year_acquired} ({qual.qualification_note})
                            </List.Item>
                        )}
                    />
                    <Divider />

                    <h2 className="text-lg font-semibold">Availability</h2>
                    <List
                        dataSource={vetDetails.availability}
                        renderItem={(avail) => (
                            <List.Item>
                                {avail.day_of_week}: {avail.start_time} -{" "}
                                {avail.end_time}
                            </List.Item>
                        )}
                    />
                    <Divider />

                    {reviewStats && (
                        <h2 className="text-lg font-semibold">
                            Reviews ({reviewStats.approvedCount})
                        </h2>
                    )}
                    {reviewStats && (
                        <div className="mb-4">
                            <p>
                                <strong>Average Rating:</strong>{" "}
                                {reviewStats.averageRating.toFixed(1)} ★
                            </p>
                        </div>
                    )}
                    {vetDetails.reviews.length > 0 ? (
                        <List
                            dataSource={vetDetails.reviews}
                            renderItem={(review) => (
                                <List.Item>
                                    <div>
                                        <strong>
                                            {review.review_maker_name}
                                        </strong>{" "}
                                        ({review.rating} ★)
                                        <p>{review.review_content}</p>
                                        <p className="text-gray-500">
                                            {new Date(
                                                review.review_date
                                            ).toDateString()}
                                        </p>
                                    </div>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <p>No reviews available.</p>
                    )}
                </Card>

                <Modal
                    title="Contact Information"
                    visible={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}>
                    <p>
                        <strong>Phone:</strong> {vetDetails.contact_details}{" "}
                        <Button
                            icon={<CopyOutlined />}
                            className="ml-2"
                            size="small"
                            onClick={() =>
                                handleCopy(vetDetails.contact_details)
                            }>
                            Copy
                        </Button>
                    </p>
                    <p>
                        <strong>Email:</strong> {vetDetails.email}{" "}
                        <Button
                            icon={<CopyOutlined />}
                            className="mt-2 ml-2"
                            size="small"
                            onClick={() => handleCopy(vetDetails.email)}>
                            Copy
                        </Button>
                    </p>
                    <Button
                        type="primary mt-2"
                        className="bg-primary text-white"
                        icon={<WhatsAppOutlined />}
                        onClick={() =>
                            handleWhatsApp(vetDetails.contact_details)
                        }>
                        WhatsApp
                    </Button>
                </Modal>
            </div>
        </>
    );
}
