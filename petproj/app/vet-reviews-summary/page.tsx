"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navbar";
import { message } from "antd";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import MoonLoader from "react-spinners/MoonLoader";
import { Check, X, Star, ThumbsUp, Clock } from "lucide-react";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vetId, setVetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved");
  const [primaryColor, setPrimaryColor] = useState("#A03048");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue("--primary-color").trim();
    if (color) setPrimaryColor(color);
  }, []);

  useEffect(() => {
    const fetchVetIdAndReviews = async () => {
      setLoading(true);
      try {
        const userString = localStorage.getItem("user");
        if (!userString) throw new Error("User data not found in local storage");

        const user = JSON.parse(userString);
        const userId = user?.id;
        if (!userId) throw new Error("User ID is missing");

        const vetResponse = await fetch(`/api/get-vet-id?user_id=${userId}`);
        if (!vetResponse.ok) throw new Error("Failed to fetch vet ID");

        const { vet_id } = await vetResponse.json();
        setVetId(vet_id);

        const approvedResponse = await fetch(`/api/vet-reviews/approved-reviews/${vet_id}`);
        if (!approvedResponse.ok) throw new Error("Failed to fetch approved reviews");
        setApprovedReviews(await approvedResponse.json());

        const pendingResponse = await fetch(`/api/vet-reviews/pending-reviews/${vet_id}`);
        if (!pendingResponse.ok) throw new Error("Failed to fetch pending reviews");
        setPendingReviews(await pendingResponse.json());
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
          message.error(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVetIdAndReviews();
  }, []);

  const acceptReview = async (review_id: number) => {
    try {
      const response = await fetch(`/api/vet-approve-review/${review_id}`, { method: "POST" });

      if (response.ok) {
        message.success("Review approved successfully!");
        setPendingReviews((prev) => prev.filter((review) => review.review_id !== review_id));
        const approvedReview = pendingReviews.find((review) => review.review_id === review_id);
        if (approvedReview) setApprovedReviews((prev) => [...prev, approvedReview]);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve review");
      }
    } catch (error: unknown) {
      message.error("Error approving review");
    }
  };

  const rejectReview = async (review_id: number) => {
    try {
      const response = await fetch(`/api/vet-reject-review/${review_id}`, { method: "DELETE" });

      if (response.ok) {
        message.success("Review rejected and deleted!");
        setPendingReviews((prev) => prev.filter((review) => review.review_id !== review_id));
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject review");
      }
    } catch (error: unknown) {
      message.error("Error rejecting review");
    }
  };

  const renderStars = (rating: number) =>
    Array(5)
      .fill(null)
      .map((_, idx) => (
        <Star
          key={idx}
          className={`w-5 h-5 ${idx < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ));

  const renderReviewCard = (review: Review, isPending: boolean = false) => (
    <div
      key={review.review_id}
      className="flex items-start bg-white p-6 mb-6 rounded-2xl shadow-sm border border-gray-200 hover:border-primary/30 transition-all duration-200"
    >
      <img
        src={review.user_image_url || "/placeholder.jpg"}
        alt={review.user_name}
        className="w-16 h-16 object-cover rounded-full mr-4 border-2 border-primary/20"
      />

      <div className="flex-grow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {review.user_name}
            </span>
            {isPending && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </span>
            )}
            {!isPending && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                Approved
              </span>
            )}
          </div>

          {isPending && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => acceptReview(review.review_id)} 
                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => rejectReview(review.review_id)} 
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className={isPending ? "filter blur-sm select-none" : ""}>
          <div className="flex items-center gap-1 mb-2">
            {renderStars(isPending ? 5 : review.rating)}
            <span className="text-sm text-gray-500 ml-2">
              {isPending ? "Rating hidden" : `${review.rating}/5`}
            </span>
          </div>
          <p className="text-gray-700 mb-2 italic">"{review.review_content}"</p>
          <p className="text-sm text-gray-500">
            {new Date(review.review_date).toLocaleDateString()}
          </p>
        </div>

        {isPending && (
          <div className="mt-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-800">
            Approve if you recall this client availing your services
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar
        linksOverride={[{ name: "Vet Panel", href: "vet-panel" }]}
        dropdownOverride={[
          { href: "/", label: "Home", icon: "bi bi-house-fill" },
          { href: "/logout", label: "Logout", icon: "bi bi-box-arrow-right", isAction: true },
        ]}
        logoHref="/vet-panel"
        hideCart
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <header className="bg-white border border-2 border-primary text-black p-8 rounded-2xl shadow-lg mb-10">
          <div className="flex text-primary items-center gap-4">
            <div className="bg-primary flex-shrink-0 w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
              <img className="p-3" src="/favicon-dark.png" alt="paltuu logo" />
            </div>
            <div>
              <h1 className="text-black text-3xl font-bold">Reviews Summary</h1>
              <p className="text-black mt-1">
                Manage and approve reviews from your clients
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <MoonLoader size={30} color={primaryColor} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-md">
            {/* Enhanced Tab Switch with Smooth Transition */}
            <div className="relative flex mb-8 bg-gray-100 p-1 rounded-full w-fit mx-auto">
              {/* Sliding background indicator */}
              <div 
                className="absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-300 ease-out"
                style={{
                  left: activeTab === 'approved' ? '2px' : '50%',
                  width: 'calc(50% - 4px)',
                }}
              />
              
              <button
                ref={el => { tabRefs.current[0] = el; }}
                onClick={() => setActiveTab("approved")}
                className={`relative z-10 px-6 py-3 rounded-full font-medium transition-colors duration-300 ${
                  activeTab === "approved"
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Approved Reviews ({approvedReviews.length})
              </button>
              <button
                ref={el => { tabRefs.current[0] = el; }}
                onClick={() => setActiveTab("pending")}
                className={`relative z-10 px-6 py-3 rounded-full font-medium transition-colors duration-300 ${
                  activeTab === "pending"
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pending Reviews ({pendingReviews.length})
              </button>
            </div>

            {/* Content based on active tab */}
            <div className="transition-opacity duration-300 ease-in-out">
              {activeTab === "approved" ? (
                <div>
                  <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">Approved Reviews</h2>
                  {approvedReviews.length > 0 ? (
                    <div className="space-y-4">
                      {approvedReviews.map((review) => renderReviewCard(review))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <ThumbsUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>No approved reviews yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">Pending Reviews</h2>
                  <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
                    <p className="text-amber-800 text-sm text-center">
                      Approve reviews only if you recall the client availing your services. 
                      Once approved, the review will stay on your profile permanently.
                    </p>
                  </div>
                  {pendingReviews.length > 0 ? (
                    <div className="space-y-4">
                      {pendingReviews.map((review) => renderReviewCard(review, true))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>No pending reviews at this time</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsSummary;