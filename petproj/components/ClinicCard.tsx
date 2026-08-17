"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Clinic } from "../app/types/clinic";
import { FaMapMarkerAlt, FaClock, FaArrowRight, FaPercentage } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

interface ClinicCardProps {
    clinic: Clinic;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/pet-care/clinic/${clinic.slug || clinic.clinic_id}`);
    };

    const hasDiscount =
        clinic.discount_details &&
        !clinic.discount_details.toLowerCase().includes("no discount") &&
        !clinic.discount_details.toLowerCase().includes("pending negotiation");

    const isHomeVet = clinic.listing_type === "home_vet";
    const locationText = isHomeVet ? (clinic.coverage_area || "") : clinic.address;

    return (
        <div
            className={`group relative bg-white rounded-3xl overflow-hidden border-2 hover:border-[#a03048] hover:scale-102 transition-all duration-300 flex flex-col h-full cursor-pointer ${
                clinic.is_verified
                    ? "border-primary/50 shadow-[0_0_0_4px_rgba(160,48,72,0.12),0_8px_24px_-4px_rgba(160,48,72,0.35)]"
                    : "border-transparent shadow-sm"
            }`}
            onClick={handleViewDetails}
        >
            {/* Logo / Image Area — styled like BazaarProductCard */}
            <div className="relative px-4 pt-4">
                {/* Discount Banner */}
                {hasDiscount && (
                    <div className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 bg-[#a03048] text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-md pointer-events-none max-w-[calc(100%-3rem)]">
                        <FaPercentage className="text-[9px] shrink-0" />
                        <span className="truncate">
                            {clinic.discount_details && clinic.discount_details.length <= 35
                                ? clinic.discount_details
                                : "Discount Available"}
                        </span>
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
                    className="text-base font-bold text-[#111827] mb-3 line-clamp-1 group-hover:text-[#a03048] transition-colors flex items-center gap-1.5"
                    title={clinic.name}
                >
                    <span className="line-clamp-1">{clinic.name}</span>
                    {clinic.is_verified && (
                        <MdVerified className="text-[#a03048] text-base shrink-0 -translate-y-[1px]" title={isHomeVet ? "Verified Home Vet" : "Verified Clinic"} />
                    )}
                </h3>

                {/* Meta Info */}
                <div className="space-y-2 mb-5 flex-1">
                    <div className="flex items-start gap-2 text-gray-500">
                        <FaMapMarkerAlt className="mt-0.5 text-[#a03048] shrink-0 text-xs" />
                        <span className="text-xs line-clamp-2 leading-relaxed">
                            {isHomeVet ? (locationText ? `Covers ${locationText}` : "Coverage area not listed") : locationText}
                        </span>
                    </div>

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