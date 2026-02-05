"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Divider, Button, message } from "antd";
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { MoonLoader } from "react-spinners";
import VetGrid from "../../../../components/VetGrid";
import { Clinic } from "../../../types/clinic";
import { Vet } from "../../../types/vet";

interface ClinicDetails extends Clinic {
    vets: Vet[];
}

export default function ClinicPage() {
    const params = useParams();
    const router = useRouter();
    const [clinic, setClinic] = useState<ClinicDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [primaryColor, setPrimaryColor] = useState("#A03048");

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    useEffect(() => {
        const fetchClinicDetails = async () => {
            try {
                const response = await fetch(`/api/clinics/${params.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch clinic details");
                }
                const data = await response.json();
                setClinic(data);
            } catch (err) {
                console.error("Error fetching clinic details:", err);
                router.push("/404");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchClinicDetails();
        }
    }, [params.id, router]);

    const handleWhatsApp = (phone: string) => {
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "+92" + formattedPhone.slice(1);
        } else if (!formattedPhone.startsWith("+92")) {
            message.error("Invalid phone number format. Please use a valid Pakistani number.");
            return;
        }
        const whatsappUrl = `https://wa.me/${phone}`;
        window.open(whatsappUrl, "_blank");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

    if (!clinic) {
        return <div className="text-center mt-10">Clinic not found.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Card className="shadow-lg rounded-2xl overflow-hidden mb-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:block">
                        <img
                            src={clinic.logo_url || "/placeholder-clinic.png"}
                            alt={clinic.name}
                            className="w-48 h-48 object-contain rounded-xl border border-gray-100 bg-gray-50"
                        />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="text-3xl font-bold text-gray-800">{clinic.name}</h1>
                            {clinic.is_paltuu_partner && (
                                <i className="bi bi-patch-check-fill text-[#cc8800] h-6 w-6 text-2xl" title="Paltuu Partner" />
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-lg text-gray-600">
                                <EnvironmentOutlined className="text-primary text-xl" />
                                <span>{clinic.address}</span>
                                {clinic.google_maps_link && (
                                    <a
                                        href={clinic.google_maps_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary text-sm hover:underline ml-2"
                                    >
                                        (View on Map)
                                    </a>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-6">
                                {clinic.contact_number && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <PhoneOutlined className="text-primary" />
                                        <span>{clinic.contact_number}</span>
                                    </div>
                                )}
                                {clinic.operating_hours && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <ClockCircleOutlined className="text-primary" />
                                        <span>{clinic.operating_hours}</span>
                                    </div>
                                )}
                            </div>

                            {clinic.whatsapp_number && (
                                <Button
                                    type="primary"
                                    icon={<WhatsAppOutlined />}
                                    className="bg-[#25D366] hover:!bg-[#128C7E] border-0h-10 rounded-xl font-semibold mt-2"
                                    onClick={() => handleWhatsApp(clinic.whatsapp_number)}
                                >
                                    Chat on WhatsApp
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Veterinarians</h2>
                {clinic.vets && clinic.vets.length > 0 ? (
                    <VetGrid vets={clinic.vets.map(v => ({
                        ...v,
                        city_id: 0,
                        city_name: '',
                        qualifications: [],
                        specializations: [],
                        clinic_name: clinic.name,
                        location: clinic.address
                    }))} />
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl text-gray-500">
                        No veterinarians listed for this clinic yet.
                    </div>
                )}
            </div>
        </div>
    );
}
