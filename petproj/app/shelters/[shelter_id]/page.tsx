"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../components/navbar";
import RescuePetGrid from "../../../components/PartnerPetGrid";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { MoonLoader } from "react-spinners";
import "./styles.css";

interface Shelter {
    shelter_id: number;
    shelter_name: string;
    address: string;
    description: string;
    logo_url: string;
    capacity: number;
    created_at: string;
    approved: boolean;
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
    emergency_contacts: {
        primary_phone: string;
        backup_phone: string;
        vet_name: string;
        vet_phone: string;
    } | null;
    social_media: Array<{
        platform: string;
        url: string;
    }>;
    facility_photos: string[];
    verification: {
        reg_certificate_url: string;
        cnic_front_url: string;
        cnic_back_url: string;
    } | null;
    animal_types: Array<{
        id: number;
        name: string;
    }>;
    pets: any[];
}

const ShelterProfilePage: React.FC = () => {
    const params = useParams();
    const shelter_id = params.shelter_id as string;
    const [shelter, setShelter] = useState<Shelter | null>(null);
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
        const fetchShelterDetails = async () => {
            try {
                const res = await fetch(`/api/v1/rescue/shelters/${shelter_id}`);
                if (!res.ok) throw new Error("Shelter not found");

                const shelterData = await res.json();
                setShelter(shelterData);
            } catch (err) {
                console.error(err);
                setError("Failed to load shelter details");
            } finally {
                setLoading(false);
            }
        };

        if (shelter_id) fetchShelterDetails();
    }, [shelter_id]);

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

    if (error || !shelter) {
        return (
            <div className="text-center mt-10">

                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <h2 className="text-2xl font-bold text-gray-700">
                        {error || "Shelter details not available"}
                    </h2>
                    <button
                        className="mt-4 p-3 bg-primary text-white rounded-3xl w-48"
                        onClick={() => (window.location.href = "/browse-pets")}>
                        Browse Other Shelters
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>

            <div className="shelter-profile min-h-screen bg-gray-50 py-8 px-4 md:px-8">
                <div className="mx-auto max-w-6xl">
                    {/* Header Section */}
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-8 p-6">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Shelter Logo and Basic Info */}
                            <div className="flex-shrink-0">
                                <div
                                    className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${shelter.logo_url})`,
                                    }}>
                                    {!shelter.logo_url && (
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
                                        {shelter.shelter_name}
                                    </h1>
                                    {shelter.approved && (
                                        <i className="bi bi-patch-check-fill h-5 w-5 text-[#cc8800]" />
                                    )}
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
                                        <span>{shelter.address}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                        </svg>
                                        <span>
                                            Capacity: {shelter.capacity} animals
                                        </span>
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
                                            {formatDate(shelter.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {shelter.description && (
                                    <p className="text-gray-700 mb-6">
                                        {shelter.description}
                                    </p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3 mt-6">
                                    <button
                                        className="p-3 bg-primary text-white rounded-2xl flex items-center gap-2"
                                        onClick={() =>
                                            handleCopy(
                                                shelter.contact.phone_number
                                            )
                                        }>
                                        <svg
                                            className="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        Call Shelter
                                    </button>
                                    <button
                                        className="p-3 bg-green-500 text-white rounded-2xl flex items-center gap-2 hover:bg-green-600"
                                        onClick={() =>
                                            handleWhatsApp(
                                                shelter.contact.phone_number
                                            )
                                        }>
                                        <svg
                                            className="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                        </svg>
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            className={`py-3 px-6 font-medium ${activeTab === "pets"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-500"
                                }`}
                            onClick={() => setActiveTab("pets")}>
                            Available Pets
                        </button>
                        <button
                            className={`py-3 px-6 font-medium ${activeTab === "info"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-500"
                                }`}
                            onClick={() => setActiveTab("info")}>
                            Shelter Information
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "pets" ? (
                        <>
                            {shelter.pets && shelter.pets.length > 0 ? (
                                <RescuePetGrid pets={shelter.pets} />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Contact Information */}
                            <div className="bg-white rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-4">
                                    Contact Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-medium">
                                                WhatsApp Contact
                                            </p>
                                            <p>{shelter.contact.phone_number}</p>
                                        </div>
                                        <button
                                            className="p-2 rounded-full hover:bg-gray-200"
                                            onClick={() =>
                                                handleWhatsApp(
                                                    shelter.contact.phone_number
                                                )
                                            }>
                                            <svg
                                                className="w-5 h-5"
                                                fill="#a03048"
                                                viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="font-medium">
                                            Primary Contact
                                        </p>
                                        <p>{shelter.contact.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Operating Hours */}
                            <div className="bg-white rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-4">
                                    Operating Hours
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="font-medium">
                                            Availability
                                        </p>
                                        <p className="text-green-600 font-semibold">24/7 Open</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="font-medium">
                                            Preferred Visit Hours
                                        </p>
                                        <p className="text-blue-600 font-semibold">11:00 AM - 8:00 PM</p>
                                    </div>
                                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                                        <p className="text-sm text-yellow-800">
                                            <span className="font-medium">Note:</span> While we're open 24/7 for emergencies,
                                            we recommend visiting during preferred hours for the best experience.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Information */}
                            <div className="bg-white rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-4">
                                    Bank Information
                                </h3>
                                {shelter.bank_info ? (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium">
                                                Account Title
                                            </p>
                                            <p>
                                                {
                                                    shelter.bank_info
                                                        .account_title
                                                }
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium">
                                                Bank Name
                                            </p>
                                            <p>{shelter.bank_info.bank_name}</p>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-medium">
                                                    IBAN
                                                </p>
                                                <p>{shelter.bank_info.iban}</p>
                                            </div>
                                            <button
                                                className="p-2 rounded-full hover:bg-gray-200"
                                                onClick={() =>
                                                    handleCopy(
                                                        shelter.bank_info!.iban
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

                            {/* Emergency Contacts */}
                            {shelter.emergency_contacts && (
                                <div className="bg-white rounded-2xl p-6 md:col-span-2">
                                    <h3 className="text-xl font-semibold mb-4">
                                        Emergency Contacts
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium">
                                                Primary Phone
                                            </p>
                                            <p>
                                                {
                                                    shelter.emergency_contacts
                                                        .primary_phone
                                                }
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium">
                                                Backup Phone
                                            </p>
                                            <p>
                                                {shelter.emergency_contacts
                                                    .backup_phone ||
                                                    "Not provided"}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium">
                                                Vet Name
                                            </p>
                                            <p>
                                                {shelter.emergency_contacts
                                                    .vet_name || "Not provided"}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="font-medium">
                                                Vet Phone
                                            </p>
                                            <p>
                                                {shelter.emergency_contacts
                                                    .vet_phone ||
                                                    "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Animal Types Accepted */}
                            {shelter.animal_types.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 md:col-span-2">
                                    <h3 className="text-xl font-semibold mb-4">
                                        Animal Types Accepted
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {shelter.animal_types.map((type) => (
                                            <span
                                                key={type.id}
                                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                {type.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Facility Photos */}
                            {shelter.facility_photos.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 md:col-span-2">
                                    <h3 className="text-xl font-semibold mb-4">
                                        Facility Photos
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {shelter.facility_photos.map(
                                            (photo, index) => (
                                                <img
                                                    key={index}
                                                    src={photo}
                                                    alt={`Facility photo ${index + 1
                                                        }`}
                                                    className="rounded-xl object-cover h-48 w-full"
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Social Media */}
                            {shelter.social_media.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 md:col-span-2">
                                    <h3 className="text-xl font-semibold mb-4">
                                        Social Media
                                    </h3>
                                    <div className="space-y-2">
                                        {shelter.social_media.map(
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

export default ShelterProfilePage;
