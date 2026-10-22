"use client";
import React from "react";
import Link from "next/link";
import { EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
import { RescuePet, rescueStatusLabel } from "@/types/rescue";
import { formatAge } from "@/utils/formatAge";
import "./RescueGrid.css";

interface RescueGridProps {
    pets: RescuePet[];
}

const statusColor: Record<string, string> = {
    available: "bg-blue-100 text-blue-800",
    foster: "bg-purple-100 text-purple-800",
    adopted: "bg-green-100 text-green-800",
};

const RescueGrid: React.FC<RescueGridProps> = ({ pets }) => {
    if (pets.length === 0) {
        return (
            <p className="text-center py-10 text-gray-500">
                No rescue pets available at the moment.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
            {/* Rescue Pet Cards */}
            {pets.map((pet) => {
                const status = pet.adoption_status || "available";
                const location = pet.shelter?.location || pet.area;

                return (
                    <Link
                        key={pet.pet_id}
                        href={"/rescue-pets/" + pet.pet_id}
                        passHref>
                        <div className="bg-white rounded-3xl pr-3 pl-3 pt-3 shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:cursor-pointer hover:scale-102 transition-all duration-300 relative">
                            <div className="relative">
                                <img
                                    src={pet.images?.[0] || "/dog-placeholder.png"}
                                    alt={pet.pet_name || "Rescue pet"}
                                    className="w-full aspect-square object-cover rounded-2xl"
                                />
                            </div>

                            {/* Pet Info */}
                            <div className="p-4">
                                <div className="flex flex-wrap justify-between items-start gap-x-2 gap-y-1 mb-2">
                                    <h3 className="font-bold text-xl break-words">
                                        {pet.pet_name}
                                    </h3>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                            statusColor[status] || statusColor.available
                                        }`}>
                                        {rescueStatusLabel(status)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <span>{formatAge(pet.age_months)}</span>
                                    {pet.sex && (
                                        <>
                                            <span>•</span>
                                            <span className="capitalize">{pet.sex}</span>
                                        </>
                                    )}
                                </div>

                                {location && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <EnvironmentOutlined className="text-primary" />
                                        <p className="text-gray-600 truncate">{location}</p>
                                    </div>
                                )}

                                {/* Shelter Info */}
                                {pet.shelter && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                        {pet.shelter.profilePicture ? (
                                            <img
                                                src={pet.shelter.profilePicture}
                                                alt={pet.shelter.name}
                                                className="w-6 h-6 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/dog-placeholder.png";
                                                }}
                                            />
                                        ) : (
                                            <UserOutlined className="text-primary" />
                                        )}
                                        <p className="text-sm text-gray-600 truncate">
                                            {pet.shelter.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default RescueGrid;
