"use client";
import React, { useState, useEffect } from "react";
import { PetWithImages } from "../../types/petWithImages";
import Navbar from "../../../components/navbar";
import AdoptionFormModal from "../../../components/AdoptionFormModal";
import RescueDetails from "../../../components/RescueDetails";
import PetGallery from "./PetGallery";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { formatAge } from "@/utils/formatAge";
import { formatPhoneDisplay } from "@/utils/phone";

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

function buildCarouselImages(pet: PetWithImages): string[] {
    if (!pet.images || pet.images.length === 0) return [];
    return [...pet.images].sort((a, b) => a.order - b.order).map((img) => img.image_url);
}

const PetDetailsClient: React.FC<{
    params: { pet_id: string };
    initialPet?: PetWithImages;
    // Server-rendered sections (how adoption works, app, blogs) shown under the listing
    extras?: React.ReactNode;
}> = ({ params, initialPet, extras }) => {
    const { pet_id } = params;
    const router = useRouter();
    const { user, isAuthenticated, isHydrating } = useAuth();
    const searchParams = useSearchParams();
    const [pet, setPet] = useState<PetWithImages | null>(initialPet ?? null);
    const [carouselImages, setCarouselImages] = useState<string[]>(
        initialPet ? buildCarouselImages(initialPet) : []
    );
    const [loading, setLoading] = useState(!initialPet);
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

    // Fetch pet details on mount — skip if server already provided them
    useEffect(() => {
        if (initialPet) return;

        const fetchPetDetails = async () => {
            try {
                setLoading(true);

                const res = await fetch(`/api/v1/pets/${pet_id}`);
                if (!res.ok) throw new Error("Pet not found");

                const petData = await res.json();
                setPet(petData);

                if (petData.images && petData.images.length > 0) {
                    setCarouselImages(buildCarouselImages(petData));
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load pet details");
            } finally {
                setLoading(false);
            }
        };

        fetchPetDetails();
    }, [pet_id, initialPet]);

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
        const digits = formatPhoneDisplay(phone).digits;
        const whatsappUrl = `https://wa.me/${digits || phone}`;
        window.open(whatsappUrl, "_blank");
    };

    // Support line for questions about a listing (availability, scams, etc.).
    // The reference number lets support find the pet straight away.
    const handleAskPaltuu = () => {
        if (!pet) return;
        const text = `Hi Paltuu, I have a question about PET#${pet.pet_id} (${pet.pet_name}): ${window.location.origin}/browse-pets/${pet.pet_id}`;
        window.open(`https://wa.me/923394022468?text=${encodeURIComponent(text)}`, "_blank");
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
    const handleFormSubmit = (formData: any) => {};

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

        let label: string;
        let name: string;
        let avatar: string | null | undefined;
        let href: string | null = null;
        let fallbackIcon = <UserOutlined />;

        switch (pet.listing_type) {
            case "shop":
                label = "Shop";
                name = pet.shop?.shop_name || "Unknown Shop";
                avatar = pet.shop?.logo_url;
                href = pet.shop?.shop_id ? `/shops/${pet.shop.shop_id}` : null;
                fallbackIcon = <ShopOutlined />;
                break;
            case "rescue": {
                const rescueId = pet.shelter?.shelter_id || pet.shelter_id;
                label = "Rescue shelter";
                name = pet.shelter?.shelter_name || pet.owner_name || "Paws Rescue";
                avatar = pet.shelter?.logo_url || pet.owner_image || pet.profile_image_url;
                href = rescueId ? `/shelters/${rescueId}` : null;
                fallbackIcon = <ShopOutlined />;
                break;
            }
            default:
                label = "Listed by";
                name = pet.owner_name || "Member User";
                avatar = pet.owner_image || pet.profile_image_url;
        }

        const row = (
            <div className={`flex items-center gap-3 ${href ? "group" : ""}`}>
                <Avatar size={40} src={avatar} icon={fallbackIcon} className="flex-shrink-0 bg-gray-100 text-gray-500" />
                <div className="min-w-0">
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className={`truncate text-sm font-semibold text-gray-900 ${href ? "group-hover:text-primary" : ""}`}>
                        {name}
                    </div>
                </div>
            </div>
        );

        return href ? <Link href={href}>{row}</Link> : row;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

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
    const phoneDisplay = formatPhoneDisplay(pet.contact_number);
    const isForSale = pet.listing_type === "sell" || pet.listing_type === "shop";
    const priceText =
        isForSale && hasValue(pet.price) && !isNaN(Number(pet.price))
            ? `PKR ${Number(pet.price).toLocaleString()}`
            : null;
    // These columns default to false, so "No" usually just means "not filled in". Only show the "Yes" case.
    const yesNo = (v: boolean | null | undefined) => (v === true ? "Yes" : null);

    // People often type "None" / "N/A" into the health field; don't give that its own card.
    const hasHealthNotes =
        hasValue(pet.health_issues) &&
        !/^(none|no|n\/?a|nil|-+|nothing|no issues?)\.?$/i.test(pet.health_issues!.trim());

    const facts: Array<{ label: string; value: React.ReactNode }> = [
        { label: "Breed", value: pet.pet_breed || "Mixed breed" },
        { label: "Age", value: formatAge(pet.age_months) },
        { label: "Sex", value: hasValue(pet.sex) ? <span className="capitalize">{pet.sex}</span> : null },
        { label: "Location", value: [pet.area, pet.city].filter(Boolean).join(", ") || null },
        { label: "Vaccinated", value: yesNo(pet.vaccinated) },
        { label: "Neutered", value: yesNo(pet.neutered) },
    ].filter((f) => f.value);

    // Health tags read as caveats, everything else as selling points.
    const sortedTags = [...(pet.tags ?? [])].sort(
        (a, b) =>
            ["personality", "lifestyle", "compatibility", "health"].indexOf(a.tag_category) -
            ["personality", "lifestyle", "compatibility", "health"].indexOf(b.tag_category)
    );

    return (
        <>
            <Modal
                title="Contact Information"
                open={IsModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}>
                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center gap-3">
                            <span
                                className="text-2xl leading-none"
                                title={phoneDisplay.countryName ?? "Unknown country"}
                            >
                                {phoneDisplay.flag}
                            </span>
                            <div>
                                <p className="font-medium text-gray-800">
                                    {phoneDisplay.pretty}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {phoneDisplay.countryName
                                        ? `Phone Number · ${phoneDisplay.countryName}`
                                        : "Phone Number"}
                                </p>
                            </div>
                        </div>
                        <Button
                            icon={<CopyOutlined className="text-primary" />}
                            size="small"
                            onClick={() => pet.contact_number && handleCopy(pet.contact_number)}
                            className="border-none shadow-none"
                        />
                    </div>

                    <button
                        type="button"
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-500 text-[15px] font-semibold text-white transition-colors hover:bg-green-600"
                        onClick={() => pet.contact_number && handleWhatsApp(pet.contact_number)}>
                        <WhatsAppOutlined />
                        Message via WhatsApp
                    </button>

                    <div className="border-t border-gray-100 pt-3">
                        <button
                            type="button"
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 text-[15px] font-semibold text-gray-800 transition-colors hover:border-primary hover:text-primary"
                            onClick={handleAskPaltuu}>
                            <WhatsAppOutlined />
                            Ask Paltuu about this pet
                        </button>
                        <p className="mt-1.5 text-center text-xs text-gray-500">
                            Questions or concerns about this listing? Our team replies on WhatsApp.
                        </p>
                    </div>
                </div>
            </Modal>

            <div className="pet-details min-h-screen bg-gray-50 px-4 py-4 md:px-8 md:py-6">
                <div className="mx-auto max-w-6xl">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary">
                        <ArrowLeftOutlined className="text-xs" />
                        Back to listings
                    </button>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
                        {/* Gallery */}
                        <div className="lg:col-span-7">
                            <PetGallery
                                images={carouselImages}
                                alt={`${pet.pet_name} — ${pet.pet_breed || "pet"} available for adoption in ${pet.city}, Pakistan`}
                            />
                        </div>

                        {/* Summary panel — sticks alongside the gallery and story on desktop */}
                        <aside className="lg:col-span-5 lg:row-span-2 lg:self-start lg:sticky lg:top-24">
                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                                        isAvailable ? "bg-primary/10 text-primary" : "bg-red-50 text-red-600"
                                    }`}>
                                        {isAvailable ? listingTypeInfo.icon : null}
                                        {isAvailable ? listingTypeInfo.text : "Already adopted"}
                                    </span>
                                    {/* The listing's reference number. People message
                                        support asking "is this one still available?",
                                        usually with a screenshot; this gives them
                                        something exact to quote. */}
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(`PET#${pet.pet_id}`)}
                                        title="Copy this pet's reference number"
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 font-mono text-xs text-gray-500 transition-colors hover:border-primary hover:text-primary">
                                        PET#{pet.pet_id}
                                        <CopyOutlined className="text-[10px]" />
                                    </button>
                                </div>

                                <h1 className="mt-3 text-2xl font-semibold leading-tight text-gray-900 md:text-[28px]">
                                    {pet.pet_name}
                                </h1>
                                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                        <EnvironmentOutlined />
                                        {[pet.area, pet.city].filter(Boolean).join(", ")}
                                    </span>
                                    {pet.created_at && (
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarOutlined />
                                            Listed {formatListingDate(pet.created_at)}
                                        </span>
                                    )}
                                </p>

                                {priceText && (
                                    <p className="mt-3 text-xl font-semibold text-gray-900">{priceText}</p>
                                )}

                                {sortedTags.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {sortedTags.map((tag) => (
                                            <span
                                                key={tag.tag_id}
                                                title={tag.tag_category}
                                                className={`rounded-md border px-2.5 py-1 text-[13px] font-medium ${
                                                    tag.tag_category === "health"
                                                        ? "border-amber-200 bg-amber-50 text-amber-800"
                                                        : "border-primary/20 bg-primary/5 text-primary"
                                                }`}>
                                                {tag.tag_name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-4">
                                    {facts.map((f) => (
                                        <div key={f.label} className="min-w-0">
                                            <dt className="text-xs text-gray-500">{f.label}</dt>
                                            <dd className="truncate text-sm font-medium text-gray-900">{f.value}</dd>
                                        </div>
                                    ))}
                                </dl>

                                <div className="mt-4 border-t border-gray-100 pt-4">
                                    {renderSourceInfo()}
                                </div>

                                {/* Grid, not flex: flex-1 in a column flex container zeroes the
                                    basis and collapses the buttons to line height on mobile. */}
                                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                    <button
                                        type="button"
                                        className={`flex h-12 items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-semibold transition-colors ${
                                            isAvailable
                                                ? "bg-primary text-white hover:opacity-90"
                                                : "cursor-not-allowed bg-gray-100 text-gray-400"
                                        }`}
                                        onClick={handleAdoptClick}
                                        disabled={!isAvailable}>
                                        <HeartOutlined />
                                        {getActionButtonText()}
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-[15px] font-semibold transition-colors ${
                                            isAvailable
                                                ? "border-primary text-primary hover:bg-primary/5"
                                                : "cursor-not-allowed border-gray-200 text-gray-400"
                                        }`}
                                        onClick={handleContactClick}
                                        disabled={!isAvailable}>
                                        <PhoneOutlined />
                                        {isAvailable ? "Contact" : "Unavailable"}
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Story, health, rescue details */}
                        <div className="space-y-5 lg:col-span-7">
                            {hasValue(pet.description) && (
                                <section className="rounded-xl border border-gray-200 bg-white p-5">
                                    <h2 className="mb-2 text-base font-semibold text-gray-900">
                                        Description
                                    </h2>
                                    <p className="whitespace-pre-line break-words text-[15px] leading-7 text-gray-700">
                                        {pet.description}
                                    </p>
                                </section>
                            )}

                            {hasHealthNotes && (
                                <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
                                    <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-900">
                                        <MedicineBoxOutlined className="text-amber-600" />
                                        Health notes
                                    </h2>
                                    <p className="whitespace-pre-line text-[15px] leading-7 text-gray-800">
                                        {pet.health_issues}
                                    </p>
                                </section>
                            )}

                            {pet.listing_type === "rescue" && (
                                <RescueDetails
                                    rescue_story={pet.rescue_story || null}
                                    special_needs={pet.special_needs || []}
                                    medical_conditions={pet.medical_conditions || []}
                                />
                            )}
                        </div>
                    </div>
                    {/* AI Summary card hidden from frontend */}
                    {false && (() => {
                    if (!pet) return null;
                    return (
                    <Card className="shadow-2xl shadow-primary/5 rounded-[3rem] overflow-hidden border border-gray-50 mt-12">
                        <Title
                            level={3}
                            className="text-gray-800 mb-4 flex items-center">
                            {pet!.listing_type === "adoption" ||
                                pet!.listing_type === "rescue" ? (
                                <>
                                    <SafetyCertificateOutlined className="mr-2 text-primary" />
                                    Adoption Preparation Guide
                                </>
                            ) : pet!.listing_type === "sell" ||
                                pet!.listing_type === "shop" ? (
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
                                    {pet!.listing_type === "adoption" || pet!.listing_type === "rescue"
                                        ? `Want to know if ${pet!.pet_name} is the right fit for your home?`
                                        : pet!.listing_type === "sell" || pet!.listing_type === "shop"
                                            ? `Considering buying ${pet!.pet_name}? Get detailed information.`
                                            : `Want to know more about ${pet!.pet_name}?`}
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
                                    {pet!.listing_type === "adoption" || pet!.listing_type === "rescue"
                                        ? "Generating adoption guidance..."
                                        : pet!.listing_type === "sell" || pet!.listing_type === "shop"
                                            ? "Generating purchase information..."
                                            : "Generating pet summary..."}
                                </span>
                            </div>
                        ) : llmSummary ? (
                            <div
                                className={`rounded-lg p-6 ${pet!.listing_type === "adoption" || pet!.listing_type === "rescue"
                                    ? "bg-white border border-primary"
                                    : pet!.listing_type === "sell" || pet!.listing_type === "shop"
                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                                        : "bg-gray-50 border border-gray-200"
                                    }`}>
                                <div className="flex items-start mb-4 w-full">
                                    <div className="text-gray-800 text-base leading-relaxed w-full">
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mb-2 mt-4">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-base font-semibold text-gray-800 mb-2 mt-3">{children}</h3>,
                                                p: ({ children }) => <p className="mb-3 text-gray-700">{children}</p>,
                                                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                                                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                                em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                                                hr: () => <hr className="my-4 border-gray-200" />,
                                            }}
                                        >
                                            {llmSummary}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-white rounded border border-gray-100">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <InfoCircleOutlined className="mr-2" />
                                        <span>
                                            {pet!.listing_type === "adoption" || pet!.listing_type === "rescue"
                                                ? "This AI-generated guidance helps prepare for adoption. Always verify details with the owner or veterinarian."
                                                : pet!.listing_type === "sell" || pet!.listing_type === "shop"
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
                                    {pet!.listing_type === "adoption" || pet!.listing_type === "rescue"
                                        ? "Could not generate adoption guidance"
                                        : pet!.listing_type === "sell" || pet!.listing_type === "shop"
                                            ? "Could not generate purchase information"
                                            : "Could not generate pet summary"}
                                </p>
                                <Button type="primary" onClick={handleGenerateSummary} className="mt-2">
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </Card>
                    );
                    })()}


                    {extras}

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

export default PetDetailsClient;
