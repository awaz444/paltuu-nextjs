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
import Navbar from "../../../components/navbar";
import './styles.css'
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { MoonLoader } from "react-spinners";

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
    useSetPrimaryColor();


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
        // Ensure the phone number starts with +92
        let formattedPhone = phone.trim();

        // Check if the number starts with 0 (e.g., 03001234567) and replace with +92
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "+92" + formattedPhone.slice(1);
        } else if (!formattedPhone.startsWith("+92")) {
            // If the number doesn't start with +92, assume invalid format
            message.error("Invalid phone number format. Please use a valid Pakistani number.");
            return;
        }
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

    const [primaryColor, setPrimaryColor] = useState("#A03048"); // Default fallback color

    useEffect(() => {
        // Get the computed style of the `--primary-color` CSS variable
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
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <Card className="shadow-lg rounded-2xl overflow-hidden">
                    {/* Vet Profile Header */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-shrink-0">
                            <img
                                src={vetDetails.profile_image_url || "/placeholder.jpg"}
                                alt={vetDetails.vet_name}
                                className="w-40 h-40 rounded-full object-cover border-4 border-primary/20"
                            />
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <h1 className="text-3xl font-bold text-gray-800">{vetDetails.vet_name}</h1>
                                {vetDetails.profile_verified && <i className="bi bi-patch-check-fill text-[#cc8800] h-5 w-5" />}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-lg text-gray-600">
                                    <EnvironmentOutlined className="text-primary" />
                                    <span>{vetDetails.clinic_name}, {vetDetails.city}</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <div className="bg-primary/10 py-1 rounded-xl">
                                        <span className="font-semibold text-primary">Best Suited For: </span>
                                        {vetDetails.specializations.map((spec) => (
                                            <Tag key={spec.category_id} className="rounded-lg bg-primary/10 text-primary border-0">
                                                {spec.category_name}s
                                            </Tag>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div className="bg-primary/10 py-1 rounded-xl">
                                        <span className="font-semibold text-primary">Minimum Consultation Fee:</span>
                                        <span className="ml-2">PKR {vetDetails.minimum_fee}</span>
                                    </div>

                                    {/* <button
                                        onClick={() => setIsModalVisible(true)}
                                        className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                        Book Appointment
                                    </button> */}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Divider className="my-6" />

                    {/* Main Content Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {vetDetails.bio && (
                                <Section title="About">
                                    <p className="text-gray-600 leading-relaxed">{vetDetails.bio}</p>
                                </Section>
                            )}

                            <Section title="Best Suited For">
                                <div className="flex flex-wrap gap-2">
                                    {vetDetails.specializations.map((spec) => (
                                        <Tag key={spec.category_id} className="rounded-lg bg-primary/10 text-primary border-0">
                                            {spec.category_name}s
                                        </Tag>
                                    ))}
                                </div>
                            </Section>

                            <Section title="Qualifications">
                                <div className="space-y-4">
                                    {vetDetails.qualifications.map((qual) => (
                                        <div key={qual.qualification_id} className="bg-gray-50 p-4 rounded-xl">
                                            <h3 className="font-semibold text-gray-800">{qual.qualification_name}</h3>
                                            <p className="text-gray-600">{qual.year_acquired} • {qual.qualification_note}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <Section title="Availability">
                                <div className="grid grid-cols-2 gap-4">
                                    {vetDetails.availability.map((avail) => (
                                        <div key={avail.availability_id} className="bg-gray-50 p-4 rounded-xl">
                                            <div className="font-medium text-gray-800">{avail.day_of_week}</div>
                                            <div className="text-primary">
                                                {avail.start_time} - {avail.end_time}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            <Section title="Contact">
                                <div className="space-y-3">
                                    <ContactInfo
                                        label="Phone Number"
                                        value={vetDetails.contact_details}
                                        onCopy={() => handleCopy(vetDetails.contact_details)}
                                        onWhatsApp={() => handleWhatsApp(vetDetails.contact_details)}
                                    />
                                    <ContactInfo
                                        label="Email Address"
                                        value={vetDetails.email}
                                        onCopy={() => handleCopy(vetDetails.email)}
                                    />
                                </div>
                            </Section>
                        </div>
                    </div>

                    <Divider className="my-8" />

                    {/* Reviews Section */}
                    <Section title="Reviews">
                        <div className="flex items-center justify-between mb-6">
                            {reviewStats && (
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-primary">
                                            {reviewStats.averageRating.toFixed(1)}
                                        </div>
                                        <Rate
                                            disabled
                                            value={reviewStats.averageRating}
                                            className="text-primary [&>.ant-rate-star-zero>div]:text-gray-300"
                                        />
                                    </div>
                                    <div className="text-gray-600">
                                        {reviewStats.approvedCount} verified review(s)
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Write a Review
                            </button>
                        </div>

                        <div className="space-y-6">
                            {vetDetails.reviews.length > 0 ? (
                                vetDetails.reviews.map((review) => (
                                    <ReviewCard key={review.review_id} review={review} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No reviews yet. Be the first to share your experience!
                                </div>
                            )}
                        </div>
                    </Section>
                </Card>
            </div>

            {/* Modals */}
            <ReviewModal
                open={isModalOpen}
                onClose={handleCloseModal}
                form={form}
                onSubmit={handleSubmit}
            />
        </>
    );
}

// Helper Components
const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
    title,
    icon,
    children
}) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
            {icon && React.cloneElement(icon as React.ReactElement, { className: "text-primary text-lg" })}
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        </div>
        {children}
    </div>
);

const ContactInfo: React.FC<{
    label: string;
    value: string;
    onCopy: () => void;
    onWhatsApp?: () => void
}> = ({ label, value, onCopy, onWhatsApp }) => (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
        <div>
            <div className="text-sm text-gray-500">{label}</div>
            <div className="font-medium text-gray-800">{value}</div>
        </div>
        <div className="flex gap-2">
            <button
                onClick={onCopy}
                className="p-2 hover:bg-gray-100 rounded-lg text-primary"
            >
                <CopyOutlined className="text-lg" />
            </button>
            {onWhatsApp && (
                <button
                    onClick={onWhatsApp}
                    className="p-2 hover:bg-gray-100 rounded-lg text-primary"
                >
                    <WhatsAppOutlined className="text-lg" />
                </button>
            )}
        </div>
    </div>
);

const ReviewCard: React.FC<{ review: VetDetails['reviews'][0] }> = ({ review }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
            {review.review_maker_profile_image_url ? (
                <img
                    src={review.review_maker_profile_image_url}
                    alt={review.review_maker_name}
                    className="w-12 h-12 rounded-full object-cover"
                />
            ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                        {review.review_maker_name.charAt(0).toUpperCase()}
                    </span>
                </div>
            )}

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{review.review_maker_name}</h3>
                    <Rate
                        disabled
                        value={review.rating}
                        className="text-sm [&>.ant-rate-star]:mr-1 text-primary"
                    />
                </div>
                <p className="text-gray-600 mb-2">{review.review_content}</p>
                <div className="text-sm text-gray-500">
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
                name="email"
                label="Your Email"
                rules={[{ required: true, message: 'Please enter your email' }]}
            >
                <Input
                    placeholder="example@email.com"
                    className="rounded-lg p-3 hover:border-primary focus:border-primary"
                />
            </Form.Item>

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
                rules={[{ required: true, message: 'Please write your review' }]}
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