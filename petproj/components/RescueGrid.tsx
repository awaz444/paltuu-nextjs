"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { Modal } from "antd";
import {
    EnvironmentOutlined,
    UserOutlined,
    HeartOutlined,
    MedicineBoxOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import "./RescueGrid.css";

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

interface RescueGridProps {
    pets: RescuePet[];
}

const RescueGrid: React.FC<RescueGridProps> = ({ pets }) => {
    useSetPrimaryColor();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedPet, setSelectedPet] = useState<RescuePet | null>(null);

    const showModal = (pet: RescuePet) => {
        setSelectedPet(pet);
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedPet(null);
    };

    const urgencyColor = {
        critical: "bg-red-600",
        high: "bg-orange-500",
        moderate: "bg-yellow-500",
        stable: "bg-green-500",
    };

    const statusColor = {
        "at shelter": "bg-blue-100 text-blue-800",
        adopted: "bg-green-100 text-green-800",
        fostered: "bg-purple-100 text-purple-800",
        "medical care": "bg-red-100 text-red-800",
    };

    const sortedPets = [...pets].sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, moderate: 2, stable: 3 };
        return urgencyOrder[a.urgency_level] - urgencyOrder[b.urgency_level];
    });

    if (sortedPets.length === 0) {
        return (
            <p className="text-center py-10 text-gray-500">
                No rescue pets available at the moment.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
            {/* Rescue Pet Cards */}
            {sortedPets.map((pet) => (
                <Link
                    key={pet.rescue_id}
                    href={"/rescue-pets/" + pet.rescue_id}
                    passHref>
                    <div
                        key={pet.rescue_id}
                        className="bg-white rounded-3xl pr-3 pl-3 pt-3 shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:cursor-pointer hover:scale-102 transition-all duration-300 relative"
                        onClick={() => showModal(pet)}>
                        {/* Urgency Badge */}
                        <div
                            className={`absolute top-3 left-3 ${
                                urgencyColor[pet.urgency_level]
                            } text-white text-xs font-bold px-2 py-1 mt-2 ml-2 rounded-full z-10`}>
                            {pet.urgency_level.toUpperCase()}
                        </div>

                        <div className="relative">
                            <img
                                src={pet.images[0] || "./dog-placeholder.png"}
                                alt={pet.pet_name || "Lost or Found Pet"}
                                className="w-full aspect-square object-cover rounded-2xl"
                            />
                        </div>

                        {/* Pet Info */}
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-xl">
                                    {pet.pet_name}
                                </h3>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        statusColor[pet.status]
                                    }`}>
                                    {pet.status.replace("_", " ")}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <span>
                                    {pet.approximate_age_lower}-
                                    {pet.approximate_age_higher} years
                                </span>
                                <span>•</span>
                                <span className="capitalize">{pet.sex}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <EnvironmentOutlined className="text-primary" />
                                <p className="text-gray-600">
                                    {pet.shelter.location}
                                </p>
                            </div>

                            {/* Shelter Info */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                {pet.shelter.profilePicture ? (
                                    <img
                                        src={pet.shelter.profilePicture}
                                        alt={pet.shelter.name}
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                ) : (
                                    <UserOutlined className="text-primary" />
                                )}
                                <p className="text-sm text-gray-600 truncate">
                                    {pet.shelter.name}
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default RescueGrid;
