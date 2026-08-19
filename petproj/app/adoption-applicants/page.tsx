"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MoonLoader } from "react-spinners";
import { formatAge } from "@/utils/formatAge";
import {
    ChevronDown,
    MapPin,
    Baby,
    PawPrint,
    Fence,
    Moon,
    Clock,
    MessageSquare,
    Inbox,
    ArrowLeft,
    Check,
    X,
} from "lucide-react";

interface Application {
    adoption_id: number;
    user_id: number;
    pet_name: string;
    pet_id: number;
    adopter_name: string;
    adopter_image: string | null;
    adopter_address: string;
    created_at: string;
    status: string;
    age_of_youngest_child: string | null;
    other_pets_details: string | null;
    other_pets_neutered: boolean | null;
    has_secure_outdoor_area: boolean | null;
    pet_sleep_location: string | null;
    pet_left_alone: string | null;
    additional_details: string | null;
    agree_to_terms: boolean;
}

interface PetOverview {
    pet_id: number;
    pet_name: string;
    pet_breed: string | null;
    city: string;
    area: string;
    age_months: number;
    adoption_status: string;
    images: { image_id: number; image_url: string }[];
}

const STATUS_STYLES: Record<string, string> = {
    approved: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    rejected: "bg-gray-200 text-gray-600",
};

const DetailRow = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}) => (
    <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm text-gray-800 font-medium">{value}</p>
        </div>
    </div>
);

