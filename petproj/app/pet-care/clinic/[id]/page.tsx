"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Divider, Button, message, Form, Input, Rate, Modal } from "antd";
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, WhatsAppOutlined, CopyOutlined } from "@ant-design/icons";
import {
    FaMapMarkerAlt,
    FaPhone,
    FaClock,
    FaWhatsapp,
    FaCopy,
    FaStar,
    FaUserMd,
    FaClinicMedical,
    FaQuoteLeft,
    FaCheckCircle,
    FaCalendarAlt
} from "react-icons/fa";
import { MdRateReview, MdVerified } from "react-icons/md";
import { MoonLoader } from "react-spinners";
import VetGrid from "../../../../components/VetGrid";
import LoginModal from "../../../../components/LoginModal";
import { useAuth } from "@/context/AuthContext";
import { Clinic } from "../../../types/clinic";
import { Vet } from "../../../types/vet";

interface ClinicDetails extends Clinic {
    vets: Vet[];
    reviews: {
        review_id: string;
        rating: number;
        review_content: string;
        review_date: string;
        review_maker_profile_image_url: string;
        review_maker_name: string;
    }[];
}

export default function ClinicPage() {
    const params = useParams();
    const router = useRouter();
    const [clinic, setClinic] = useState<ClinicDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [primaryColor, setPrimaryColor] = useState("#A03048");
    const [reviewStats, setReviewStats] = useState<{
        averageRating: number;
        reviewsCount: number;
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    const fetchClinicDetails = async () => {
        try {
            const response = await fetch(`/api/clinics/${params.id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch clinic details");
            }
            const data = await response.json();
            setClinic(data);
        } catch (err) {
            console.error("Error fetching clinic details:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviewStats = async () => {
        try {
            const response = await fetch(`/api/clinic-reviews-stats?clinic_id=${params.id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch review stats");
            }
            const stats = await response.json();
            setReviewStats({
                averageRating: stats.average_rating,
                reviewsCount: stats.reviews_count,
            });
        } catch (err) {
            console.error("Error fetching review stats:", err);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchClinicDetails();
            fetchReviewStats();
        }
    }, [params.id, router]);

    const handleLoginSuccess = () => {
        setShowLoginModal(false);
    };

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

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success("Copied to clipboard!");
    };

    const handleReviewClick = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (values: { rating: number; review_content: string }) => {
        if (!isAuthenticated || !user?.id) {
            message.error("You must be logged in to submit a review");
            return;
        }

        const review_date = new Date().toISOString();
        const clinic_id = params.id;

        try {
            const response = await fetch(`/api/clinic-reviews-stats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clinic_id,
                    rating: values.rating,
                    review_content: values.review_content,
                    review_date,
                }),
            });

            if (!response.ok) throw new Error("Failed to submit review");

            message.success("Review submitted!");
            handleCloseModal();
            form.resetFields();
            await fetchClinicDetails();
            await fetchReviewStats();

        } catch (err) {
            console.error("Error submitting review:", err);
            message.error("Failed to submit review");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

    if (!clinic) {
        return <div className="text-center mt-10">Clinic not found.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Sidebar - Sticky on desktop */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 space-y-6">
                            {/* Clinic Header Card */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm">
                                <div className="flex flex-col items-center text-center mb-6">
                                    {/* Clinic Logo */}
                                    <div className="relative mb-4">
                                        <img
                                            src={clinic.logo_url || "/placeholder-clinic.png"}
                                            alt={clinic.name}
                                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                                        />
                                        {clinic.is_paltuu_partner && (
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-2 shadow-lg">
                                                <MdVerified className="text-lg" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Clinic Name */}
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                        {clinic.name}
                                    </h1>
                                </div>

                                {/* Stats Row */}
                                {reviewStats && (
                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                                                <FaStar className="text-primary text-sm" />
                                                {reviewStats.averageRating.toFixed(1)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">Rating</div>
                                        </div>
                                        <div className="text-center border-l border-gray-100">
                                            <div className="text-lg font-bold text-primary">
                                                {reviewStats.reviewsCount}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">Reviews</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Location Card */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="text-primary text-lg mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="text-gray-900 font-medium mb-1">
                                            {clinic.name}
                                        </div>
                                        <div className="text-gray-600 text-sm mb-2">
                                            {clinic.address}
                                        </div>
                                        {clinic.google_maps_link && (
                                            <a
                                                href={clinic.google_maps_link}
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

                            {/* Contact Information */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Contact</h2>
                                <div className="space-y-4">
                                    {/* Phone Number */}
                                    {clinic.contact_number && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <FaPhone className="text-primary text-sm" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs text-gray-500 mb-1">Phone Number</div>
                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                        {clinic.contact_number}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-13">
                                                <button
                                                    onClick={() => handleCopy(clinic.contact_number)}
                                                    className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <FaCopy className="text-gray-600 text-xs" />
                                                    <span className="text-gray-700">Copy</span>
                                                </button>
                                                {clinic.whatsapp_number && (
                                                    <button
                                                        onClick={() => handleWhatsApp(clinic.whatsapp_number)}
                                                        className="flex-1 py-2 px-3 rounded-lg bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <FaWhatsapp className="text-white text-sm" />
                                                        <span className="text-white">Chat</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Operating Hours */}
                                    {clinic.operating_hours && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <FaClock className="text-primary text-sm" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-gray-500 mb-1">Operating Hours</div>
                                                    <div className="text-sm font-medium text-gray-900 whitespace-pre-line">
                                                        {clinic.operating_hours}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Discount Banner */}
                        {clinic.discount_details && 
                         !clinic.discount_details.toLowerCase().includes("no discount") && 
                         !clinic.discount_details.toLowerCase().includes("pending negotiation") && (
                            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                                <div className="relative flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/30">
                                        <i className="bi bi-gift-fill text-2xl"></i>
                                    </div>
                                    <div>
                                        <div className="text-red-100/80 text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-2">
                                            Exclusive Offer <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                        </div>
                                        <h2 className="text-xl font-bold">{clinic.discount_details}</h2>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Veterinarians Section */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Our Veterinarians</h2>
                                {clinic.vets && clinic.vets.length > 0 && (
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                        {clinic.vets.length}
                                    </span>
                                )}
                            </div>
                            {clinic.vets && clinic.vets.length > 0 ? (
                                <VetGrid vets={clinic.vets.map(v => ({
                                    ...v,
                                    city_id: 0,
                                    city_name: '',
                                    qualifications: [],
                                    specializations: [],
                                    clinic_name: clinic.name,
                                    location: clinic.address
                                }))} />
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No veterinarians listed yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                                    {reviewStats && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span className="font-bold text-gray-900 text-lg">{reviewStats.averageRating.toFixed(1)}</span>
                                            <Rate disabled value={reviewStats.averageRating} className="text-primary text-sm" />
                                            <span>({reviewStats.reviewsCount})</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleReviewClick}
                                    className="text-white bg-primary px-4 py-2 rounded-lg font-medium hover:bg-primary transition-colors text-sm whitespace-nowrap"
                                >
                                    {isAuthenticated ? "Write Review" : "Login to Review"}
                                </button>
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-4">
                                {clinic.reviews && clinic.reviews.length > 0 ? (
                                    clinic.reviews.map((review, index) => (
                                        <div
                                            key={review.review_id}
                                            className={`pb-4 ${index !== clinic.reviews.length - 1 ? 'border-b border-gray-100' : ''}`}
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
                                                            {review.review_maker_name?.charAt(0).toUpperCase() || "A"}
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
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
                                    </div>
                                )}
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
        </div>
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