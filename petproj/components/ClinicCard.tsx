"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clinic } from "../app/types/clinic";
import { FaHome, FaClinicMedical } from "react-icons/fa";
import { EnvironmentOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { MdVerified } from "react-icons/md";

interface ClinicCardProps {
    clinic: Clinic;
}

const PLACEHOLDER = "/placeholder-clinic.jpg";

/** Logo, or the placeholder when it fails. Also catches a logo that failed before hydration, when onError had no handler yet. */
function ClinicImage({ src, alt }: { src: string | null | undefined; alt: string }) {
    const [url, setUrl] = useState(src || PLACEHOLDER);
    const img = useRef<HTMLImageElement>(null);
    useEffect(() => {
        const el = img.current;
        if (el && el.complete && el.naturalWidth === 0) setUrl(PLACEHOLDER);
    }, []);
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            ref={img}
            alt={alt}
            src={url}
            onError={() => setUrl(PLACEHOLDER)}
            className="w-full aspect-square object-cover rounded-2xl"
        />
    );
}

/** Same card as Browse Pets (components/petGrid.tsx): white, rounded-3xl, light shadow, primary border on hover. */
const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
    const hasDiscount =
        clinic.discount_details &&
        !clinic.discount_details.toLowerCase().includes("no discount") &&
        !clinic.discount_details.toLowerCase().includes("pending negotiation");

    const isHomeVet = clinic.listing_type === "home_vet";
    const locationText = isHomeVet
        ? clinic.coverage_area
            ? `Covers ${clinic.coverage_area}`
            : "Coverage area not listed"
        : clinic.address;

    return (
        <Link
            href={`/pet-care/clinic/${clinic.slug || clinic.clinic_id}`}
            className="block h-full bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300"
        >
            <div className="relative">
                <ClinicImage src={clinic.logo_url} alt={clinic.name} />
                <div className="absolute top-2 left-2 bg-primary text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    {isHomeVet ? <FaHome className="text-[10px]" /> : <FaClinicMedical className="text-[10px]" />}
                    {isHomeVet ? "Home Visit" : "Clinic"}
                </div>
            </div>

            <div className="py-4">
                <h3 className="font-bold mb-1 flex items-center gap-1 min-w-0" title={clinic.name}>
                    <span className="truncate">{clinic.name}</span>
                    {clinic.is_verified && (
                        <MdVerified className="text-primary shrink-0" title={isHomeVet ? "Verified Home Vet" : "Verified Clinic"} />
                    )}
                </h3>
                {locationText && (
                    <div className="flex flex-row gap-2 items-start text-gray-600">
                        <EnvironmentOutlined className="text-primary mt-1" />
                        <p className="line-clamp-2 text-sm">{locationText}</p>
                    </div>
                )}
                {clinic.operating_hours && (
                    <div className="flex flex-row gap-2 items-start text-gray-600 mt-1">
                        <ClockCircleOutlined className="text-primary mt-1" />
                        <p className="truncate text-sm">{clinic.operating_hours}</p>
                    </div>
                )}
                {hasDiscount && (
                    <p className="mt-2 inline-block max-w-full truncate rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {clinic.discount_details}
                    </p>
                )}
            </div>
        </Link>
    );
};

export default ClinicCard;
