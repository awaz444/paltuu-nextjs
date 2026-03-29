"use client";

import React from "react";
import { Card, Button } from "antd";
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Clinic } from "../app/types/clinic";

interface ClinicCardProps {
    clinic: Clinic;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/pet-care/clinic/${clinic.clinic_id}`);
    };

    return (
        <Card
            hoverable
            // Added flex and flex-col to the card itself
            className="flex flex-col w-full h-full shadow-md rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
            bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            cover={
                <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center p-4">
                    {clinic.discount_details && 
                    !clinic.discount_details.toLowerCase().includes("no discount") && 
                    !clinic.discount_details.toLowerCase().includes("pending negotiation") && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] uppercase font-black px-4 py-1.5 rounded-lg shadow-xl z-20 flex items-center gap-1.5 backdrop-blur-md border border-white/20 tracking-wider">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                            {clinic.discount_details}
                        </div>
                    )}
                    <img
                        alt={clinic.name}
                        src={clinic.logo_url || "/placeholder-clinic.png"}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-clinic.png";
                        }}
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
            }
        >
            {/* The wrapper div now handles the vertical distribution */}
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-1" title={clinic.name}>
                        {clinic.name}
                    </h3>

                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-gray-600">
                        <EnvironmentOutlined className="mt-1 text-primary" />
                        <span className="text-sm line-clamp-2">{clinic.address}</span>
                    </div>
                    {clinic.contact_number && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <PhoneOutlined className="text-primary" />
                            <span className="text-sm">{clinic.contact_number}</span>
                        </div>
                    )}
                    {clinic.operating_hours && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <ClockCircleOutlined className="text-primary" />
                            <span className="text-sm line-clamp-1">{clinic.operating_hours}</span>
                        </div>
                    )}
                </div>

                {/* mt-auto pushes the button to the very bottom of the flex container */}
                <button
                    className="w-full mt-auto bg-primary hover:bg-primary border-0 h-10 rounded-xl font-semibold text-white"
                    onClick={handleViewDetails}
                >
                    View Details
                </button>
            </div>
        </Card>
    );
};

export default ClinicCard;