import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import Link from "next/link";
import EidBazaarListing from "./EidBazarListing";
import axios from "axios";
import { message } from "antd";
import {
    EnvironmentOutlined,
    UserOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    InfoCircleFilled,
} from "@ant-design/icons";

export interface QurbaniAnimal {
    id: string;
    species: "Goat" | "Cow" | "Bull" | "Sheep" | "Camel";
    breed: string;
    age: number;
    weight: number;
    height: number;
    teethCount: number;
    hornCondition?: "Good" | "Damaged" | "Broken" | "None";
    isVaccinated: boolean;
    description?: string;
    price: number | null;
    status: "Available" | "Sold" | "Reserved";
    location: string;
    city: string;
    sellerId: string;
    images: string[];
}

export interface QurbaniAnimalWithSeller extends QurbaniAnimal {
    sellerName: string;
    sellerContact: string;
    sellerProfileImage?: string;
}
interface EidBazaarGridProps {
    animals: QurbaniAnimalWithSeller[];
}

const EidBazaarGrid: React.FC<EidBazaarGridProps> = ({ animals }) => {
    const [selectedAnimal, setSelectedAnimal] =
        useState<QurbaniAnimalWithSeller | null>(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);



    // Get user ID from localStorage wahen component mounts
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setUserId(user.id); // Set the user ID in state
            } catch (error) {
                console.error("Failed to parse user data:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedAnimal) {
            setSelectedImageIndex(0);
        }
    }, [selectedAnimal]);
    

    const handleCreateSubmit = async (
        values: any
    ): Promise<{ animalId: string }> => {
        try {
            setLoading(true);

            // Get current user (replace with your actual auth logic)
            if (!userId) {
                throw new Error("User not authenticated");
            } // Example - get from your auth context

            // Prepare the payload matching your API's CreateQurbaniAnimalDto
            const payload = {
                seller_id: userId,
                species: values.species,
                breed: values.breed,
                age: values.age,
                weight: values.weight,
                height: values.height,
                teethCount: values.teethCount,
                hornCondition: values.hornCondition,
                isVaccinated: values.is_vaccinated,
                description: values.description,
                price: values.callForPrice ? null : values.price,
                location: values.location,
                city: values.city,
            };

            const response = await fetch("/api/qurbani-animals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create listing");
            }

            const data = await response.json();
            message.success("Animal listing created successfully!");

            return { animalId: String(data.id) }; // Return the created animal ID
        } catch (error: any) {
            // In your handleCreateSubmit catch block:
            let errorMessage = "Failed to create listing";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === "string") {
                errorMessage = error;
            }
            message.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const formatDate = () => {
        return new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleWhatsAppClick = () => {
        const message = `Hi, I'm interested in your ${selectedAnimal?.species} (${selectedAnimal?.breed}) listed for ${selectedAnimal?.price} PKR`;
        const url = `https://wa.me/${selectedAnimal?.sellerContact
            }?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    // Then update the button:
    <button
        onClick={handleWhatsAppClick}
        className="mt-4 w-full bg-primary text-white py-2 rounded-lg flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Contact via WhatsApp
    </button>;

    if (animals.length === 0) {
        return (
            <>
                <div className="text-center py-12">
                    <div className="mb-8">
                        <p className="text-gray-500">
                            No animals listed, click below to add your animal to
                            sell.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <div
                            className="create-listing-btn bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 text-sm sm:text-base cursor-pointer w-64 text-center"
                            onClick={() => setCreateModalVisible(true)}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                fill="currentColor"
                                className="bi bi-plus-circle mb-3 mx-auto"
                                viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                            </svg>
                            Sell Animal
                        </div>
                    </div>
                </div>

                <Modal
                    title="Create New Listing"
                    open={createModalVisible}
                    onCancel={() => setCreateModalVisible(false)}
                    footer={null}>
                    <EidBazaarListing
                        onSubmit={handleCreateSubmit}
                        onCancel={() => setCreateModalVisible(false)}
                    />
                </Modal>
            </>
        );
    }

    return (
        <>
            {/* Create Listing Button - Matches Lost & Found style */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-3">
                {/* Modified Create Listing Button to open modal */}
                <div
                    className="create-listing-btn hidden sm:flex bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 text-sm sm:text-base cursor-pointer"
                    onClick={() => setCreateModalVisible(true)}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        fill="currentColor"
                        className="bi bi-plus-circle mb-3"
                        viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                    </svg>
                    Sell Animal
                </div>

                {/* Mobile create button */}
                <div
                    className="fixed bottom-4 right-2 sm:hidden z-50"
                    onClick={() => setCreateModalVisible(true)}>
                    <button className="flex items-center gap-1.5 bg-white text-primary border-2 border-primary p-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                            viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                        </svg>
                        <span className="text-xs">Add</span>
                    </button>
                </div>

                {/* Animal Cards - Consistent with Lost & Found design */}
                {animals.map((animal) => (
                    <div
                        key={animal.id}
                        className="bg-white pr-3 pl-3 pt-3 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:cursor-pointer hover:scale-102 transition-all duration-300"
                        onClick={() => setSelectedAnimal(animal)}>
                        <div className="relative">
                            <img
                                src={
                                    animal.images[0] ||
                                    "/animal-placeholder.png"
                                }
                                alt={animal.breed}
                                className="w-full aspect-square object-cover rounded-2xl"
                            />
                            {/* <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${animal.status === "Available" ? "bg-green-100 text-green-800" :
                animal.status === "Reserved" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                {animal.status}
              </span> */}
                        </div>
                        <div className="p-4">
                            <p className="text-primary font-semibold text-lg mb-1">
                                {animal.price !== null
                                    ? animal.price.toLocaleString() + " PKR"
                                    : "Call for Price"}
                            </p>
                            <h3 className="font-bold text-xl mb-2">
                                {animal.breed}
                            </h3>

                            {/* <div className="flex flex-wrap gap-2 mb-3">
                                {animal.isVaccinated && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                        Vaccinated
                                    </span>
                                )}
                                {animal.teethCount && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                        {animal.teethCount} teeth
                                    </span>
                                )}
                            </div> */}

                            <div className="flex flex-row gap-2 items-center mb-2">
                                <EnvironmentOutlined className="text-primary" />
                                <p className="text-gray-600">
                                    {animal.city}, {animal.location}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedAnimal && (
                <Modal
                    title={null}
                    open={!!selectedAnimal}
                    onCancel={() => setSelectedAnimal(null)}
                    footer={null}
                    width={900}
                    centered
                    className="animal-details-modal"
                >
                    <div className="rounded-xl overflow-hidden bg-gray-50">
                        {/* Header Banner */}
                        <div className="bg-white px-6 py-4 text-primary">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">
                                    {selectedAnimal.breed}{" "}
                                    {selectedAnimal.species}
                                </h2>
                                <div className="text-lg font-semibold">
                                    {selectedAnimal.price !== null
                                        ? `${selectedAnimal.price.toLocaleString()} PKR`
                                        : "Call for Price"}
                                </div>
                            </div>
                            <div className="flex items-center mt-1 text-white/80">
                                <EnvironmentOutlined className="mr-1" />
                                <span>
                                    {selectedAnimal.city},{" "}
                                    {selectedAnimal.location}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row">
                            {/* Left column - Images */}
                            <div className="p-6 md:w-1/2">
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                                    <img
                                        src={
                                            selectedAnimal.images[selectedImageIndex] ||
                                            "/animal-placeholder.png"
                                        }
                                        alt={`${selectedAnimal.breed} - View ${selectedImageIndex + 1}`}
                                        className="w-full aspect-square object-cover"
                                    />
                                </div>

                                {/* Thumbnails */}
                                {selectedAnimal.images.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`w-20 h-20 flex-shrink-0 border-2 rounded-md cursor-pointer ${index === selectedImageIndex
                                                ? "border-primary"
                                                : "border-transparent"
                                            }`}
                                        onClick={() => setSelectedImageIndex(index)}
                                    >
                                        <img
                                            src={img}
                                            alt={`${selectedAnimal.breed} view ${index + 1}`}
                                            className="w-full h-full object-cover rounded-md"
                                        />
                                    </div>
                                ))}


                                {/* Seller information */}
                                <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
                                    <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">
                                        Seller Information
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {selectedAnimal.sellerProfileImage ? (
                                            <img
                                                src={
                                                    selectedAnimal.sellerProfileImage
                                                }
                                                alt={selectedAnimal.sellerName}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                                <UserOutlined className="text-xl text-primary" />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-semibold text-lg">
                                                {selectedAnimal.sellerName}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                Listed on {formatDate()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-primary"
                                                viewBox="0 0 20 20"
                                                fill="currentColor">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                            <a
                                                href={`tel:${selectedAnimal.sellerContact}`}
                                                className="text-primary hover:underline">
                                                {selectedAnimal.sellerContact}
                                            </a>
                                        </div>
                                        <button
                                            onClick={handleWhatsAppClick}
                                            className="mt-4 w-full bg-primary text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors shadow-sm">
                                            <svg
                                                className="w-5 h-5"
                                                fill="currentColor"
                                                viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Contact via WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right column - Details */}
                            <div className="p-6 md:w-1/2">
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">
                                        Animal Details
                                    </h3>

                                    {/* Status badges */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="bg-red-100 text-primary px-3 py-1 rounded-full text-sm font-medium inline-flex items-center">
                                            <span className="w-2 h-2 bg-primary rounded-full mr-1.5"></span>
                                            {selectedAnimal.status}
                                        </span>
                                        {selectedAnimal.isVaccinated && (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center">
                                                <CheckCircleFilled className="mr-1" />
                                                Vaccinated
                                            </span>
                                        )}
                                    </div>

                                    {/* Specifications */}
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-sm text-gray-500">
                                                    Species
                                                </div>
                                                <div className="font-medium">
                                                    {selectedAnimal.species}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-sm text-gray-500">
                                                    Breed
                                                </div>
                                                <div className="font-medium">
                                                    {selectedAnimal.breed}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-sm text-gray-500">
                                                    Age
                                                </div>
                                                <div className="font-medium">
                                                    {selectedAnimal.age} years
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-sm text-gray-500">
                                                    Weight
                                                </div>
                                                <div className="font-medium">
                                                    {selectedAnimal.weight} kg
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-sm text-gray-500">
                                                    Height
                                                </div>
                                                <div className="font-medium">
                                                    {selectedAnimal.height} cm
                                                </div>
                                            </div>
                                            {selectedAnimal.teethCount && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-500">
                                                        Teeth Count
                                                    </div>
                                                    <div className="font-medium">
                                                        {
                                                            selectedAnimal.teethCount
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Horn Condition */}
                                        {selectedAnimal.hornCondition && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700 font-medium">
                                                        Horn Condition
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md text-sm ${selectedAnimal.hornCondition ===
                                                            "Good"
                                                            ? "bg-green-100 text-green-700"
                                                            : selectedAnimal.hornCondition ===
                                                                "Damaged"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : selectedAnimal.hornCondition ===
                                                                    "Broken"
                                                                    ? "bg-orange-100 text-orange-700"
                                                                    : "bg-gray-100 text-gray-700"
                                                            }`}>
                                                        {
                                                            selectedAnimal.hornCondition
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {selectedAnimal.description && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-gray-700 font-medium mb-2 flex items-center">
                                                    <InfoCircleFilled className="mr-2 text-teal-600" />
                                                    Description
                                                </h4>
                                                <p className="text-gray-600 whitespace-pre-line">
                                                    {selectedAnimal.description}
                                                </p>
                                            </div>
                                        )}

                                        {/* Qurbani Suitability Indicator */}
                                        <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border-l-4 border-amber-400">
                                            <h4 className="text-amber-800 font-medium mb-2">
                                                Qurbani Suitability
                                            </h4>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 bg-white h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-amber-500 h-full rounded-full"
                                                        style={{
                                                            width: `${selectedAnimal.isVaccinated &&
                                                                selectedAnimal.teethCount >=
                                                                2
                                                                ? "100%"
                                                                : "70%"
                                                                }`,
                                                        }}></div>
                                                </div>
                                                <span className="text-amber-700 font-medium">
                                                    {selectedAnimal.isVaccinated &&
                                                        selectedAnimal.teethCount >=
                                                        2
                                                        ? "Excellent"
                                                        : "Good"}
                                                </span>
                                            </div>
                                            <div className="text-xs text-amber-700 mt-2">
                                                {selectedAnimal.isVaccinated &&
                                                    selectedAnimal.teethCount >= 2
                                                    ? "This animal meets all Qurbani requirements"
                                                    : "This animal meets basic Qurbani requirements"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Animal Details Modal */}


            {/* Create Listing Modal */}
            <Modal
                title={
                    <span className="text-xl font-bold text-gray-800">
                        Create New Listing
                    </span>
                }
                open={createModalVisible}
                onCancel={() => setCreateModalVisible(false)}
                footer={null}
                width={500}
                destroyOnClose
                className="rounded-2xl overflow-hidden"
                styles={{
                    header: {
                        borderBottom: "1px solid #f3f4f6",
                        padding: "16px 24px",
                    },
                    body: {
                        padding: 0,
                    },
                }}>
                <EidBazaarListing
                    onSubmit={handleCreateSubmit}
                    onCancel={() => setCreateModalVisible(false)}
                />
            </Modal>
        </>
    );
};

export default EidBazaarGrid;
