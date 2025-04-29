"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RescueGrid from "@/components/RescueGrid";
import { MoonLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { fetchPetCategories } from "../../store/slices/petCategoriesSlice";
import useSWR from "swr";
import {
    MapPinIcon,
    GlobeAltIcon,
    HeartIcon,
    PhoneIcon,
} from "@heroicons/react/24/outline";
import {
    FaInstagram,
    FaFacebook,
    FaDog,
    FaCat,
    FaPaw,
    FaHandHoldingHeart,
    FaHouseUser,
    FaMedkit,
} from "react-icons/fa";
import Navbar from "../../../components/navbar";
import "./styles.css";

// API fetcher function
const fetcher: (url: string) => Promise<any> = (url) =>
    fetch(url).then((res) => res.json());

interface RescuePet {
    rescue_id: number;
    rescue_org_id: number;
    pet_name: string;
    pet_type: number;
    approximate_age_lower: number;
    approximate_age_higher: number;
    description: string;
    rescue_story: string;
    rescue_date: string;
    urgency_level: "critical" | "high" | "moderate" | "stable";
    status: "at shelter" | "adopted" | "fostered" | "medical care";
    medical_conditions: {
        condition: string;
        treatment_cost?: number;
        treated?: boolean;
    }[];
    special_needs: string[];
    current_location: string | null;
    sex: string;
    images: string[];
    adoption_fee: number | null;
    foster_available: boolean;
    vaccinated: boolean | null;
    neutered: boolean | null;
    temperament: "calm" | "energetic" | "anxious" | "playful" | "independent";
    shelter: {
        id: number;
        name: string;
        profilePicture: string;
        location: string;
    };
}

interface ShelterProfile {
    shelter_id: number;
    shelter_name: string;
    address: string;
    description: string;
    logo_url: string;
    photos: string[];
    capacity: number;
    animalTypes: number[];
    bankInfo: {
        account_title: string;
        iban: string;
        bank_name: string;
    };
    socials: Array<{ platform: string; url: string }>;
    emergencyContacts: {
        primary_phone: string;
        backup_phone: string;
        vet_name: string;
        vet_phone: string;
    };
}

interface AnimalTypeIconProps {
    type: string;
}

const getAnimalTypeIcon = (type: AnimalTypeIconProps["type"]): JSX.Element => {
    if (typeof type === "string") {
        switch (type.toLowerCase()) {
            case "dog":
                return <FaDog />;
            case "cat":
                return <FaCat />;
            default:
                return <FaPaw />;
        }
    }
    return <FaPaw />; // Default return for undefined or non-string type
};

interface ServiceIconProps {
    service: string;
}

const getServiceIcon = (service: ServiceIconProps["service"]): JSX.Element => {
    if (typeof service === "string") {
        switch (service.toLowerCase()) {
            case "adoption":
                return <HeartIcon className="w-5 h-5" />;
            case "fostering":
                return <FaHouseUser />;
            case "medical care":
                return <FaMedkit />;
            case "rehabilitation":
                return <FaHandHoldingHeart />;
            default:
                return <FaPaw />;
        }
    }
    return <FaPaw />; // Default return for undefined or non-string service
};

const ShelterProfilePage = () => {
    const { shelter_id } = useParams();
    const [activeTab, setActiveTab] = useState("about");
    const { categories, loading, error } = useSelector(
        (state: RootState) => state.categories
    );
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(fetchPetCategories());
    }, [dispatch]);

    // API URLs
    const shelterProfileUrl = `/api/rescue/shelters/${shelter_id}`;
    const petsUrl = `/api/rescue/shelters/${shelter_id}/pets`;

    // Fetch shelter profile data
    const {
        data: shelterData,
        error: shelterError,
        isLoading: shelterLoading,
    } = useSWR<ShelterProfile>(shelterProfileUrl, fetcher);

    // Fetch pets data
    const {
        data: petsData,
        error: petsError,
        isLoading: petsLoading,
    } = useSWR<RescuePet[]>(petsUrl, fetcher);

    // Error handling and loading state
    if (shelterError || petsError)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-red-50 rounded-lg shadow-md">
                    <h3 className="text-xl text-red-500 font-semibold">
                        Unable to load shelter information
                    </h3>
                    <p className="mt-2 text-gray-600">Please try again later</p>
                </div>
            </div>
        );

    if (shelterLoading || petsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <MoonLoader size={40} color="#4F46E5" />
                    <p className="mt-4 text-gray-600">
                        Loading shelter profile...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <div className="relative bg-white">
                <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 flex flex-col lg:flex-row items-center gap-8">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-xl flex-shrink-0">
                        <img
                            src={
                                shelterData?.logo_url || "/shelter-default.png"
                            }
                            alt={shelterData?.shelter_name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex-1 text-center lg:text-left text-grey-800">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                            {shelterData?.shelter_name}
                        </h1>
                        <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 text-primary">
                            <MapPinIcon className="w-5 h-5 text-primary" />
                            <p>{shelterData?.address}</p>
                        </div>
                    </div>

                    <div className="mt-6 lg:mt-0">
                        <button className="bg-primary text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-primary/10 transition">
                            Contact Shelter
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex overflow-x-auto border-b border-gray-200 mt-2">
                    <button
                        onClick={() => setActiveTab("about")}
                        className={`px-6 py-4 font-medium text-sm sm:text-base whitespace-nowrap ${
                            activeTab === "about"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-500 hover:text-primary"
                        }`}>
                        About
                    </button>
                    <button
                        onClick={() => setActiveTab("pets")}
                        className={`px-6 py-4 font-medium text-sm sm:text-base whitespace-nowrap ${
                            activeTab === "pets"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-500 hover:text-primary"
                        }`}>
                        Available Pets
                    </button>
                    <button
                        onClick={() => setActiveTab("gallery")}
                        className={`px-6 py-4 font-medium text-sm sm:text-base whitespace-nowrap ${
                            activeTab === "gallery"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-500 hover:text-primary"
                        }`}>
                        Gallery
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* About Tab */}
                {activeTab === "about" && (
                    <div className="space-y-12">
                        {/* Description - keep the same */}

                        {/* Cards Grid */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Animal Types Card */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/10">
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary">
                                    <FaPaw />
                                    <span>Animal Types</span>
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {categories && categories.length > 0 ? (
                                        // Loop through categories to display animal types
                                        categories.map((category, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                                                {getAnimalTypeIcon(
                                                    category.category_name
                                                )}{" "}
                                                {/* category.name assuming it has a 'name' */}
                                                <span>
                                                    {category.category_name}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No animal types available</p> // Fallback message if no categories exist
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bank Info Card - new */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/10">
                            <h3 className="text-xl font-semibold mb-4 text-primary">
                                Bank Information
                            </h3>
                            <div className="space-y-2">
                                <p>
                                    <strong>Account Title:</strong>{" "}
                                    {shelterData?.bankInfo?.account_title}
                                </p>
                                <p>
                                    <strong>IBAN:</strong>{" "}
                                    {shelterData?.bankInfo?.iban}
                                </p>
                                <p>
                                    <strong>Bank Name:</strong>{" "}
                                    {shelterData?.bankInfo?.bank_name}
                                </p>
                            </div>
                        </div>

                        {/* Emergency Contacts Card - updated */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/10 md:col-span-2">
                            <h3 className="text-xl font-semibold mb-4 text-primary">
                                Emergency Contacts
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6 text-gray-700">
                                <div>
                                    <h4 className="font-medium text-gray-600">
                                        Primary Contact
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <PhoneIcon className="w-5 h-5 text-primary" />
                                        <span>
                                            {
                                                shelterData?.emergencyContacts
                                                    ?.primary_phone
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-600">
                                        Backup Contact
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <PhoneIcon className="w-5 h-5 text-primary" />
                                        <span>
                                            {shelterData?.emergencyContacts
                                                ?.backup_phone || "N/A"}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-600">
                                        Veterinarian
                                    </h4>
                                    <div className="mt-2">
                                        <p className="flex items-center gap-2">
                                            <span className="text-primary">
                                                •
                                            </span>
                                            {shelterData?.emergencyContacts
                                                ?.vet_name ||
                                                "No vet specified"}
                                        </p>
                                        {shelterData?.emergencyContacts
                                            ?.vet_phone && (
                                            <p className="flex items-center gap-2 mt-1">
                                                <PhoneIcon className="w-5 h-5 text-primary" />
                                                <span>
                                                    {
                                                        shelterData
                                                            .emergencyContacts
                                                            .vet_phone
                                                    }
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Media Card - updated */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/10">
                            <h3 className="text-xl font-semibold mb-4 text-primary">
                                Social Media
                            </h3>
                            <div className="flex gap-4">
                                {shelterData?.socials?.map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-primary bg-opacity-10 hover:bg-opacity-20 text-primary p-3 rounded-full transition">
                                        {social.platform === "Instagram" ? (
                                            <FaInstagram />
                                        ) : social.platform === "Facebook" ? (
                                            <FaFacebook />
                                        ) : (
                                            <GlobeAltIcon className="w-5 h-5" />
                                        )}
                                    </a>
                                ))}
                                {shelterData?.socials?.length === 0 && (
                                    <p className="text-gray-500">
                                        No social media links available
                                    </p>
                                )}
                            </div>
                            <div className="flex space-x-4 mt-6 justify-center lg:justify-start">
                                {shelterData?.socials.find(
                                    (social) => social.platform === "Website"
                                ) && (
                                    <a
                                        href={
                                            shelterData.socials.find(
                                                (social) =>
                                                    social.platform ===
                                                    "Website"
                                            )?.url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-primary bg-opacity-10 hover:bg-opacity-20 text-primary p-3 rounded-full transition">
                                        <GlobeAltIcon className="w-5 h-5" />
                                    </a>
                                )}

                                {shelterData?.socials.find(
                                    (social) => social.platform === "Instagram"
                                ) && (
                                    <a
                                        href={
                                            shelterData.socials.find(
                                                (social) =>
                                                    social.platform ===
                                                    "Instagram"
                                            )?.url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-grey-800 bg-opacity-10 hover:bg-opacity-20 text-primary p-3 rounded-full transition">
                                        <FaInstagram />
                                    </a>
                                )}

                                {shelterData?.socials.find(
                                    (social) => social.platform === "Facebook"
                                ) && (
                                    <a
                                        href={
                                            shelterData.socials.find(
                                                (social) =>
                                                    social.platform ===
                                                    "Facebook"
                                            )?.url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-primary bg-opacity-10 hover:bg-opacity-20 text-primary p-3 rounded-full transition">
                                        <FaFacebook />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Pets Tab */}
                {activeTab === "pets" && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                Available Pets
                            </h2>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                                    Filter
                                </button>
                                <select className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white">
                                    <option>All animals</option>
                                    {shelterData?.animalTypes?.map(
                                        (type, i) => (
                                            <option key={i}>{type}</option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>

                        {petsData && petsData.length > 0 ? (
                            <RescueGrid pets={petsData} />
                        ) : (
                            <div className="text-center py-16 bg-white rounded-lg">
                                <FaPaw className="mx-auto text-4xl text-gray-300 mb-4" />
                                <h3 className="text-xl font-medium text-gray-700 mb-2">
                                    No pets currently available
                                </h3>
                                <p className="text-gray-500">
                                    Check back soon or contact the shelter for
                                    more information.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Gallery Tab */}
                {activeTab === "gallery" && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-primary">
                            Shelter Gallery
                        </h2>

                        {shelterData?.photos &&
                        shelterData.photos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {shelterData.photos.map((photo, index) => (
                                    <div
                                        key={index}
                                        className="relative overflow-hidden rounded-xl aspect-square bg-primary/10">
                                        <img
                                            src={photo}
                                            alt={`Shelter photo ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-lg border border-primary/10">
                                <p className="text-gray-500">
                                    No gallery photos available
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShelterProfilePage;
