"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Clinic } from "../app/types/clinic";
import { FaMapMarkerAlt, FaPhone, FaClock, FaArrowRight } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

interface ClinicCardProps {
    clinic: Clinic;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/pet-care/clinic/${clinic.clinic_id}`);
    };

    const hasDiscount =
        clinic.discount_details &&
        !clinic.discount_details.toLowerCase().includes("no discount") &&
        !clinic.discount_details.toLowerCase().includes("pending negotiation");

    return (
        <div
            className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#a03048]/20 transition-all duration-300 flex flex-col h-full cursor-pointer"
            onClick={handleViewDetails}
        >
            {/* Logo / Image Area — styled like BazaarProductCard */}
            <div className="relative px-4 pt-4">
                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute top-5 left-5 z-20 flex items-center gap-1.5 bg-primary text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg shadow-lg tracking-wider">
                        <HiSparkles className="text-xs" />
                        Paltuu Discounts Available
                    </div>
                )}

                <img
                    alt={clinic.name}
                    src={clinic.logo_url || "/placeholder-clinic.png"}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-clinic.png";
                    }}
                    className="w-full aspect-square object-cover rounded-2xl"
                />
            </div>

            {/* Card Body */}
            <div className="flex flex-col flex-1 p-5">
                {/* Clinic Name */}
                <h3
                    className="text-base font-bold text-[#111827] mb-3 line-clamp-1 group-hover:text-[#a03048] transition-colors"
                    title={clinic.name}
                >
                    {clinic.name}
                </h3>

                {/* Meta Info */}
                <div className="space-y-2 mb-5 flex-1">
                    <div className="flex items-start gap-2 text-gray-500">
                        <FaMapMarkerAlt className="mt-0.5 text-[#a03048] shrink-0 text-xs" />
                        <span className="text-xs line-clamp-2 leading-relaxed">
                            {clinic.address}
                        </span>
                    </div>

                    {clinic.contact_number && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <FaPhone className="text-[#a03048] shrink-0 text-xs" />
                            <span className="text-xs">{clinic.contact_number}</span>
                        </div>
                    )}

                    {clinic.operating_hours && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <FaClock className="text-[#a03048] shrink-0 text-xs" />
                            <span className="text-xs line-clamp-1">
                                {clinic.operating_hours}
                            </span>
                        </div>
                    )}
                </div>

                {/* CTA Button */}
                <button
                    className="w-full mt-auto flex items-center justify-center gap-2 bg-[#a03048] hover:bg-[#8a2940] text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails();
                    }}
                >
                    View Details
                    <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default ClinicCard;