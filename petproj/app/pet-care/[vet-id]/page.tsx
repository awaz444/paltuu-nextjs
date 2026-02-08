"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Spin,
    Card,
    List,
    Divider,
    Button,
    Tag,
    Modal,
    message,
    Form,
    Input,
    Rate,
} from "antd";
import { CopyOutlined, WhatsAppOutlined, EnvironmentOutlined } from "@ant-design/icons";
import {
    FaUserMd,
    FaGraduationCap,
    FaClock,
    FaPhone,
    FaEnvelope,
    FaStar,
    FaMapMarkerAlt,
    FaStethoscope,
    FaCalendarAlt,
    FaClinicMedical,
    FaMoneyBillWave,
    FaWhatsapp,
    FaCopy,
    FaQuoteLeft
} from "react-icons/fa";
import { MdRateReview, MdVerified } from "react-icons/md";
import { IoMdMedical } from "react-icons/io";
import { useAuth } from "@/context/AuthContext";
import Navbar from "../../../components/navbar";
import LoginModal from "../../../components/LoginModal";
import './styles.css'
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { MoonLoader } from "react-spinners";

interface VetDetails {
    vet_id: string;
    user_id: string;
    clinic_id: string;
    clinic_name: string;
    is_paltuu_partner: boolean;
    clinic_whatsapp: string;
    google_maps_link: string;
    location: string;
    minimum_fee: number;
    contact_details: string;
    created_at: string;
    bio: string;
    vet_name: string;
    dob: string;
    email: string;
    profile_image_url: string;
    city: string;
    schedule: string;
    reviews: {
        review_id: string;
        rating: number;
        review_content: string;
        review_date: string;
        review_maker_profile_image_url: string;
        review_maker_name: string;
    }[];
    qualifications: string;
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
    const { isAuthenticated, user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [form] = Form.useForm();
    const router = useRouter();


    // Handle login success
    const handleLoginSuccess = () => {
        setShowLoginModal(false);
    };

    // Fetch vet details
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
                reviews: uniqueByKey(data.reviews, "review_id"),
            });
        } catch (err) {
            console.error("Error fetching vet details:", err);
            router.push("/404");
        } finally {
            setLoading(false);
        }
    };

    // Fetch review stats
    const fetchReviewStats = async () => {
        try {
            const response = await fetch(`/api/vet-reviews-stats?vet_id=${params["vet-id"]}`);
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

    // Fetch data on mount
    useEffect(() => {
        fetchVetDetails();
        fetchReviewStats();
    }, [params, router]);

    // Handle copy to clipboard
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success("Copied to clipboard!");
    };

    // Handle WhatsApp click
    const handleWhatsApp = (phone: string) => {
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "+92" + formattedPhone.slice(1);
        } else if (!formattedPhone.startsWith("+92")) {
            message.error("Invalid phone number format. Please use a valid Pakistani number.");
            return;
        }
        const whatsappUrl = `https://wa.me/${phone}`;
        window.open(whatsappUrl, "_blank");
    };

    // Handle review button click
    const handleReviewClick = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        setIsModalOpen(true);
    };

    // Handle review submission
    const handleSubmit = async (values: { rating: number; review_content: string }) => {
        if (!isAuthenticated || !user?.id) {
            message.error("You must be logged in to submit a review");
            return;
        }

        const review_date = new Date().toISOString();
        const vet_id = params["vet-id"];

        try {
            const response = await fetch(`/api/vet-reviews-stats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vet_id,
                    rating: values.rating,
                    review_content: values.review_content,
                    review_date,
                }),
            });

            if (!response.ok) throw new Error("Failed to submit review");

            message.success("Review submitted for approval! It will appear once approved.");

            handleCloseModal();
            await fetchVetDetails();
            await fetchReviewStats();

        } catch (err) {
            console.error("Error submitting review:", err);
            message.error("Failed to submit review");
        }
    };

    // Handle modal close
    const handleCloseModal = () => setIsModalOpen(false);

    // Primary color setup
    const [primaryColor, setPrimaryColor] = useState("#A03048");
    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <MoonLoader size={30} color={primaryColor} />
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
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Sidebar - Sticky on desktop */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 space-y-6">
                                {/* Profile Header Card */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <div className="flex flex-col items-center text-center mb-6">
                                        {/* Profile Image */}
                                        <div className="relative mb-4">
                                            <img
                                                src={vetDetails.profile_image_url || "/placeholder.jpg"}
                                                alt={vetDetails.vet_name}
                                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                                            />
                                        </div>

                                        {/* Vet Name and Specialty */}
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                            {vetDetails.vet_name}
                                        </h1>
                                        <a
                                            href={`/pet-care/clinic/${vetDetails.clinic_id}`}
                                            className="text-primary hover:text-primary transition-colors"
                                        >
                                            {vetDetails.clinic_name}
                                        </a>
                                        {/* {reviewStats && (
                                            <div className="flex items-center gap-2 mt-3">
                                                <div className="flex items-center gap-1">
                                                    <FaStar className="text-primary text-sm" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {reviewStats.averageRating.toFixed(1)}
                                                    </span>
                                                </div>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-sm text-gray-500">
                                                    {reviewStats.approvedCount} Reviews
                                                </span>
                                            </div>
                                        )} */}
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-primary">
                                                PKR {vetDetails.minimum_fee}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">Min Fee</div>
                                        </div>
                                        {reviewStats && (
                                            <>
                                                <div className="text-center border-l border-r border-gray-100">
                                                    <div className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                                                        <FaStar className="text-primary text-sm" />
                                                        {reviewStats.averageRating.toFixed(1)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">Rating</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-primary">
                                                        {reviewStats.approvedCount}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">Reviews</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Location Card - Sidebar on desktop */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
                                    <div className="flex items-start gap-3">
                                        <FaMapMarkerAlt className="text-primary text-lg mt-1 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-gray-900 font-medium mb-1">
                                                {vetDetails.clinic_name}
                                            </div>
                                            <div className="text-gray-600 text-sm mb-2">
                                                {vetDetails.location}, {vetDetails.city}
                                            </div>
                                            {vetDetails.google_maps_link && (
                                                <a
                                                    href={vetDetails.google_maps_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                                                >
                                                    View on Map
                                                    <span className="text-xs">→</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information - Sidebar on desktop */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Contact</h2>
                                    <div className="space-y-4">
                                        {vetDetails.contact_details && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <FaPhone className="text-primary text-sm" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 mb-1">Personal Number</div>
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {vetDetails.contact_details}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-13">
                                                    <button
                                                        onClick={() => handleCopy(vetDetails.contact_details)}
                                                        className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <FaCopy className="text-gray-600 text-xs" />
                                                        <span className="text-gray-700">Copy</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleWhatsApp(vetDetails.contact_details)}
                                                        className="flex-1 py-2 px-3 rounded-lg bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <FaWhatsapp className="text-white text-sm" />
                                                        <span className="text-white">Chat</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {vetDetails.email && (
                                            <div className="space-y-2 pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <FaEnvelope className="text-primary text-sm" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 mb-1">Email</div>
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {vetDetails.email}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleCopy(vetDetails.email)}
                                                    className="w-full ml-13 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <FaCopy className="text-gray-600 text-xs" />
                                                    <span className="text-gray-700">Copy</span>
                                                </button>
                                            </div>
                                        )}

                                        {vetDetails.clinic_whatsapp && (
                                            <div className="space-y-2 pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <FaWhatsapp className="text-primary text-sm" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 mb-1">Clinic Number</div>
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {vetDetails.clinic_whatsapp}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-13">
                                                    <button
                                                        onClick={() => handleCopy(vetDetails.clinic_whatsapp)}
                                                        className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <FaCopy className="text-gray-600 text-xs" />
                                                        <span className="text-gray-700">Copy</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleWhatsApp(vetDetails.clinic_whatsapp)}
                                                        className="flex-1 py-2 px-3 rounded-lg bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <FaWhatsapp className="text-white text-sm" />
                                                        <span className="text-white">Chat</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* About Me Section */}
                            {vetDetails.bio && (
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">About Me</h2>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {vetDetails.bio}
                                    </p>
                                </div>
                            )}

                            {/* Two Column on Desktop - Qualifications and Working Time */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Qualifications Section */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Qualifications</h2>
                                    <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                        {vetDetails.qualifications || "No qualifications listed."}
                                    </div>
                                </div>

                                {/* Working Time / Availability Section */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Working Time</h2>
                                    <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                        {vetDetails.schedule || "Contact clinic for availability."}
                                    </div>
                                </div>
                            </div>

                            {/* Reviews Section */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                    <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                                    <button
                                        onClick={handleReviewClick}
                                        className="text-white bg-primary px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                                    >
                                        {isAuthenticated ? "Write Review" : "Login to Review"}
                                    </button>
                                </div>

                                {/* Overall Rating */}
                                {reviewStats && (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
                                        <div className="text-center sm:text-left">
                                            <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                                                <FaStar className="text-primary text-xl" />
                                                <span className="text-2xl font-bold text-gray-900">
                                                    {reviewStats.averageRating.toFixed(1)}
                                                </span>
                                            </div>
                                            <Rate
                                                disabled
                                                value={reviewStats.averageRating}
                                                className="text-primary [&>.ant-rate-star-zero>div]:text-gray-300 text-sm"
                                            />
                                        </div>
                                        <div className="text-sm text-gray-600 text-center sm:text-left">
                                            Based on {reviewStats.approvedCount} verified review{reviewStats.approvedCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    {vetDetails.reviews.length > 0 ? (
                                        vetDetails.reviews.map((review, index) => (
                                            <div
                                                key={review.review_id}
                                                className={`pb-4 ${index !== vetDetails.reviews.length - 1 ? 'border-b border-gray-100' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {review.review_maker_profile_image_url ? (
                                                        <img
                                                            src={review.review_maker_profile_image_url}
                                                            alt={review.review_maker_name}
                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-primary font-semibold text-sm">
                                                                {review.review_maker_name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                                                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                                                                {review.review_maker_name}
                                                            </h3>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                {new Date(review.review_date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <Rate
                                                            disabled
                                                            value={review.rating}
                                                            className="text-primary text-xs mb-2"
                                                        />
                                                        <p className="text-gray-600 text-sm leading-relaxed break-words">
                                                            {review.review_content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No reviews yet. Be the first to review!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Modal */}
            <LoginModal
                visible={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />

            {/* Review Modal */}
            <ReviewModal
                open={isModalOpen}
                onClose={handleCloseModal}
                form={form}
                onSubmit={handleSubmit}
            />
        </>
    );
}

const ReviewModal: React.FC<{
    open: boolean;
    onClose: () => void;
    form: any;
    onSubmit: (values: any) => void
}> = ({ open, onClose, form, onSubmit }) => (
    <Modal
        title="Share Your Experience"
        open={open}
        onCancel={onClose}
        footer={null}
        className="rounded-lg"
        width={600}
    >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Form.Item
                name="rating"
                label="Rating"
                rules={[{ required: true, message: 'Please select a rating' }]}
            >
                <Rate
                    className="text-3xl text-primary"
                    character={<span className="ant-rate-star-text">★</span>}
                />
            </Form.Item>

            <Form.Item
                name="review_content"
                label="Your Review"
                rules={[{ required: false, message: 'Please write your review' }]}
            >
                <Input.TextArea
                    rows={4}
                    placeholder="Share details about your experience..."
                    className="rounded-lg p-3 hover:border-primary focus:border-primary"
                />
            </Form.Item>

            <Form.Item>
                <button
                    type="submit"
                    className="w-full bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                    Submit Review
                </button>
            </Form.Item>
        </Form>
    </Modal>
);