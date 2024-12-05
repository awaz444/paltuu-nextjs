import React, { useState, useEffect } from "react";
import Link from "next/link";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal, Button, message } from "antd";
import { CopyOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import Navbar from "@/components/navbar";

// Type definitions for reviews
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

  const vet_id = "123"; // Set this based on the logged-in vet's ID or pass as a prop

  useSetPrimaryColor(); // Assuming this hook handles the primary color for the page.

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        // Fetch approved reviews
        const approvedResponse = await fetch(`/api/vet-reviews/approved/${vet_id}`);
        if (!approvedResponse.ok) {
          throw new Error('Failed to fetch approved reviews');
        }
        const approvedData = await approvedResponse.json();
        setApprovedReviews(approvedData);

        // Fetch pending reviews
        const pendingResponse = await fetch(`/api/vet-reviews/pending/${vet_id}`);
        if (!pendingResponse.ok) {
          throw new Error('Failed to fetch pending reviews');
        }
        const pendingData = await pendingResponse.json();
        setPendingReviews(pendingData);

      } catch (error: unknown) {
        // Here, we cast the error to an instance of Error to access the message property
        if (error instanceof Error) {
          message.error('Failed to fetch reviews: ' + error.message);
        } else {
          message.error('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [vet_id]); // Dependency array includes vet_id so it triggers when the vet_id changes

  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <h2>Reviews Summary</h2>
        
        <div>
          <h3>Approved Reviews</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {approvedReviews.length > 0 ? (
                approvedReviews.map((review) => (
                  <li key={review.review_id}>
                    <strong>Rating:</strong> {review.rating} <br />
                    <strong>Review:</strong> {review.review_content} <br />
                    <strong>Date:</strong> {new Date(review.review_date).toLocaleDateString()} <br />
                  </li>
                ))
              ) : (
                <p>No approved reviews found.</p>
              )}
            </ul>
          )}
        </div>

        <div>
          <h3>Pending Reviews</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {pendingReviews.length > 0 ? (
                pendingReviews.map((review) => (
                  <li key={review.review_id}>
                    <strong>Rating:</strong> {review.rating} <br />
                    <strong>Review:</strong> {review.review_content} <br />
                    <strong>Date:</strong> {new Date(review.review_date).toLocaleDateString()} <br />
                  </li>
                ))
              ) : (
                <p>No pending reviews found.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsSummary;
