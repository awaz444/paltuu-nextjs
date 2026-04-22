"use client";
import React, { useState, useEffect } from "react";
import { PetWithImages } from "../../types/petWithImages";
import Navbar from "../../../components/navbar";
import AdoptionFormModal from "../../../components/AdoptionFormModal";
import RescueDetails from "../../../components/RescueDetails";
import { formatDistanceToNow } from "date-fns";
import { formatAiResponse } from "@/utils/formatAiResponse";
import { useAuth } from "@/context/AuthContext";
// removed useSession import
import { useRouter } from "next/navigation";
import { formatAge } from "@/utils/formatAge";

import {
    Spin,
    Card,
    Divider,
    Button,
    Modal,
    message,
    Carousel,
    Tag,
    Row,
    Col,
    Image,
    Typography,
    Badge,
    Avatar,
} from "antd";
import {
    CopyOutlined,
    WhatsAppOutlined,
    EnvironmentOutlined,
    InfoCircleOutlined,
    MedicineBoxOutlined,
    HeartOutlined,
    UserOutlined,
    PhoneOutlined,
    ShopOutlined,
    DollarOutlined,
    GiftOutlined,
    ArrowLeftOutlined,
    CameraOutlined,
    ManOutlined,
    WomanOutlined,
    CalendarOutlined,
    HomeOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
} from "@ant-design/icons";

import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { MoonLoader } from "react-spinners";
import "./styles.css";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const { Title, Text, Paragraph } = Typography;

