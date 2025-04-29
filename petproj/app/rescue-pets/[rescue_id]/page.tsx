"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoonLoader } from "react-spinners";
import Navbar from "../../../components/navbar";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { Carousel } from "antd";
import {
    HeartOutlined,
    EnvironmentOutlined,
    SafetyOutlined,
    MedicineBoxOutlined,
    DollarOutlined,
    ManOutlined,
    WomanOutlined,
    QuestionOutlined,
    HomeOutlined,
} from "@ant-design/icons";
import "./styles.css";

export type RescuePet = {
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
        contactInfo: string;
        verified: boolean;
        website?: string;
    };
};

export default function RescuePetPage({
    params,
}: {
    params: { rescue_id: string };
}) {
    const router = useRouter();
    const [pet, setPet] = useState<RescuePet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#3b82f6");

    useSetPrimaryColor();

    useEffect(() => {
        const fetchPetData = async () => {
            try {
                const response = await fetch(
                    `/api/rescue/pets/${params.rescue_id}`
                );
                if (!response.ok) {
                    throw new Error("Pet not found");
                }
                const data = await response.json();
                setPet(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchPetData();
    }, [params.rescue_id]);

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex justify-center items-center min-h-screen">
                    <MoonLoader color={primaryColor} size={30} />
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="not-found-container">
                    <h1>{error}</h1>
                    <button
                        className="custom-btn primary"
                        onClick={() => router.push("/rescue-pets")}
                        style={{ backgroundColor: primaryColor }}>
                        Browse Other Rescues
                    </button>
                </div>
            </>
        );
    }

    if (!pet) {
        return (
            <>
                <Navbar />
                <div className="not-found-container">
                    <h1>Pet Not Found</h1>
                    <button
                        className="custom-btn primary"
                        onClick={() => router.push("/rescue-pets")}
                        style={{ backgroundColor: primaryColor }}>
                        Browse Other Rescues
                    </button>
                </div>
            </>
        );
    }

    // Custom Button Components
    const CustomButton = ({
        children,
        type = "primary",
        onClick,
        icon,
        className = "",
    }: {
        children: React.ReactNode;
        type?: "primary" | "secondary" | "outline";
        onClick?: () => void;
        icon?: React.ReactNode;
        className?: string;
    }) => {
        const baseClasses =
            "py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2";

        return (
            <button
                className={`${baseClasses} ${className}`}
                onClick={onClick}
                style={{
                    backgroundColor:
                        type === "primary"
                            ? primaryColor
                            : type === "secondary"
                            ? "#4CAF50" // A harmonious green that works with most primary colors
                            : "transparent",
                    color: type === "outline" ? primaryColor : "white",
                    border:
                        type === "outline"
                            ? `2px solid ${primaryColor}`
                            : "none",
                }}>
                {icon && <span>{icon}</span>}
                {children}
            </button>
        );
    };

    return (
        <>
            <Navbar />

            <div className="rescue-page-container">
                {/* Main Content */}
                <div className="rescue-card">
                    {/* Header */}
                    <div className="rescue-header">
                        <div className="rescue-info">
                            <h1>{pet.pet_name}</h1>

                            {/* Status Badges */}
                            <div className="badge-container">
                                <span
                                    className={`urgency-badge ${pet.urgency_level}`}>
                                    Urgency Level:{" "}
                                    {pet.urgency_level.toUpperCase()}
                                </span>
                                <span
                                    className={`status-badge ${pet.status.replace(
                                        " ",
                                        "-"
                                    )}`}>
                                    {pet.status.toUpperCase()}
                                </span>
                            </div>

                            {/* Basic Info */}
                            <div className="pet-meta">
                                <div className="meta-item">
                                    <MedicineBoxOutlined
                                        style={{ color: primaryColor }}
                                    />
                                    <span>
                                        Vaccinated:{" "}
                                        {pet.vaccinated ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <MedicineBoxOutlined
                                        style={{ color: primaryColor }}
                                    />
                                    <span>
                                        Neutered: {pet.neutered ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <HeartOutlined
                                        style={{ color: primaryColor }}
                                    />
                                    <span>
                                        Age: {pet.approximate_age_lower}-
                                        {pet.approximate_age_higher} years
                                    </span>
                                </div>
                                <div className="meta-item">
                                    {pet.sex === "male" ? (
                                        <ManOutlined
                                            style={{ color: primaryColor }}
                                        />
                                    ) : pet.sex === "female" ? (
                                        <WomanOutlined
                                            style={{ color: primaryColor }}
                                        />
                                    ) : (
                                        <QuestionOutlined
                                            style={{ color: primaryColor }}
                                        />
                                    )}
                                    <span className="capitalize">
                                        {pet.sex || "unknown"}
                                    </span>
                                </div>
                            </div>

                            {/* Shelter Info */}
                            <div className="shelter-card ">
                                <div className="shelter-avatar">
                                    <img
                                        src={pet.shelter.profilePicture}
                                        alt={pet.shelter.name}
                                    />
                                    {pet.shelter.verified && (
                                        <SafetyOutlined
                                            className="verified-badge"
                                            style={{ color: primaryColor }}
                                        />
                                    )}
                                </div>
                                <div className="shelter-info">
                                    <h2>{pet.shelter.name}</h2>
                                    <div className="shelter-location">
                                        <EnvironmentOutlined
                                            style={{ color: primaryColor }}
                                        />
                                        <span>{pet.shelter.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image Carousel */}
                        <div className="image-carousel">
                            <Carousel autoplay>
                                {pet.images.map((img, index) => (
                                    <div key={index} className="carousel-image">
                                        <img
                                            src={img}
                                            alt={`${pet.pet_name} ${index + 1}`}
                                        />
                                    </div>
                                ))}
                            </Carousel>
                        </div>
                    </div>

                    {/* Rescue Story */}
                    <div className="rescue-story">
                        <h2>
                            <HeartOutlined style={{ color: primaryColor }} />
                            Rescue Story
                        </h2>
                        <p>{pet.rescue_story}</p>
                    </div>

                    {/* Medical Section */}
                    <div className="medical-section">
                        <h2>
                            <MedicineBoxOutlined
                                style={{ color: primaryColor }}
                            />
                            Medical Care Needs
                        </h2>
                        <div className="conditions-grid">
                            {pet.medical_conditions.map((condition, index) => (
                                <div
                                    key={index}
                                    className={`condition-card ${
                                        condition.treated
                                            ? "treated"
                                            : "needs-treatment"
                                    }`}>
                                    <h3>{condition.condition}</h3>
                                    <p
                                        className={
                                            condition.treated
                                                ? "treated"
                                                : "needs-treatment"
                                        }>
                                        {condition.treated
                                            ? "✓ Treatment completed"
                                            : condition.treatment_cost
                                            ? `$${condition.treatment_cost} needed`
                                            : "Treatment required"}
                                    </p>
                                    {!condition.treated && (
                                        <span className="warning-icon">⚠️</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Special Needs */}
                    {pet.special_needs.length > 0 && (
                        <div className="special-needs">
                            <h2>Special Requirements</h2>
                            <div className="needs-tags">
                                {pet.special_needs.map((need, index) => (
                                    <span key={index} className="need-tag">
                                        {need}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Section */}
                    <div className="action-section">
                        <div className="action-details">
                            <h3>Adoption Details</h3>
                            <p>
                                {pet.adoption_fee
                                    ? `Adoption fee: $${pet.adoption_fee}`
                                    : "No adoption fee"}
                            </p>
                            <p>
                                {pet.foster_available
                                    ? "Fostering available"
                                    : "Fostering not available"}
                            </p>
                        </div>

                        <div className="action-buttons">
                            <CustomButton
                                type="primary"
                                icon={<HeartOutlined />}>
                                Apply to Adopt
                            </CustomButton>

                            {pet.foster_available && (
                                <CustomButton
                                    type="primary"
                                    icon={<HomeOutlined />}
                                    className="foster-btn">
                                    Apply to Foster
                                </CustomButton>
                            )}

                            <CustomButton
                                type="outline"
                                icon={<DollarOutlined />}
                                className="sponsor-btn">
                                Sponsor Medical Care
                            </CustomButton>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
