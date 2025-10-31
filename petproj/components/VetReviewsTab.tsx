"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";

interface ReviewSummary {
    total_approved_reviews: number;
    total_pending_reviews: number;
    average_rating: string;
    most_recent_review_date: string;
}

const VetReviewsTab = () => {
    const { data: session, status } = useSession();
    const { user } = useAuth();

    const [reviews, setReviews] = useState<ReviewSummary>({
        total_approved_reviews: 0,
        total_pending_reviews: 0,
        average_rating: "0",
        most_recent_review_date: ""
    });
    const [vetId, setVetId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Get userId from session
    const userId = user?.id || (session?.user as any)?.user_id || null;

    useEffect(() => {
        // Wait for session to load
        if (status === "loading") {
            setLoading(true);
            return;
        }

        if (!userId) {
            setLoading(false);
            return;
        }

        const loadVetId = async () => {
            try {
                const res = await fetch(`/api/get-vet-id?user_id=${userId}`);
                if (!res.ok) throw new Error('Failed to fetch vet ID');
                const data = await res.json();
                setVetId(data.vet_id);
            } catch (error) {
                console.error("Error fetching vet ID:", error);
            }
        };

        loadVetId();
    }, [userId, status]);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!vetId) return;

            try {
                const res = await fetch(`/api/vet-panel/reviews/${vetId}`);
                if (!res.ok) throw new Error('Failed to fetch reviews');
                const data = await res.json();
                setReviews(data);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        if (vetId) {
            fetchReviews();
        }
    }, [vetId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Reviews Summary</h2>

            {reviews.total_approved_reviews === 0 ? (
                <p className="text-gray-500 py-4">No reviews yet</p>
            ) : (
                <Link href="/vet-reviews-summary" className="block">
                    <div className="space-y-4 cursor-pointer hover:bg-gray-100 p-4 rounded-lg transition">
                        <div className="flex justify-between items-center mb-2 text-primary">
                            <span className="font-medium">Manage Reviews </span>
                            <FaArrowRight className="w-4 h-4" />
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Total Approved Reviews</span>
                                <span>{reviews.total_approved_reviews}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Total Pending Reviews</span>
                                <span>{reviews.total_pending_reviews}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">Average Rating</span>
                                <span>{reviews.average_rating}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Most Recent Review Date</span>
                                <span className="flex items-center gap-2">
                                    {reviews.most_recent_review_date
                                        ? new Date(reviews.most_recent_review_date).toLocaleDateString()
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            )}
        </div>
    );
};

export default VetReviewsTab;