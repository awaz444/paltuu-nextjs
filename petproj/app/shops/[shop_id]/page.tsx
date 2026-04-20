"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../components/navbar";
import PartnerPetGrid from "../../../components/PartnerPetGrid";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { MoonLoader } from "react-spinners";

interface Shop {
    shop_id: number;
    shop_name: string;
    address: string;
    logo_url: string;
    created_at: string;
    contact: {
        user_id: number;
        name: string;
        email: string;
        phone_number: string;
        profile_image_url: string;
    };
    bank_info: {
        account_title: string;
        iban: string;
        bank_name: string;
    } | null;
    social_media: Array<{
        platform: string;
        url: string;
    }>;
    pets: any[];
}

const ShopProfilePage: React.FC = () => {
    const params = useParams();
    const shop_id = params.shop_id as string;
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#000000");
    const [activeTab, setActiveTab] = useState("pets");

    

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    useEffect(() => {
        const fetchShopDetails = async () => {
            try {
                const res = await fetch(`/api/v1/shops/${shop_id}`);
                if (!res.ok) throw new Error("Shop not found");

                const shopData = await res.json();
                setShop(shopData);
            } catch (err) {
                console.error(err);
                setError("Failed to load shop details");
            } finally {
                setLoading(false);
            }
        };

        if (shop_id) fetchShopDetails();
    }, [shop_id]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const handleWhatsApp = (phone: string) => {
        const whatsappUrl = `https://wa.me/${phone}`;
        window.open(whatsappUrl, "_blank");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

    if (error || !shop) {
        return (
            <div className="text-center mt-10">
                
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <h2 className="text-2xl font-bold text-gray-700">
                        {error || "Shop details not available"}
                    </h2>
                    <button
                        className="mt-4 p-3 bg-primary text-white rounded-3xl w-48"
                        onClick={() => (window.location.href = "/browse-pets")}>
                        Browse Other Shops
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            
            <div className="shop-profile min-h-screen bg-gray-50 py-8 px-4 md:px-8">
                <div className="mx-auto max-w-6xl">
                    {/* Header Section */}
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-8 p-6">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Shop Logo and Basic Info */}
                            <div className="flex-shrink-0">
                                <div
                                    className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${shop.logo_url})`,
                                    }}>
                                    {!shop.logo_url && (
                                        <svg
                                            className="w-16 h-16 text-gray-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <h1 className="text-3xl font-bold text-gray-800">
                                        {shop.shop_name}
                                    </h1>
                                </div>

                                <div className="flex flex-wrap gap-4 mb-4 text-gray-600">
                                    <div className="flex items-center">
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span>{shop.address}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span>
                                            Member Since:{" "}
                                            {formatDate(shop.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3 mt-6">
                                    <button
                                        className="p-3 bg-primary text-white rounded-2xl flex items-center gap-2"
                                        onClick={() =>
                                            handleCopy(
                                                shop.contact.phone_number
                                            )
                                        }>
                                        <svg
                                            className="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        Call Shop
                                    </button>
                                    <a
                                        href={`mailto:${shop.contact.email}`}
                                        className="p-3 bg-gray-200 text-gray-700 rounded-2xl flex items-center gap-2">
                                        <svg
                                            className="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            className={`py-3 px-6 font-medium ${
                                activeTab === "pets"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-500"
                            }`}
                            onClick={() => setActiveTab("pets")}>
                            Available Pets
                        </button>
                        <button
                            className={`py-3 px-6 font-medium ${
                                activeTab === "info"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-500"
                            }`}
                            onClick={() => setActiveTab("info")}>
                            Shop Information
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "pets" ? (
                        <>
                            {shop.pets && shop.pets.length > 0 ? (
                                <PartnerPetGrid pets={shop.pets} />
                            ) : (
                                <div className="bg-white rounded-2xl p-12 text-center">
                                    <svg
                                        className="w-16 h-16 text-gray-400 mx-auto mb-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        No pets available at this time
                                    </h3>
                                    <p className="text-gray-500">
                                        Check back later for new arrivals
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contact Information */}
                            <div className="bg-white rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-4">
                                    Contact Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-medium">
                                                Phone Number
                                            </p>
                                            <p>
                                                {shop.contact.phone_number}
                                            </p>
                                        </div>
                                        <button
                                            className="p-2 rounded-full hover:bg-gray-200"
                                            onClick={() =>
                                                handleCopy(
                                                    shop.contact.phone_number
                                                )
                                            }>
                                            <svg
                                                className="w-5 h-5"
                                                fill="currentColor"
                                                viewBox="0 0 20 20">
                                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-medium">
                                                Email Address
                                            </p>
                                            <p>{shop.contact.email}</p>
                                        </div>
                                        <button
                                            className="p-2 rounded-full hover:bg-gray-200"
                                            onClick={() =>
                                                handleCopy(
                                                    shop.contact.email
                                                )
                                            }>
                                            <svg
                                                className="w-5 h-5"
                                                fill="currentColor"
                                                viewBox="0 0 20 20">
                                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="font-medium">
                                            Primary Contact
                                        </p>
                                        <p>{shop.contact.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Information */}
                            <div className="bg-white rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-4">
                                    Bank Information
                                </h3>
                                {shop.bank_info ? (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium">
                                                Account Title
                                            </p>
                                            <p>
                                                {shop.bank_info.account_title}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium">
                                                Bank Name
                                            </p>
                                            <p>{shop.bank_info.bank_name}</p>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-medium">
                                                    IBAN
                                                </p>
                                                <p>{shop.bank_info.iban}</p>
                                            </div>
                                            <button
                                                className="p-2 rounded-full hover:bg-gray-200"
                                                onClick={() =>
                                                    handleCopy(
                                                        shop.bank_info!.iban
                                                    )
                                                }>
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20">
                                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">
                                        No bank information available
                                    </p>
                                )}
                            </div>

                            {/* Social Media */}
                            {shop.social_media.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 md:col-span-2">
                                    <h3 className="text-xl font-semibold mb-4">
                                        Social Media
                                    </h3>
                                    <div className="space-y-2">
                                        {shop.social_media.map(
                                            (item, index) => (
                                                <a
                                                    key={index}
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    {item.platform}
                                                </a>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ShopProfilePage;