const AdoptionApplications = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const petId = searchParams.get("pet_id");
    const [applications, setApplications] = useState<Application[] | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);
    const [pet, setPet] = useState<PetOverview | null>(null);
    const [expandedApplication, setExpandedApplication] = useState<
        number | null
    >(null);
    const [primaryColor, setPrimaryColor] = useState("#000000");

    useEffect(() => {
        if (!petId) return;

        const fetchApplications = async () => {
            try {
                const response = await fetch(
                    `/api/v1/applications/adoption?pet_id=${petId}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setApplications(Array.isArray(data) ? data : [data]);
                } else if (response.status === 404) {
                    setApplications([]);
                } else {
                    const errorData = await response.json().catch(() => null);
                    console.error(
                        "Failed to fetch applications:",
                        response.statusText
                    );
                    setError(
                        errorData?.error ||
                            "Failed to load applications. Please try again."
                    );
                }
            } catch (error) {
                console.error("Error fetching applications:", error);
                setError("Failed to load applications. Please try again.");
            }
        };

        const fetchPet = async () => {
            try {
                const response = await fetch(`/api/v1/pets/${petId}`);
                if (response.ok) {
                    setPet(await response.json());
                }
            } catch (error) {
                console.error("Error fetching pet overview:", error);
            }
        };

        fetchApplications();
        fetchPet();
    }, [petId]);

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) setPrimaryColor(color);
    }, []);

    const handleApprove = async (adoptionId: number) => {
        try {
            const response = await fetch(`/api/v1/applications/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    application_id: adoptionId,
                    type: "adoption",
                    status: "approved",
                }),
            });

            if (response.ok) {
                setApplications((prev) =>
                    prev
                        ? prev.map((app) =>
                              app.adoption_id === adoptionId
                                  ? { ...app, status: "approved" }
                                  : { ...app, status: "rejected" }
                          )
                        : prev
                );
            } else {
                const errorData = await response.json();
                console.error(
                    "Failed to approve application:",
                    errorData.error || response.statusText
                );
            }
        } catch (error) {
            console.error("Error approving application:", error);
        }
    };

    const handleReject = async (adoptionId: number) => {
        try {
            const response = await fetch(`/api/v1/applications/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    application_id: adoptionId,
                    type: "adoption",
                    status: "rejected",
                }),
            });
            if (response.ok) {
                setApplications((prev) =>
                    prev
                        ? prev.map((app) =>
                              app.adoption_id === adoptionId
                                  ? { ...app, status: "rejected" }
                                  : app
                          )
                        : prev
                );
            } else {
                console.error(
                    "Failed to reject application:",
                    response.statusText
                );
            }
        } catch (error) {
            console.error("Error rejecting application:", error);
        }
    };

    const handleExpand = (adoptionId: number) => {
        setExpandedApplication(
            expandedApplication === adoptionId ? null : adoptionId
        );
    };

    if (!petId) {
        return (
            <div className="text-center text-red-600 font-bold mt-6">
                Invalid Pet ID
            </div>
        );
    }

    return (
        <div className="max-w-6xl min-h-screen mx-auto p-6">
            <button
                onClick={() => router.push("/my-listings")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5"
            >
                <ArrowLeft size={16} /> Back to my listings
            </button>

            {error ? (
                <p className="text-red-600 text-center text-lg mt-6">
                    {error}
                </p>
            ) : applications ? (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Pet overview sidebar */}
                    <aside className="w-full md:w-72 md:sticky md:top-6 shrink-0 bg-white rounded-3xl shadow-sm overflow-hidden">
                        <img
                            src={pet?.images?.[0]?.image_url || "/dog-placeholder.png"}
                            alt={pet?.pet_name || "Pet"}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/dog-placeholder.png";
                            }}
                            className="w-full aspect-square object-cover"
                        />
                        <div className="p-5">
                            <h1 className="text-lg font-bold text-gray-900">
                                {pet?.pet_name || "Loading..."}
                            </h1>
                            {pet && (
                                <>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {pet.pet_breed || "Mixed Breed"} · {formatAge(pet.age_months)}
                                    </p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin size={13} className="text-gray-400" />
                                        {pet.city}{pet.area ? ` — ${pet.area}` : ""}
                                    </p>
                                    <span
                                        className={`inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                                            pet.adoption_status === "available"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        {pet.adoption_status}
                                    </span>
                                </>
                            )}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-gray-500">
                                <Inbox size={16} />
                                <span className="text-sm">
                                    {applications.length} application
                                    {applications.length !== 1 ? "s" : ""} received
                                </span>
                            </div>
                        </div>
                    </aside>

                    {/* Applications */}
                    <div className="flex-1 w-full">
                        {applications.length > 0 ? (
                            <ul className="space-y-4">
                                {applications.map((app) => {
                                    const isExpanded =
                                        expandedApplication === app.adoption_id;
                                    const status = app.status?.toLowerCase();
                                    const isPending = status === "pending";

                                    return (
                                        <li
                                            key={app.adoption_id}
                                            className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleExpand(app.adoption_id)}
                                                className="w-full flex items-center justify-between gap-3 p-5 text-left"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <img
                                                        src={app.adopter_image || "/default-avatar.png"}
                                                        alt={app.adopter_name}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "/default-avatar.png";
                                                        }}
                                                        className="w-11 h-11 rounded-full object-cover shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h2 className="font-bold text-gray-900 truncate">
                                                                {app.adopter_name}
                                                            </h2>
                                                            <span
                                                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                                                                    STATUS_STYLES[status] ||
                                                                    "bg-gray-100 text-gray-600"
                                                                }`}
                                                            >
                                                                {app.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Applied{" "}
                                                            {new Date(app.created_at).toLocaleDateString(
                                                                undefined,
                                                                { month: "short", day: "numeric", year: "numeric" }
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronDown
                                                    size={18}
                                                    className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                                                        isExpanded ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </button>

                                            {isExpanded && (
                                                <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                                                        <DetailRow
                                                            icon={<MapPin size={15} />}
                                                            label="Address"
                                                            value={app.adopter_address || "Not provided"}
                                                        />
                                                        <DetailRow
                                                            icon={<Baby size={15} />}
                                                            label="Youngest child age"
                                                            value={app.age_of_youngest_child || "Not provided"}
                                                        />
                                                        <DetailRow
                                                            icon={<PawPrint size={15} />}
                                                            label="Other pets at home"
                                                            value={app.other_pets_details || "None"}
                                                        />
                                                        <DetailRow
                                                            icon={<Fence size={15} />}
                                                            label="Secure outdoor area"
                                                            value={app.has_secure_outdoor_area ? "Yes" : "No"}
                                                        />
                                                        <DetailRow
                                                            icon={<Moon size={15} />}
                                                            label="Where the pet will sleep"
                                                            value={app.pet_sleep_location || "Not provided"}
                                                        />
                                                        <DetailRow
                                                            icon={<Clock size={15} />}
                                                            label="Time left alone"
                                                            value={app.pet_left_alone || "Not provided"}
                                                        />
                                                        {app.additional_details && (
                                                            <div className="sm:col-span-2">
                                                                <DetailRow
                                                                    icon={<MessageSquare size={15} />}
                                                                    label="Additional details"
                                                                    value={app.additional_details}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isPending && (
                                                        <div className="mt-5 flex justify-end gap-3">
                                                            <button
                                                                onClick={() => handleReject(app.adoption_id)}
                                                                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <X size={15} /> Reject
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprove(app.adoption_id)}
                                                                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                                                            >
                                                                <Check size={15} /> Approve
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-3xl shadow-sm">
                                <Inbox size={36} className="text-gray-300 mb-3" />
                                <p className="text-gray-500">
                                    No applications yet for this listing.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center min-h-[60vh]">
                    <MoonLoader size={30} color={primaryColor} />
                </div>
            )}
        </div>
    );
};

const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-500">Loading applications...</p>
    </div>
);

const AdoptionApplicants = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <AdoptionApplications />
        </Suspense>
    );
};

export default AdoptionApplicants;
