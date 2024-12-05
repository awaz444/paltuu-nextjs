"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Spin, message } from "antd";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

import "./page.css";

type Review = {
    review_id: number;
    user_id: number;
    user_name: string;
    user_image_url: string;
    rating: number;
    review_content: string;
    review_date: string;
};

const ReviewsSummary = () => {
    const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
    const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const vet_id = "1"; // Replace with dynamic vet ID when needed

    useSetPrimaryColor();

    const acceptReview = async (review_id: number) => {
        try {
            const response = await fetch(
                `/api/vet-approve-review/${review_id}`,
                {
                    method: "POST",
                }
            );

            if (response.ok) {
                message.success("Review approved successfully!");
                // Optionally, refresh the pending and approved reviews
                setPendingReviews((prev) =>
                    prev.filter((review) => review.review_id !== review_id)
                );
                const approvedReview = pendingReviews.find(
                    (review) => review.review_id === review_id
                );
                if (approvedReview) {
                    setApprovedReviews((prev) => [...prev, approvedReview]);
                }
            } else {
                const data = await response.json();
                throw new Error(data.error || "Failed to approve review");
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                message.error("Error approving review: " + error.message);
            } else {
                message.error("An unknown error occurred");
            }
        }
    };

    const rejectReview = async (review_id: number) => {
        try {
            const response = await fetch(
                `/api/vet-reject-review/${review_id}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                message.success("Review rejected and deleted successfully!");
                // Remove the rejected review from the pending reviews list
                setPendingReviews((prev) =>
                    prev.filter((review) => review.review_id !== review_id)
                );
            } else {
                const data = await response.json();
                throw new Error(data.error || "Failed to reject review");
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                message.error("Error rejecting review: " + error.message);
            } else {
                message.error("An unknown error occurred");
            }
        }
    };

    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            try {
                const approvedResponse = await fetch(
                    `/api/vet-reviews/approved-reviews/${vet_id}`
                );
                if (!approvedResponse.ok) {
                    throw new Error("Failed to fetch approved reviews");
                }
                const approvedData = await approvedResponse.json();
                setApprovedReviews(approvedData);

                const pendingResponse = await fetch(
                    `/api/vet-reviews/pending-reviews/${vet_id}`
                );
                if (!pendingResponse.ok) {
                    throw new Error("Failed to fetch pending reviews");
                }
                const pendingData = await pendingResponse.json();
                setPendingReviews(pendingData);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    message.error("Failed to fetch reviews: " + error.message);
                } else {
                    message.error("An unknown error occurred");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [vet_id]);

    const renderStars = (rating: number) =>
        Array(rating)
            .fill(null)
            .map((_, idx) => (
                <svg
                    key={idx}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-[#cc8800] inline-block">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            ));

    const renderReviewCard = (review: Review, isPending: boolean = false) => (
        <div
            key={review.review_id}
            className="flex items-start relative bg-white p-6 mb-6 rounded-2xl shadow-sm border border-gray-200 hover:border-primary w-4/5 max-w-3xl">
            <img
                src={review.user_image_url || "/placeholder.jpg"}
                alt={review.user_name}
                className="w-16 h-16 object-cover rounded-full mr-4"
            />
            <div className="flex-grow">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-bold text-lg text-primary mr-2">
                            {review.user_name} -{" "}
                            <span className="stars">
                                {renderStars(review.rating)}
                            </span>
                        </span>
                    </div>
                    {isPending && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => acceptReview(review.review_id)}
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
                                onClick={() => rejectReview(review.review_id)}
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
                    )}
                </div>
                <p className="text-gray-600 mb-2">"{review.review_content}"</p>
                <p className="text-sm text-gray-400">
                    {new Date(review.review_date).toLocaleDateString()}
                </p>
            </div>
        </div>
    );

    return (
        <div>
            <Navbar />
            <div className="flex flex-col items-center mt-5 mx-3">
                <h2 className="text-2xl font-bold mb-4 text-primary">Reviews Summary</h2>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Spin size="large" className="text-primary bg-primary" />
                    </div>
                ) : (
                    <div className="w-full max-w-4xl">
                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-center text-primary">
                                Approved Reviews
                            </h3>
                            <div className="flex flex-col items-center">
                                {approvedReviews.length > 0 ? (
                                    approvedReviews.map((review) =>
                                        renderReviewCard(review)
                                    )
                                ) : (
                                    <p className="text-primary">
                                        No approved reviews found.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-xl font-semibold mb-3 text-center text-primary">
                                Pending Reviews
                            </h3>
                            <div className="flex flex-col items-center">
                                {pendingReviews.length > 0 ? (
                                    pendingReviews.map((review) =>
                                        renderReviewCard(review, true)
                                    )
                                ) : (
                                    <p className="text-primary mb-4">
                                        No pending reviews found.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewsSummary;
  