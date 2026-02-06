"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Divider, Button, message, Form, Input, Rate, Modal } from "antd";
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, WhatsAppOutlined, CopyOutlined } from "@ant-design/icons";
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

    // Fetch user ID


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
            // router.push("/404");
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
                    // server handles user_id
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Card className="shadow-lg rounded-2xl overflow-hidden mb-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:block">
                        <img
                            src={clinic.logo_url || "/placeholder-clinic.png"}
                            alt={clinic.name}
                            className="w-48 h-48 object-contain rounded-xl border border-gray-100 bg-gray-50"
                        />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="text-3xl font-bold text-gray-800">{clinic.name}</h1>
                            {clinic.is_paltuu_partner && (
                                <i className="bi bi-patch-check-fill text-[#cc8800] h-6 w-6 text-2xl" title="Paltuu Partner" />
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-lg text-gray-600">
                                <EnvironmentOutlined className="text-primary text-xl" />
                                <span className="text-base">{clinic.address}</span>
                                {clinic.google_maps_link && (
                                    <a
                                        href={clinic.google_maps_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary text-sm hover:underline ml-2"
                                    >
                                        (View on Map)
                                    </a>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-6">
                                {clinic.contact_number && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <PhoneOutlined className="text-primary" />
                                        <span>{clinic.contact_number}</span>
                                    </div>
                                )}
                                {clinic.operating_hours && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <ClockCircleOutlined className="text-primary" />
                                        <span>{clinic.operating_hours}</span>
                                    </div>
                                )}
                            </div>

                            {clinic.whatsapp_number && (
                                <Button
                                    type="primary"
                                    icon={<WhatsAppOutlined />}
                                    className="bg-[#25D366] hover:!bg-[#128C7E] border-0 h-10 rounded-xl font-semibold mt-2"
                                    onClick={() => handleWhatsApp(clinic.whatsapp_number)}
                                >
                                    Chat on WhatsApp
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Veterinarians</h2>
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
                    <div className="text-center py-10 bg-gray-50 rounded-xl text-gray-500">
                        No veterinarians listed for this clinic yet.
                    </div>
                )}
            </div>

            <Divider className="my-8" />

            {/* Reviews Section */}
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reviews</h2>
                        {reviewStats && (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-4xl font-bold text-primary">
                                        {reviewStats.averageRating.toFixed(1)}
                                    </span>
                                    <Rate
                                        disabled
                                        allowHalf
                                        value={reviewStats.averageRating}
                                        className="text-primary"
                                    />
                                </div>
                                <span className="text-gray-500">
                                    ({reviewStats.reviewsCount} reviews)
                                </span>
                            </div>
                        )}
                    </div>
                    <Button
                        type="primary"
                        onClick={handleReviewClick}
                        className="bg-primary h-10 px-6 rounded-xl font-semibold"
                    >
                        {isAuthenticated ? "Write a Review" : "Login to Review"}
                    </Button>
                </div>

                <div className="space-y-4">
                    {clinic.reviews && clinic.reviews.length > 0 ? (
                        clinic.reviews.map((review) => (
                            <ReviewCard key={review.review_id} review={review} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No reviews yet. Be the first to share your experience!
                        </div>
                    )}
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

const ReviewCard: React.FC<{ review: ClinicDetails['reviews'][0] }> = ({ review }) => (
    <div className="bg-gray-50 p-6 rounded-xl">
        <div className="flex items-start gap-4">
            {review.review_maker_profile_image_url ? (
                <img
                    src={review.review_maker_profile_image_url}
                    alt={review.review_maker_name}
                    className="w-12 h-12 rounded-full object-cover"
                />
            ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                        {review.review_maker_name?.charAt(0).toUpperCase() || "A"}
                    </span>
                </div>
            )}

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{review.review_maker_name}</h3>
                    <Rate
                        disabled
                        value={review.rating}
                        className="text-sm text-primary"
                    />
                </div>
                <p className="text-gray-600 mb-2">{review.review_content}</p>
                <div className="text-sm text-gray-400">
                    {new Date(review.review_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>
        </div>
    </div>
);

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

