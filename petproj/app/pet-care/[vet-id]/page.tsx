"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Spin,
    Card,
    List,
    Divider,
    Button,
    Modal,
    message,
    Form,
    Input,
    Rate,
} from "antd";
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
        review_maker_profile_image_url: string;
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const router = useRouter();

    useEffect(() => {
        const fetchVetDetails = async () => {
            try {
                const response = await fetch(`/api/vets/${params["vet-id"]}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch vet details");
                }
                const data = await response.json();

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
                router.push("/404");
            } finally {
                setLoading(false);
            }
        };

        const fetchReviewStats = async () => {
            try {
                const response = await fetch(
                    `/api/vet-reviews-stats?vet_id=${params["vet-id"]}`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch review stats");
                }
                const stats = await response.json();

                setReviewStats({
                    averageRating: stats.average_rating,
                    approvedCount: stats.approved_reviews_count,
                });
            } catch (err) {
                console.error("Error fetching review stats:", err);
            }
        };

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

    const [isModalVisible, setIsModalVisible] = useState(false);
    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (values: {
        email: string;
        rating: number;
        review_content: string;
    }) => {
        const review_date = new Date().toISOString();
        const vet_id = params["vet-id"];
        const approved = false;

        try {
            const userResponse = await fetch(
                `/api/get-user-id?email=${encodeURIComponent(values.email)}`
            );
            if (!userResponse.ok) {
                throw new Error("Failed to fetch user ID");
            }
            const { user_id } = await userResponse.json();

            const reviewResponse = await fetch(`/api/vet-reviews-stats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vet_id,
                    user_id,
                    rating: values.rating,
                    review_content: values.review_content,
                    review_date,
                    approved,
                }),
            });

            if (!reviewResponse.ok) {
                throw new Error("Failed to submit review");
            }

            const newReview = await reviewResponse.json();

            // setVetDetails(prev =>
            //     prev
            //         ? {
            //               ...prev,
            //               reviews: [
            //                   ...prev.reviews,
            //                   {
            //                       review_id: newReview.review_id,
            //                       rating: values.rating,
            //                       review_content: values.review_content,
            //                       review_date,
            //                       review_maker_name: values.email,
            //                   },
            //               ],
            //           }
            //         : prev
            // );

            handleCloseModal();
        } catch (err) {
            console.error("Error submitting review:", err);
        }
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
                    {/* Vet Details */}
                    <div className="flex items-center space-x-4">
                        <img
                            src={vetDetails.profile_image_url || "/placeholder.jpg"}
                            alt={vetDetails.vet_name}
                            className="w-24 h-24 rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">{vetDetails.vet_name}</h1>
                            <p className="text-gray-600">{vetDetails.clinic_name}</p>
                            <p>
                                <strong>Location:</strong> {vetDetails.location} ({vetDetails.city})
                            </p>
                            <p>
                                <strong>Minimum Fee:</strong> PKR {vetDetails.minimum_fee}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <div
                                onClick={() => setIsModalVisible(true)}
                                className="bg-primary text-white px-4 py-2 rounded-xl font-semibold border border-white hover:border-[#A03048] hover:bg-[#ffffff] hover:text-primary cursor-pointer"
                            >
                                Book Appointment
                            </div>

                            <Modal
                                title="Contact Information"
                                visible={isModalVisible}
                                onCancel={() => setIsModalVisible(false)}
                                footer={null}>
                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {vetDetails.contact_details}{" "}
                                    <Button
                                        icon={<CopyOutlined />}
                                        className="ml-2"
                                        size="small"
                                        onClick={() =>
                                            handleCopy(
                                                vetDetails.contact_details
                                            )
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
                                        onClick={() =>
                                            handleCopy(vetDetails.email)
                                        }>
                                        Copy
                                    </Button>
                                </p>
                                <Button
                                    type="primary"
                                    className="bg-primary text-white mt-2"
                                    icon={<WhatsAppOutlined />}
                                    onClick={() =>
                                        handleWhatsApp(
                                            vetDetails.contact_details
                                        )
                                    }>
                                    WhatsApp
                                </Button>
                            </Modal>
                        </div>
                    </div>
                    <Divider />

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
                    {/* Review Section */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Reviews</h2>

                            {reviewStats && (
                                <div>
                                    <p>
                                        <strong>Average Rating:</strong> {reviewStats.averageRating.toFixed(1)} ★
                                    </p>
                                    <p>
                                        <strong>Approved Reviews:</strong> {reviewStats.approvedCount}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div
                                onClick={() => setIsModalOpen(true)}
                                className="bg-primary text-white px-4 py-2 rounded-xl font-semibold border border-white hover:border-[#A03048] hover:bg-[#ffffff] hover:text-primary cursor-pointer"
                            >
                                Add Review
                            </div>
                    </div>


                    {vetDetails.reviews.length > 0 ? (
                        <List
                            dataSource={vetDetails.reviews}
                            renderItem={(review) => (
                                <List.Item>
                                    <div className="flex items-center space-x-4">
                                        {review.review_maker_profile_image_url ? (
                                            <img
                                                src={review.review_maker_profile_image_url}
                                                alt={review.review_maker_name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                {review.review_maker_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <strong>{review.review_maker_name}</strong>{" "}
                                            <span>({review.rating} ★)</span>
                                            <p>{review.review_content}</p>
                                            <p className="text-gray-500">
                                                {new Date(review.review_date).toDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />

                    ) : (
                        <p>No reviews available.</p>
                    )

                    }
                </Card>
            </div>

            {/* Modal for Adding Review */}
            <Modal
                title="Add a Review"
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            {
                                required: true,
                                message: "Please enter your email",
                            },
                        ]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="rating"
                        label="Rating"
                        rules={[
                            { required: true, message: "Please give a rating" },
                        ]}>
                        <Rate />
                    </Form.Item>
                    <Form.Item
                        name="review_content"
                        label="Review"
                        rules={[
                            {
                                required: true,
                                message: "Please write your review",
                            },
                        ]}>
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item>
                        <button
                            type="submit"
                            className="w-full bg-primary text-white px-4 py-2 rounded-xl font-semibold border border-white hover:border-[#A03048] hover:bg-[#ffffff] hover:text-primary cursor-pointer">
                            Submit
                        </button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
