'use client';
import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Spin, message } from "antd";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

type Review = {
  review_id: number;
  user_id: number;
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

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const approvedResponse = await fetch(`/api/reviews/approved-reviews/${vet_id}`);
        if (!approvedResponse.ok) {
          throw new Error("Failed to fetch approved reviews");
        }
        const approvedData = await approvedResponse.json();
        setApprovedReviews(approvedData);

        const pendingResponse = await fetch(`/api/reviews/pending-reviews/${vet_id}`);
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

  return (
    <div>
      <Navbar />
      <div className="container mt-5">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedReviews.map((review) => (
                    <div
                      key={review.review_id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
                    >
                      <div className="mb-2">
                        <span className="text-yellow-500 font-semibold">
                          {`⭐`.repeat(review.rating)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">
                        "{review.review_content}"
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(review.review_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No approved reviews found.</p>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3">Pending Reviews</h3>
              {pendingReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingReviews.map((review) => (
                    <div
                      key={review.review_id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
                    >
                      <div className="mb-2">
                        <span className="text-yellow-500 font-semibold">
                          {`⭐`.repeat(review.rating)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">
                        "{review.review_content}"
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(review.review_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
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
