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
    FaHome,
    FaQuoteLeft,
    FaCheckCircle,
    FaCalendarAlt,
    FaCamera
} from "react-icons/fa";
import { MdRateReview, MdVerified } from "react-icons/md";
import { MoonLoader } from "react-spinners";
import VetGrid from "../../../../components/VetGrid";
import LoginModal from "../../../../components/LoginModal";
import { useAuth } from "@/context/AuthContext";
import { Clinic } from "../../../types/clinic";
import { Vet } from "../../../types/vet";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// DB stores hours either as a plain string ("11 AM - 10 PM") or as
// Google-style "Monday: 9 AM – 9 PM; Tuesday: ...". Parse the latter into
// rows so it renders as a day-by-day schedule instead of one run-on line.
function parseOperatingHours(text: string): { day: string; hours: string }[] | null {
    const parts = text.split(";").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) return null;

    const rows: { day: string; hours: string }[] = [];
    for (const part of parts) {
        const idx = part.indexOf(":");
        if (idx === -1) return null;
        const day = part.slice(0, idx).trim();
        const hours = part.slice(idx + 1).trim();
        if (!WEEKDAYS.includes(day)) return null;
        rows.push({ day, hours });
    }
    return rows;
}

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
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [form] = Form.useForm();
    const [activeGuideTab, setActiveGuideTab] = useState<"prep" | "emergency" | "schedule">("prep");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const isAdmin = isAuthenticated && user?.role === "admin";

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    const fetchClinicDetails = async () => {
        try {
            const response = await fetch(`/api/v1/clinics/${params.id}`);
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
            const response = await fetch(`/api/v1/clinics/reviews-stats?clinic_id=${params.id}`);
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

    const handlePhotoChange = async (file: File) => {
        if (!clinic) return;
        setIsUploadingPhoto(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const upRes = await fetch("/api/v1/admin/upload-clinic-logo", { method: "POST", body: fd });
            if (!upRes.ok) {
                const e = await upRes.json().catch(() => ({}));
                throw new Error(e.error || "Upload failed");
            }
            const { url } = await upRes.json();

            const patchRes = await fetch("/api/v1/admin/clinics", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clinic_id: clinic.clinic_id, logo_url: url }),
            });
            if (!patchRes.ok) throw new Error("Failed to save photo");

            setClinic({ ...clinic, logo_url: url });
            message.success("Clinic photo updated");
        } catch (err) {
            console.error("Error updating clinic photo:", err);
            message.error(err instanceof Error ? err.message : "Failed to update photo");
        } finally {
            setIsUploadingPhoto(false);
        }
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

        if (isSubmittingReview) return;

        const clinic_id = params.id;

        setIsSubmittingReview(true);
        try {
            const response = await fetch(`/api/v1/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target_id: clinic_id,
                    type: "clinic",
                    rating: values.rating,
                    comment: values.review_content,
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
        } finally {
            setIsSubmittingReview(false);
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

    const isHomeVet = clinic.listing_type === "home_vet";
    const coverageText = clinic.coverage_area || clinic.address;

    const googleMapsLink = (() => {
        if (isHomeVet) return undefined;
        if (!clinic.google_maps_link) {
            if (clinic.name && clinic.address) {
                return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${clinic.address}`)}`;
            }
            return undefined;
        }
        let link = clinic.google_maps_link.replace(/&amp;/g, "&");
        if (
            link === "https://maps.google.com" ||
            link === "https://www.google.com/maps" ||
            link === "https://maps.google.com/" ||
            link === "https://www.google.com/maps/"
        ) {
            if (clinic.name && clinic.address) {
                return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${clinic.address}`)}`;
            }
        }
        return link;
    })();

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
                                    <div className="relative w-full aspect-video mb-4 rounded-2xl border-2 border-gray-100 shadow-sm bg-gray-50 overflow-hidden">
                                        <img
                                            src={clinic.logo_url || "/placeholder-clinic.png"}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "/placeholder-clinic.png";
                                            }}
                                            alt={clinic.name}
                                            className="w-full h-full object-cover object-top cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setIsImagePreviewOpen(true)}
                                        />
                                        {isAdmin && (
                                            <label
                                                className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/75 text-white rounded-full p-2 shadow-lg cursor-pointer transition-colors"
                                                title="Change clinic photo"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {isUploadingPhoto ? (
                                                    <MoonLoader size={14} color="#ffffff" />
                                                ) : (
                                                    <FaCamera className="text-sm" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    disabled={isUploadingPhoto}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handlePhotoChange(file);
                                                        e.target.value = "";
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* Clinic Name */}
                                    <h1 className="text-2xl font-bold text-gray-900 mb-0 flex items-center gap-2 justify-center">
                                        {clinic.name}
                                        {clinic.is_verified && (
                                            <MdVerified className="text-primary text-xl shrink-0" title="Verified Clinic" />
                                        )}
                                    </h1>
                                    {clinic.is_paltuu_partner && (
                                        <span className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold uppercase px-3 py-1 rounded-full tracking-wide">
                                            Discounts Available
                                        </span>
                                    )}
                                </div>

                                {/* Google Reviews */}
                                {clinic.rating && (
                                    <div className="border-t border-gray-100 pt-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <img
                                                src="/google-reviews.png"
                                                alt="Google Reviews"
                                                className="h-10 object-contain"
                                            />
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className="w-4 h-4"
                                                        viewBox="0 0 20 20"
                                                        fill={i < Math.round(clinic.rating!) ? "#FBBC04" : "#E5E7EB"}
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                                <span className="text-sm font-bold text-gray-800">
                                                    {Number(clinic.rating).toFixed(1)}
                                                </span>
                                                {clinic.total_reviews && (
                                                    <span className="text-sm text-gray-400">
                                                        ({clinic.total_reviews.toLocaleString()})
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 text-center leading-tight mt-0.5">
                                                Rating sourced from Google. Paltuu is not responsible for Google review content.
                                            </p>
                                        </div>
                                    </div>
                                )}

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
                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                    {isHomeVet ? "Areas covered" : "Location"}
                                </h2>
                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="text-primary text-lg mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="text-gray-900 font-medium mb-1">
                                            {clinic.name}
                                        </div>
                                        <div className="text-gray-600 text-sm mb-2">
                                            {isHomeVet ? coverageText : clinic.address}
                                        </div>
                                        {!isHomeVet && googleMapsLink && (
                                            <a
                                                href={googleMapsLink}
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
                                                    onClick={() => handleCopy(clinic.contact_number || '')}
                                                    className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <FaCopy className="text-gray-600 text-xs" />
                                                    <span className="text-gray-700">Copy</span>
                                                </button>
                                                {clinic.whatsapp_number && (
                                                    <button
                                                        onClick={() => handleWhatsApp(clinic.whatsapp_number || '')}
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
                                                    {(() => {
                                                        const schedule = parseOperatingHours(clinic.operating_hours!);
                                                        const today = WEEKDAYS[(new Date().getDay() + 6) % 7];
                                                        if (!schedule) {
                                                            return (
                                                                <div className="text-sm font-medium text-gray-900 whitespace-pre-line">
                                                                    {clinic.operating_hours}
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className="space-y-1">
                                                                {schedule.map(({ day, hours }) => (
                                                                    <div
                                                                        key={day}
                                                                        className={`flex items-center justify-between text-sm gap-3 ${
                                                                            day === today ? "text-gray-900 font-semibold" : "text-gray-600"
                                                                        }`}
                                                                    >
                                                                        <span>{day}</span>
                                                                        <span className="text-right">{hours}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Clinic / Home Vet Type */}
                            {(isHomeVet || clinic.category) && (
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                                        {isHomeVet ? "Service Type" : "Clinic Type"}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            {isHomeVet ? (
                                                <FaHome className="text-primary text-sm" />
                                            ) : (
                                                <FaClinicMedical className="text-primary text-sm" />
                                            )}
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {isHomeVet ? "Home Vet" : clinic.category}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Discount Banner */}
                        {clinic.discount_details &&
                            !clinic.discount_details.toLowerCase().includes("no discount") &&
                            !clinic.discount_details.toLowerCase().includes("pending negotiation") && (
                                <div className="bg-primary rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
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
                                    location: isHomeVet ? coverageText : clinic.address
                                }))} />
                            ) : (
                                <div className="space-y-8">
                                    {/* Roster update info card */}
                                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/10">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                                                <FaClinicMedical className="text-primary text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 mb-1">
                                                    Veterinarian Directory Updating
                                                </h3>
                                                <p className="text-sm text-gray-600 leading-relaxed mb-0">
                                                    We are currently refreshing the registered veterinarians directory for <strong>{clinic.name}</strong>. In the meantime, you can reach out directly via phone or WhatsApp to book appointments, verify doctor availability, or inquire about emergency walk-ins.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interactive Guides Section */}
                                    <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/30">
                                        <div className="mb-6">
                                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                                Helpful Pet Care Resources
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-0">
                                                Prepare for your next clinic visit or check crucial health milestones.
                                            </p>
                                        </div>

                                        {/* Tabs Navigation */}
                                        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
                                            <button
                                                onClick={() => setActiveGuideTab("prep")}
                                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                                                    activeGuideTab === "prep"
                                                        ? "bg-primary text-white shadow-md shadow-primary/10"
                                                        : "bg-white text-gray-600 border border-gray-150 hover:bg-gray-50"
                                                }`}
                                            >
                                                <FaCheckCircle className="text-sm" />
                                                Visit Preparation
                                            </button>
                                            <button
                                                onClick={() => setActiveGuideTab("emergency")}
                                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                                                    activeGuideTab === "emergency"
                                                        ? "bg-primary text-white shadow-md shadow-primary/10"
                                                        : "bg-white text-gray-600 border border-gray-150 hover:bg-gray-50"
                                                }`}
                                            >
                                                <FaClinicMedical className="text-sm" />
                                                Emergency Signs
                                            </button>
                                            <button
                                                onClick={() => setActiveGuideTab("schedule")}
                                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                                                    activeGuideTab === "schedule"
                                                        ? "bg-primary text-white shadow-md shadow-primary/10"
                                                        : "bg-white text-gray-600 border border-gray-150 hover:bg-gray-50"
                                                }`}
                                            >
                                                <FaCalendarAlt className="text-sm" />
                                                Vaccination Guide
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="transition-all duration-300">
                                            {activeGuideTab === "prep" && (
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                            Medical Records
                                                        </h4>
                                                        <p className="text-xs text-gray-500 mb-0 leading-relaxed">
                                                            Bring files of past checkups, surgery histories, and a list of any current medications your pet takes.
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                            Symptom Checklist
                                                            </h4>
                                                        <p className="text-xs text-gray-500 mb-0 leading-relaxed">
                                                            Note down changes in appetite, behavior, lethargy, or breathing to share clearly with the doctor.
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                            Secure Carrier / Leash
                                                        </h4>
                                                        <p className="text-xs text-gray-500 mb-0 leading-relaxed">
                                                            Keep dogs secure on a short leash and transport cats inside a sturdy carrier to prevent vet-waiting stress.
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                            Comfort Treats
                                                        </h4>
                                                        <p className="text-xs text-gray-500 mb-0 leading-relaxed">
                                                            Bring small pieces of their absolute favorite treats to build positive associations with clinical environments.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {activeGuideTab === "emergency" && (
                                                <div className="space-y-3">
                                                    <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl">
                                                        <h4 className="text-xs font-bold text-red-700 mb-1 flex items-center gap-2">
                                                            ⚠️ Red Flags: Immediate Action Required
                                                        </h4>
                                                        <p className="text-xs text-red-600 mb-0 leading-relaxed">
                                                            If your pet is experiencing difficulty breathing, sudden collapse, deep wounds with active bleeding, ingestion of toxic items (like chocolate, onions, or human pills), or repeated vomiting, take them to emergency care immediately.
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-gray-900 mb-1">
                                                            What to do during transport:
                                                        </h4>
                                                        <ul className="list-disc list-inside text-xs text-gray-500 space-y-1 pl-1">
                                                            <li>Call the clinic ahead so they can prepare the triage room.</li>
                                                            <li>Keep your pet warm, calm, and wrapped in a clean blanket if they are in shock.</li>
                                                            <li>Avoid giving them any food, water, or human painkillers.</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            {activeGuideTab === "schedule" && (
                                                <div className="grid sm:grid-cols-2 gap-6">
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                                                            🐶 Puppy & Dog Core Vaccines
                                                        </h4>
                                                        <div className="space-y-2 text-xs text-gray-600">
                                                            <div className="flex justify-between"><span className="font-semibold text-gray-500">6-8 Weeks:</span> <span>DHPP 1st Dose</span></div>
                                                            <div className="flex justify-between"><span className="font-semibold text-gray-500">10-12 Weeks:</span> <span>DHPP 2nd + Bordetella</span></div>
                                                            <div className="flex justify-between"><span className="font-semibold text-gray-500">14-16 Weeks:</span> <span>DHPP 3rd + Rabies</span></div>
                                                            <div className="flex justify-between"><span className="font-semibold text-gray-500">Every 1-3 Years:</span> <span>DHPP + Rabies Booster</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                                                            🐱 Kitten & Cat Core Vaccines
                                                        </h4>
                                                        <div className="space-y-2 text-xs text-gray-600">
                                                            <div className="flex justify-between"><span className="font-semibold text-gray-500">6-8 Weeks:</span> <span>FVRCP 1st Dose</span></div>
                                                            <div className="flex justify-between"><span className="font-semibold text-gray-500">10-12 Weeks:</span> <span>FVRCP 2nd + FeLV</span></div>
                                                            <div className="flex justify-between"><span className="font-semibold text-gray-500">14-16 Weeks:</span> <span>FVRCP 3rd + Rabies</span></div>
                                                            <div className="flex justify-between"><span className="font-semibold text-gray-500">Every 1-3 Years:</span> <span>FVRCP + Rabies Booster</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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

            {/* Image Preview Modal */}
            <Modal
                open={isImagePreviewOpen}
                footer={null}
                onCancel={() => setIsImagePreviewOpen(false)}
                centered
                bodyStyle={{ padding: 0 }}
                closeIcon={null}
                width={800}
            >
                <div className="relative bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                    <img
                        src={clinic.logo_url || "/placeholder-clinic.png"}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-clinic.png";
                        }}
                        alt={clinic.name}
                        className="w-full h-auto max-h-[85vh] object-contain"
                    />
                    <button
                        onClick={() => setIsImagePreviewOpen(false)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-all shadow-md text-xl"
                    >
                        ✕
                    </button>
                </div>
            </Modal>

            {/* Review Modal */}
            <ReviewModal
                open={isModalOpen}
                onClose={handleCloseModal}
                form={form}
                onSubmit={handleSubmit}
                isSubmitting={isSubmittingReview}
            />
        </div>
    );
}

const ReviewModal: React.FC<{
    open: boolean;
    onClose: () => void;
    form: any;
    onSubmit: (values: any) => void;
    isSubmitting: boolean;
}> = ({ open, onClose, form, onSubmit, isSubmitting }) => (
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
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting && <MoonLoader size={16} color="#ffffff" />}
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
            </Form.Item>
        </Form>
    </Modal>
);