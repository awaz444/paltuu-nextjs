"use client";
import React, { useState, useEffect } from "react";
import { PetWithImages } from "../../types/petWithImages";
import Navbar from "../../../components/navbar";
import AdoptionFormModal from "../../../components/AdoptionFormModal";
import LoginModal from "../../../components/LoginModal";
import RescueDetails from "../../../components/RescueDetails";
import { formatDistanceToNow } from "date-fns";
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

const { Title, Text, Paragraph } = Typography;

const PetDetailsPage: React.FC<{ params: { pet_id: string } }> = ({
    params,
}) => {
    const { pet_id } = params;
    const [pet, setPet] = useState<PetWithImages | null>(null);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [IsModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [primaryColor, setPrimaryColor] = useState("#000000");

    useSetPrimaryColor();

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

    useEffect(() => {
        const userString = localStorage.getItem("user");
        if (userString) {
            try {
                const user = JSON.parse(userString);
                setUserId(user?.id || null);
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchPetDetails = async () => {
            try {
                const res = await fetch(`/api/browse-pets/${pet_id}`);
                if (!res.ok) throw new Error("Pet not found");

                const petData = await res.json();
                setPet(petData);

                console.log("Fetched pet data:", petData);

                // Handle images
                if (petData.images && petData.images.length > 0) {
                    // Sort images by order
                    const sortedImages = [...petData.images].sort(
                        (a, b) => a.order - b.order
                    );
                    // Extract image URLs
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

        if (pet_id) fetchPetDetails();
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

        if (!userId) {
            setShowLoginModal(true);
            return;
        }

        try {
            const res = await fetch(`/api/my-profile/${userId}`);
            if (!res.ok) throw new Error("Failed to fetch profile");

            const profileData = await res.json();

            const isPhoneMissing = !profileData.phone_number;
            const isCityMissing = !profileData.city;

            if (isPhoneMissing || isCityMissing) {
                message.warning({
                    content:
                        "Please complete your profile by adding your phone number and city before applying.",
                    duration: 5,
                });
                setTimeout(() => {
                    window.location.href = "/my-profile";
                }, 2000);
                return;
            }

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

    const handleLoginSuccess = async () => {
        const userString = localStorage.getItem("user");
        if (userString) {
            const user = JSON.parse(userString);
            setUserId(user.id);

            try {
                const res = await fetch(`/api/my-profile/${user.id}`);
                if (!res.ok) throw new Error("Failed to fetch profile");

                const profileData = await res.json();

                if (!profileData.phone_number || !profileData.city) {
                    message.warning({
                        content:
                            "Please complete your profile by adding your phone number and city before applying.",
                        duration: 5,
                    });
                    setTimeout(() => {
                        window.location.href = "/my-profile";
                    }, 2000);
                    return;
                }
            } catch (error) {
                console.error("Error checking profile:", error);
                message.error("Failed to verify profile information");
            }
        }
        setShowLoginModal(false);
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
                return userId ? "Buy This Pet" : "Login to Buy";
            case "shop":
                return userId ? "Purchase from Shop" : "Login to Purchase";
            case "rescue":
                return userId ? "Help This Pet" : "Login to Help";
            case "adoption":
            default:
                return userId ? "Apply for Adoption" : "Login to Apply";
        }
    };

    const renderSourceInfo = () => {
        if (!pet) return null;

        switch (pet.listing_type) {
            case "adoption":
            case "sell":
                return (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Avatar
                            size={48}
                            src={pet.owner?.profile_image_url}
                            icon={<UserOutlined />}
                            className="bg-primary/10 text-primary"
                        />
                        <div>
                            <Text className="text-sm font-medium text-gray-500 block">
                                Owner
                            </Text>
                            <Text className="text-lg font-semibold text-gray-800">
                                {pet.owner?.name || "Unknown Owner"}
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
                return (
                    <Link href={`/shelters/${pet.shelter?.shelter_id}`}>
                        <div className="flex items-center gap-3 p-4 mt-6 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                            <Avatar
                                size={48}
                                src={pet.shelter?.logo_url}
                                className="bg-red-100 text-red-600"
                            />
                            <div>
                                <Text className="text-sm font-medium text-gray-500 block">
                                    Rescue Shelter
                                </Text>
                                <Text className="text-lg font-semibold text-gray-800">
                                    {pet.shelter?.shelter_name ||
                                        "Unknown Shelter"}
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

    if (error || !pet) {
        return (
            <div className="text-center mt-10">
                <Navbar />
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
            <LoginModal
                visible={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />
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
                                {pet.phone_number}
                            </p>
                            <p className="text-sm text-gray-500">
                                Phone Number
                            </p>
                        </div>
                        <Button
                            icon={<CopyOutlined className="text-primary" />}
                            size="small"
                            onClick={() => handleCopy(pet.phone_number)}
                            className="border-none shadow-none"
                        />
                    </div>

                    <Button
                        type="primary"
                        block
                        icon={<WhatsAppOutlined />}
                        className="bg-green-500 hover:bg-green-600 text-white h-12 rounded-lg flex items-center justify-center"
                        onClick={() => handleWhatsApp(pet.phone_number)}>
                        Message via WhatsApp
                    </Button>
                </div>
            </Modal>
            <Navbar />

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

                    <Card className="shadow-xl rounded-2xl overflow-hidden border-none">
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
                                                alt={`${pet.pet_name}-image-${
                                                    currentImageIndex + 1
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
                                                    className={`w-3 h-3 rounded-full ${
                                                        index ===
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
                                                    {pet.age > 0 &&
                                                        `${pet.age} ${
                                                            pet.age > 1
                                                                ? "years"
                                                                : "year"
                                                        }`}
                                                    {pet.age > 0 &&
                                                        pet.months > 0 &&
                                                        ", "}
                                                    {pet.months > 0 &&
                                                        `${pet.months} ${
                                                            pet.months > 1
                                                                ? "months"
                                                                : "month"
                                                        } old`}
                                                    {pet.age === 0 &&
                                                        pet.months === 0 &&
                                                        "Age not specified"}
                                                </span>
                                            </div>
                                        </div>
                                        <Tag
                                            color="#a03048"
                                            className="rounded-full px-3 py-1 mt-2">
                                            Listed{" "}
                                            {formatListingDate(pet.created_at)}
                                        </Tag>
                                    </div>

                                    {/* Listing Type Tag */}
                                    {pet.listing_type !== "shop" && (
                                        <Tag
                                            color={listingTypeInfo.color}
                                            className="rounded-full px-3 py-1 text-sm inline-flex items-center gap-1 w-fit"
                                            icon={listingTypeInfo.icon}>
                                            {listingTypeInfo.text}
                                        </Tag>
                                    )}

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
                                        <div className="col-span-2 bg-gray-50 p-4 rounded-xl h-full">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary text-white p-2 rounded-lg">
                                                    <EnvironmentOutlined className="text-lg" />
                                                </div>
                                                <div>
                                                    <Text className="text-sm font-semibold text-gray-500 block mb-1">
                                                        Location
                                                    </Text>
                                                    <Text className="text-base text-gray-800">
                                                        {pet.city}, {pet.area}
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price - Only show if applicable */}
                                        {hasValue(pet.price) && (
                                            <div className="bg-gray-50 p-4 rounded-xl h-full">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary text-white p-2 rounded-lg">
                                                        <DollarOutlined className="text-lg" />
                                                    </div>
                                                    <div>
                                                        <Text className="text-sm font-semibold text-gray-500 block mb-1">
                                                            {pet.listing_type ===
                                                            "sell"
                                                                ? "Price"
                                                                : "Adoption Fee"}
                                                        </Text>
                                                        <Text className="text-base text-gray-800">
                                                            PKR {pet.price}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Sex */}
                                        {hasValue(pet.sex) && (
                                            <div className="bg-gray-50 p-4 rounded-xl h-full">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary text-white p-2 rounded-lg">
                                                        {pet.sex === "male" ? (
                                                            <ManOutlined className="text-lg" />
                                                        ) : (
                                                            <WomanOutlined className="text-lg" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Text className="text-sm font-semibold text-gray-500 block mb-1">
                                                            Sex
                                                        </Text>
                                                        <Text className="text-base text-gray-800 capitalize">
                                                            {pet.sex}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons - Fixed at bottom */}
                                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                                    <button
                                        className={`flex-1 h-14 min-h-14 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 ${
                                            isAvailable
                                                ? "bg-primary text-white hover:bg-primary/90 transition-colors"
                                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        }`}
                                        onClick={handleAdoptClick}
                                        disabled={!isAvailable}>
                                        <HeartOutlined />
                                        {getActionButtonText()}
                                    </button>

                                    <button
                                        className={`flex-1 h-14 min-h-14 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 ${
                                            isAvailable
                                                ? "border-2 border-primary text-primary hover:bg-primary/5 transition-colors"
                                                : "border-2 border-gray-200 text-gray-500 cursor-not-allowed"
                                        }`}
                                        onClick={handleContactClick}
                                        disabled={!isAvailable}>
                                        <PhoneOutlined />
                                        {isAvailable
                                            ? "Contact Owner"
                                            : "Not Available"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Divider className="my-8 border-gray-200" />

                        <div className="space-y-6">
                            {hasValue(pet.description) && (
                                <div className="p-5 rounded-lg border border-gray-200">
                                    <Title
                                        level={3}
                                        className="text-gray-800 mb-3 flex items-center">
                                        <InfoCircleOutlined className="mr-2" />{" "}
                                        About {pet.pet_name}
                                    </Title>
                                    <Paragraph className="text-gray-700">
                                        {pet.description}
                                    </Paragraph>
                                </div>
                            )}

                            {(hasValue(pet.energy_level) ||
                                hasValue(pet.cuddliness_level)) && (
                                <div className="p-5 rounded-lg border border-gray-200">
                                    <Title
                                        level={3}
                                        className="text-gray-800 mb-4 flex items-center">
                                        Personality Traits
                                    </Title>

                                    <div className="space-y-5">
                                        {hasValue(pet.energy_level) && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Text className="font-medium text-gray-700">
                                                        Energy Level
                                                    </Text>
                                                    <Text className="font-semibold text-gray-800">
                                                        {pet.energy_level}/5
                                                    </Text>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={pet.energy_level}
                                                    disabled
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between mt-1 text-xs text-gray-600">
                                                    <span>Calm</span>
                                                    <span>Energetic</span>
                                                </div>
                                            </div>
                                        )}

                                        {hasValue(pet.cuddliness_level) && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Text className="font-medium text-gray-700">
                                                        Cuddliness Level
                                                    </Text>
                                                    <Text className="font-semibold text-gray-800">
                                                        {pet.cuddliness_level}/5
                                                    </Text>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={pet.cuddliness_level}
                                                    disabled
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between mt-1 text-xs text-gray-600">
                                                    <span>Independent</span>
                                                    <span>Affectionate</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                {(hasValue(pet.vaccinated) ||
                                    hasValue(pet.neutered) ||
                                    hasValue(pet.health_issues)) && (
                                    <div className="p-5 rounded-lg border border-gray-200">
                                        <Title
                                            level={3}
                                            className="text-gray-800 mb-3 flex items-center">
                                            <SafetyCertificateOutlined className="mr-2" />{" "}
                                            Health & Care
                                        </Title>
                                        <div className="space-y-2">
                                            {hasValue(pet.vaccinated) && (
                                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="font-medium">
                                                        Vaccinated
                                                    </span>
                                                    <span className="font-semibold">
                                                        {pet.vaccinated
                                                            ? "Yes"
                                                            : "No"}
                                                    </span>
                                                </div>
                                            )}
                                            {hasValue(pet.neutered) && (
                                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="font-medium">
                                                        Neutered/Spayed
                                                    </span>
                                                    <span className="font-semibold">
                                                        {pet.neutered
                                                            ? "Yes"
                                                            : "No"}
                                                    </span>
                                                </div>
                                            )}
                                            {hasValue(pet.health_issues) && (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="font-medium block mb-1">
                                                        Health Notes
                                                    </span>
                                                    <span className="text-gray-700">
                                                        {pet.health_issues}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(hasValue(pet.can_live_with_dogs) ||
                                    hasValue(pet.can_live_with_cats) ||
                                    hasValue(pet.must_have_someone_home)) && (
                                    <div className="p-5 rounded-lg border border-gray-200">
                                        <Title
                                            level={3}
                                            className="text-gray-800 mb-3 flex items-center">
                                            <HomeOutlined className="mr-2" />{" "}
                                            Living Preferences
                                        </Title>
                                        <div className="space-y-2">
                                            {hasValue(
                                                pet.can_live_with_dogs
                                            ) && (
                                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="font-medium">
                                                        Good with Dogs
                                                    </span>
                                                    <span className="font-semibold">
                                                        {pet.can_live_with_dogs
                                                            ? "Yes"
                                                            : "No"}
                                                    </span>
                                                </div>
                                            )}
                                            {hasValue(
                                                pet.can_live_with_cats
                                            ) && (
                                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="font-medium">
                                                        Good with Cats
                                                    </span>
                                                    <span className="font-semibold">
                                                        {pet.can_live_with_cats
                                                            ? "Yes"
                                                            : "No"}
                                                    </span>
                                                </div>
                                            )}
                                            {hasValue(
                                                pet.must_have_someone_home
                                            ) && (
                                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="font-medium">
                                                        Needs Company
                                                    </span>
                                                    <span className="font-semibold">
                                                        {pet.must_have_someone_home
                                                            ? "Yes"
                                                            : "No"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
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
                        userId={userId || ""}
                        city={pet.city}
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