const PetDetailsPage: React.FC<{ params: { pet_id: string } }> = ({
    params,
}) => {
    const { pet_id } = params;
    const router = useRouter();
    const { user, isAuthenticated, isHydrating } = useAuth();
    const searchParams = useSearchParams();
    const [pet, setPet] = useState<PetWithImages | null>(null);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [IsModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#000000");
    const [llmSummary, setLlmSummary] = useState<string | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryRequested, setSummaryRequested] = useState(false);

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    const formatListingDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    };

    const handleGenerateSummary = async () => {
        if (!pet || summaryLoading) return;

        setSummaryRequested(true);
        setSummaryLoading(true);

        try {
            const response = await fetch("/api/v1/ai/summary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    petData: pet,
                }),
            });

            if (!response.ok) throw new Error("Failed to fetch pet summary");

            const data = await response.json();
            if (data.success) {
                setLlmSummary(data.data);
            }
        } catch (error) {
            console.error("Error fetching pet summary:", error);
            message.error("Failed to generate summary");
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        const fetchPetDetails = async () => {
            try {
                setLoading(true);

                const res = await fetch(`/api/v1/pets/${pet_id}`);
                if (!res.ok) throw new Error("Pet not found");

                const petData = await res.json();
                setPet(petData);

                // Handle images
                if (petData.images && petData.images.length > 0) {
                    const sortedImages = [...petData.images].sort(
                        (a, b) => a.order - b.order
                    );
                    const imageUrls = sortedImages.map((img) => img.image_url);
                    setCarouselImages(imageUrls);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load pet details");
            } finally {
                setLoading(false);
            }
        };

        fetchPetDetails();
    }, [pet_id]);

    const hasValue = (value: any) => {
        return (
            value !== null && value !== undefined && value !== "" && value !== 0
        );
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success("Copied to clipboard!");
    };

    const handleWhatsApp = (phone: string) => {
        const whatsappUrl = `https://wa.me/${phone}`;
        window.open(whatsappUrl, "_blank");
    };

    const handleAdoptClick = async () => {
        if (pet?.adoption_status !== "available") return;

        if (!isAuthenticated || !user?.id) {
            message.info("Please log in to apply for adoption");
            router.push("/auth");
            return;
        }

        try {
            const res = await fetch(`/api/v1/profile`, { credentials: 'include' });
            if (!res.ok) throw new Error("Failed to fetch profile");

            const profileData = await res.json();

            setIsModalVisible(true);
        } catch (error) {
            console.error("Error checking profile:", error);
            message.error("Failed to verify profile information");
        }
    };

    const handleContactClick = () => {
        if (pet?.adoption_status !== "available") return;
        setIsModalOpen(true);
    };

    const handleModalClose = () => setIsModalVisible(false);
    const handleFormSubmit = (formData: any) => {
        // console.log("Form data submitted:", formData);
    };

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
        );
    };

    const getListingTypeInfo = () => {
        switch (pet?.listing_type) {
            case "adoption":
                return {
                    icon: <HeartOutlined />,
                    color: "green",
                    text: "Available for Adoption",
                    className: "listing-type-adoption",
                };
            case "sell":
                return {
                    icon: <DollarOutlined />,
                    color: "blue",
                    text: "Available for Sale",
                    className: "listing-type-sell",
                };
            case "rescue":
                return {
                    icon: <MedicineBoxOutlined />,
                    color: "red",
                    text: "Rescue - Needs Help",
                    className: "listing-type-rescue",
                };
            case "shop":
                return {
                    icon: <ShopOutlined />,
                    color: "purple",
                    text: "Available from Shop",
                    className: "listing-type-shop",
                };
            default:
                return {
                    icon: <InfoCircleOutlined />,
                    color: "default",
                    text: "Available",
                    className: "listing-type-default",
                };
        }
    };

    const getActionButtonText = () => {
        if (pet?.adoption_status !== "available") return "Not Available";

        switch (pet?.listing_type) {
            case "sell":
                return isAuthenticated && user?.id ? "Buy This Pet" : "Login to Buy";
            case "shop":
                return isAuthenticated && user?.id ? "Purchase from Shop" : "Login to Purchase";
            case "rescue":
                return isAuthenticated && user?.id ? "Adopt This Pet" : "Login to Adopt";
            case "adoption":
            default:
                return isAuthenticated && user?.id ? "Apply for Adoption" : "Login to Apply";
        }
    };

    const renderSourceInfo = () => {
        if (!pet) return null;

        switch (pet.listing_type) {
            case "adoption":
            case "sell":
                return (
                    <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-3xl border border-gray-100 shadow-sm">
                        <Avatar
                            size={64}
                            src={pet.owner_image || pet.profile_image_url}
                            icon={<UserOutlined />}
                            className="bg-white text-primary border-2 border-white shadow-md"
                        />
                        <div>
                            <Text className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40 block mb-1 leading-none">
                                Listed By
                            </Text>
                            <Text className="text-xl font-black text-gray-900 leading-tight">
                                {pet.owner_name || "Member User"}
                            </Text>
                        </div>
                    </div>
                );
            case "shop":
                return (
                    <Link href={`/shops/${pet.shop?.shop_id}`}>
                        <div className="flex items-center gap-3 p-4 mt-6 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                            <Avatar
                                size={48}
                                src={pet.shop?.logo_url}
                                icon={<ShopOutlined />}
                                className="bg-purple-100 text-purple-600"
                            />
                            <div>
                                <Text className="text-sm font-medium text-gray-500 block">
                                    Shop
                                </Text>
                                <Text className="text-lg font-semibold text-gray-800">
                                    {pet.shop?.shop_name || "Unknown Shop"}
                                </Text>
                            </div>
                        </div>
                    </Link>
                );
            case "rescue":
                const rescueName = pet.shelter?.shelter_name || pet.owner_name || "Paws Rescue";
                const rescueLogo = pet.shelter?.logo_url || pet.owner_image || pet.profile_image_url;
                const rescueId = pet.shelter?.shelter_id || pet.shelter_id;

                return (
                    <Link href={rescueId ? `/shelters/${rescueId}` : "#"}>
                        <div className="flex items-center gap-4 p-5 bg-red-50/30 rounded-3xl border border-red-100/50 shadow-sm transition-all hover:shadow-md group">
                            <Avatar
                                size={64}
                                src={rescueLogo}
                                icon={<ShopOutlined />}
                                className="bg-white text-red-500 border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                            />
                            <div>
                                <Text className="text-[10px] uppercase tracking-[0.2em] font-black text-red-400 block mb-1 leading-none">
                                    Rescue Shelter
                                </Text>
                                <Text className="text-xl font-black text-gray-900 leading-tight">
                                    {rescueName}
                                </Text>
                            </div>
                        </div>
                    </Link>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

    // Show loading while authentication is being determined
    if (isHydrating) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <MoonLoader size={30} color={primaryColor} />
                <span className="ml-3">Loading authentication...</span>
            </div>
        );
    }

    if (error || !pet) {
        return (
            <div className="text-center mt-10">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <Title level={2} className="text-gray-700">
                        {error || "Pet details not available"}
                    </Title>
                    <Button
                        type="primary"
                        className="mt-4"
                        onClick={() => (window.location.href = "/browse-pets")}>
                        Browse Other Pets
                    </Button>
                </div>
            </div>
        );
    }

    const listingTypeInfo = getListingTypeInfo();
    const isAvailable = pet.adoption_status === "available";

    return (
        <>
            <Modal
                title="Contact Information"
                visible={IsModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                className="rounded-lg">
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-700">
                                {pet.contact_number}
                            </p>
                            <p className="text-sm text-gray-500">
                                Phone Number
                            </p>
                        </div>
                        <Button
                            icon={<CopyOutlined className="text-primary" />}
                            size="small"
                            onClick={() => pet.contact_number && handleCopy(pet.contact_number)}
                            className="border-none shadow-none"
                        />
                    </div>

                    <Button
                        type="primary"
                        block
                        icon={<WhatsAppOutlined />}
                        className="bg-green-500 hover:bg-green-600 text-white h-16 rounded-2xl flex items-center justify-center text-base font-bold shadow-lg shadow-green-500/20"
                        onClick={() => pet.contact_number && handleWhatsApp(pet.contact_number)}>
                        Message via WhatsApp
                    </Button>
                </div>
            </Modal>

            <div className="pet-details min-h-screen bg-gray-50 py-8 px-4 md:px-8">
                <div className="mx-auto max-w-6xl">
                    {/* Breadcrumb */}
                    <div className="mb-2">
                        <Button
                            type="text"
                            onClick={() => window.history.back()}
                            className="flex items-center text-gray-600 p-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Back to listings
                        </Button>
                    </div>

                    <Card className="shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden border border-gray-50">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Image Gallery */}
                            <div className="lg:w-1/2">
                                {carouselImages.length > 0 ? (
                                    <div className="relative rounded-xl overflow-hidden">
                                        <div className="aspect-square bg-gray-100 rounded-xl">
                                            <img
                                                src={
                                                    carouselImages[
                                                    currentImageIndex
                                                    ]
                                                }
                                                alt={`${pet.pet_name}-image-${currentImageIndex + 1
                                                    }`}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        </div>

                                        {carouselImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full shadow-md">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-6 w-6"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 19l-7-7 7-7"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full shadow-md">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-6 w-6"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
                                                </button>
                                            </>
                                        )}

                                        <div className="flex justify-center mt-4 space-x-2">
                                            {carouselImages.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() =>
                                                        setCurrentImageIndex(
                                                            index
                                                        )
                                                    }
                                                    className={`w-3 h-3 rounded-full ${index ===
                                                        currentImageIndex
                                                        ? "bg-primary"
                                                        : "bg-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <UserOutlined className="text-5xl mb-2" />
                                            <p>No image available</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pet Information */}
                            <div className="lg:w-1/2 flex flex-col h-full">
                                <div className="flex-1 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Title
                                                level={1}
                                                className="mb-2 text-gray-800">
                                                {pet.pet_name}
                                            </Title>
                                            <div className="flex items-center gap-2 text-lg text-gray-600">
                                                <span>
                                                    {pet.pet_breed ||
                                                        "Mixed Breed"}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {formatAge(pet.age_months)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Listing Type Tag */}
                                    {/* {pet.listing_type !== "shop" && (
                                        <Tag
                                            color={listingTypeInfo.color}
                                            className="rounded-full px-3 py-1 text-sm inline-flex items-center gap-1 w-fit"
                                            icon={listingTypeInfo.icon}>
                                            {listingTypeInfo.text}
                                        </Tag>
                                    )} */}

                                    {/* Adoption Status Tag */}
                                    {!isAvailable && (
                                        <Tag
                                            color="red"
                                            className="rounded-full px-4 py-1 text-base">
                                            Already Adopted
                                        </Tag>
                                    )}

                                    {/* Source Information (Owner/Shop/Shelter) */}
                                    {renderSourceInfo()}

                                    {/* Information Grid - 2x2 layout */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Location */}
                                        <div className="col-span-2 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 h-full group hover:bg-white hover:shadow-xl transition-all duration-300">
                                            <div className="flex items-center gap-5">
                                                <div className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20">
                                                    <EnvironmentOutlined className="text-xl" />
                                                </div>
                                                <div>
                                                    <Text className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40 block mb-1">
                                                        Residence
                                                    </Text>
                                                    <Text className="text-xl font-bold text-gray-900">
                                                        {pet.city}, {pet.area}
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sex */}
                                        {hasValue(pet.sex) && (
                                            <div className="col-span-2 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 h-full group hover:bg-white hover:shadow-xl transition-all duration-300">
                                                <div className="flex items-center gap-5">
                                                    <div className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20">
                                                        {pet.sex === "male" ? <ManOutlined className="text-xl" /> : <WomanOutlined className="text-xl" />}
                                                    </div>
                                                    <div>
                                                        <Text className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40 block mb-1">
                                                            Sex
                                                        </Text>
                                                        <Text className="text-xl font-bold text-gray-900 capitalize">
                                                            {pet.sex}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons - Fixed at bottom */}
                                <div className="flex flex-col sm:flex-row gap-4 mt-12">
                                    <button
                                        className={`flex-1 h-[72px] text-lg font-black rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl transition-all ${isAvailable
                                            ? "bg-primary text-white hover:shadow-primary/30 hover:scale-[1.02]"
                                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                            }`}
                                        onClick={handleAdoptClick}
                                        disabled={!isAvailable}>
                                        <HeartOutlined />
                                        {getActionButtonText()}
                                    </button>

                                    <button
                                        className={`flex-1 h-[72px] text-lg font-black rounded-[2rem] flex items-center justify-center gap-3 transition-all border-2 ${isAvailable
                                            ? "border-primary text-primary hover:bg-primary/5 hover:scale-[1.02]"
                                            : "border-gray-200 text-gray-500 cursor-not-allowed"
                                            }`}
                                        onClick={handleContactClick}
                                        disabled={!isAvailable}>
                                        <PhoneOutlined />
                                        {isAvailable ? "Contact Listing" : "Unavailable"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Divider className="my-10 border-gray-100" />

                        <div className="space-y-10">
                            {hasValue(pet.description) && (
                                <div className="p-8 rounded-3xl border border-gray-100 bg-gray-50/30">
                                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                        <InfoCircleOutlined className="text-primary" />
                                        The Story
                                    </h3>
                                    <Paragraph className="text-gray-700 leading-relaxed text-lg font-medium italic">
                                        "{pet.description}"
                                    </Paragraph>
                                </div>
                            )}

                            {pet.tags && pet.tags.length > 0 && (
                                <div className="p-8 rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
                                    <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
                                        <TeamOutlined className="text-primary" />
                                        Attributes & Personality
                                    </h3>

                                    <div className="space-y-10 font-Montserrat">
                                        {["personality", "lifestyle", "compatibility", "health"].map((cat) => {
                                            const catTags = pet.tags?.filter(t => t.tag_category === cat);
                                            if (!catTags || catTags.length === 0) return null;

                                            return (
                                                <div key={cat} className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/40 leading-none">{cat}</span>
                                                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {catTags.map((tag) => (
                                                            <div
                                                                key={tag.tag_id}
                                                                className="px-6 py-3 rounded-2xl text-xs font-bold transition-all border-2 bg-white border-gray-100 text-gray-400">
                                                                {tag.tag_name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Additional Details (Health Issues if any) */}
                            {hasValue(pet.health_issues) && (
                                <div className="p-8 rounded-3xl border border-red-50 bg-red-50/20">
                                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                        <MedicineBoxOutlined className="text-red-500" />
                                        Health Notes
                                    </h3>
                                    <Paragraph className="text-red-800 font-bold">
                                        {pet.health_issues}
                                    </Paragraph>
                                </div>
                            )}
                        </div>
                    </Card>
                    <Card className="shadow-2xl shadow-primary/5 rounded-[3rem] overflow-hidden border border-gray-50 mt-12">
                        <Title
                            level={3}
                            className="text-gray-800 mb-4 flex items-center">
                            {pet.listing_type === "adoption" ||
                                pet.listing_type === "rescue" ? (
                                <>
                                    <SafetyCertificateOutlined className="mr-2 text-primary" />
                                    Adoption Preparation Guide
                                </>
                            ) : pet.listing_type === "sell" ||
                                pet.listing_type === "shop" ? (
                                <>
                                    <DollarOutlined className="mr-2 text-green-600" />
                                    Purchase Information
                                </>
                            ) : (
                                <>
                                    <InfoCircleOutlined className="mr-2 text-blue-600" />
                                    Pet Details Summary
                                </>
                            )}
                        </Title>

                        {!summaryRequested ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <InfoCircleOutlined className="text-3xl mb-3 text-gray-400" />
                                <p className="text-gray-500 mb-4">
                                    {pet.listing_type === "adoption" ||
                                        pet.listing_type === "rescue"
                                        ? `Want to know if ${pet.pet_name} is the right fit for your home?`
                                        : pet.listing_type === "sell" ||
                                            pet.listing_type === "shop"
                                            ? `Considering buying ${pet.pet_name}? Get detailed information.`
                                            : `Want to know more about ${pet.pet_name}?`}
                                </p>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleGenerateSummary}
                                    icon={<InfoCircleOutlined />}
                                    className="bg-primary hover:bg-primary/90">
                                    Generate AI Summary
                                </Button>
                            </div>
                        ) : summaryLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
                                <MoonLoader size={24} color={primaryColor} />
                                <span className="ml-3 text-gray-600 mt-3">
                                    {pet.listing_type === "adoption" ||
                                        pet.listing_type === "rescue"
                                        ? "Generating adoption guidance..."
                                        : pet.listing_type === "sell" ||
                                            pet.listing_type === "shop"
                                            ? "Generating purchase information..."
                                            : "Generating pet summary..."}
                                </span>
                            </div>
                        ) : llmSummary ? (
                            <div
                                className={`
                    rounded-lg p-6
                    ${pet.listing_type === "adoption" ||
                                        pet.listing_type === "rescue"
                                        ? "bg-white border border-primary"
                                        : pet.listing_type === "sell" ||
                                            pet.listing_type === "shop"
                                            ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                                            : "bg-gray-50 border border-gray-200"
                                    }
                `}>
                                <div className="flex items-start mb-4">

                                    <div className="text-gray-800 text-base leading-relaxed">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: formatAiResponse(
                                                    llmSummary
                                                ),
                                            }}
                                            className="ai-formatted-content"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-white rounded border border-gray-100">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <InfoCircleOutlined className="mr-2" />
                                        <span>
                                            {pet.listing_type === "adoption" ||
                                                pet.listing_type === "rescue"
                                                ? "This AI-generated guidance helps prepare for adoption. Always verify details with the owner or veterinarian."
                                                : pet.listing_type === "sell" ||
                                                    pet.listing_type === "shop"
                                                    ? "This AI-generated information provides purchase guidance. Contact the seller for exact details and pricing."
                                                    : "This AI-generated summary provides general information about the pet."}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <InfoCircleOutlined className="text-3xl mb-3 text-gray-400" />
                                <p className="text-gray-500 mb-2">
                                    {pet.listing_type === "adoption" ||
                                        pet.listing_type === "rescue"
                                        ? "Could not generate adoption guidance"
                                        : pet.listing_type === "sell" ||
                                            pet.listing_type === "shop"
                                            ? "Could not generate purchase information"
                                            : "Could not generate pet summary"}
                                </p>
                                <Button
                                    type="primary"
                                    onClick={handleGenerateSummary}
                                    className="mt-2">
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Add Rescue Details for rescue pets */}
                    {pet.listing_type === "rescue" && (
                        <RescueDetails
                            rescue_story={pet.rescue_story || null}
                            special_needs={pet.special_needs || []}
                            medical_conditions={pet.medical_conditions || []}
                        />
                    )}

                    <AdoptionFormModal
                        petId={parseInt(pet_id)}
                        userId={user?.id || ""}
                        visible={isModalVisible}
                        onClose={handleModalClose}
                        onSubmit={handleFormSubmit}
                    />
                </div>
            </div>
        </>
    );
};

export default PetDetailsPage;
