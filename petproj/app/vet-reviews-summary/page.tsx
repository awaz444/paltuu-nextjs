'use client';
import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Spin, message } from "antd";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

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

  const acceptReview = (review_id: number) => {
    // Placeholder function for accepting a review
    console.log(`Accept review: ${review_id}`);
  };

  const rejectReview = (review_id: number) => {
    // Placeholder function for rejecting a review
    console.log(`Reject review: ${review_id}`);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const approvedResponse = await fetch(`/api/vet-reviews/approved-reviews/${vet_id}`);
        if (!approvedResponse.ok) {
          throw new Error("Failed to fetch approved reviews");
        }
        const approvedData = await approvedResponse.json();
        console.log(approvedData);
        setApprovedReviews(approvedData);

        const pendingResponse = await fetch(`/api/vet-reviews/pending-reviews/${vet_id}`);
        if (!pendingResponse.ok) {
          throw new Error("Failed to fetch pending reviews");
        }
        const pendingData = await pendingResponse.json();
        console.log(pendingData);
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

  const renderReviewCard = (review: Review, isPending: boolean = false) => (
    <div
      key={review.review_id}
      className="flex items-start relative bg-white p-4 mx-4 mb-4 rounded-2xl shadow-sm border border-gray-200 hover:border-primary"
    >
      <img
        src={review.user_image_url || "/placeholder.jpg"}
        alt={review.user_name}
        className="w-16 h-16 object-cover rounded-full mr-4"
      />
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-lg text-primary mr-2">
              {review.user_name}
            </span>
            <span className="text-yellow-500 font-semibold">
              {`⭐`.repeat(review.rating)}
            </span>
          </div>
          {isPending && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => acceptReview(review.review_id)}
                className="text-green-500 hover:text-green-700"
                aria-label="Accept Review"
              >
                ✅
              </button>
              <button
                onClick={() => rejectReview(review.review_id)}
                className="text-red-500 hover:text-red-700"
                aria-label="Reject Review"
              >
                ❌
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
      <div className="container mt-5 mx-5">
        <h2 className="text-2xl font-bold mb-4">Reviews Summary</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-xl font-semibold mb-3">Approved Reviews</h3>
              {approvedReviews.length > 0 ? (
                approvedReviews.map((review) => renderReviewCard(review))
              ) : (
                <p className="text-gray-500">No approved reviews found.</p>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3">Pending Reviews</h3>
              {pendingReviews.length > 0 ? (
                pendingReviews.map((review) =>
                  renderReviewCard(review, true)
                )
              ) : (
                <p className="text-gray-500">No pending reviews found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewsSummary;
