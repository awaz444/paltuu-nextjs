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
} from "@ant-design/icons";
import { RescuePet, rescueStatusLabel } from "@/types/rescue";
import { formatAge } from "@/utils/formatAge";
import "./styles.css";

export type { RescuePet };

export default function RescuePetClient({
    params,
    initialPet,
}: {
    params: { rescue_id: string };
    initialPet?: RescuePet;
}) {
    const router = useRouter();
    const [pet, setPet] = useState<RescuePet | null>(initialPet ?? null);
    const [loading, setLoading] = useState(!initialPet);
    const [error, setError] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#3b82f6");

    useEffect(() => {
        if (initialPet) return;

        const fetchPetData = async () => {
            try {
                const response = await fetch(
                    `/api/v1/rescue/pets/${params.rescue_id}`
                );
                if (!response.ok) throw new Error("Pet not found");
                const data = await response.json();
                setPet(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchPetData();
    }, [params.rescue_id, initialPet]);

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) setPrimaryColor(color);
    }, []);

    if (loading) {
        return (
            <>
                <div className="flex justify-center items-center min-h-screen">
                    <MoonLoader color={primaryColor} size={30} />
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
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
                            ? "#4CAF50"
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
                                    className={`status-badge ${pet.adoption_status || "available"}`}>
                                    {rescueStatusLabel(pet.adoption_status).toUpperCase()}
                                </span>
                            </div>

                            {/* Basic Info */}
                            <div className="pet-meta">
                                <div className="meta-item">
                                    <MedicineBoxOutlined style={{ color: primaryColor }} />
                                    <span>Vaccinated: {pet.vaccinated ? "Yes" : "No"}</span>
                                </div>
                                <div className="meta-item">
                                    <MedicineBoxOutlined style={{ color: primaryColor }} />
                                    <span>Neutered: {pet.neutered ? "Yes" : "No"}</span>
                                </div>
                                <div className="meta-item">
                                    <HeartOutlined style={{ color: primaryColor }} />
                                    <span>Age: {formatAge(pet.age_months)}</span>
                                </div>
                                <div className="meta-item">
                                    {pet.sex === "male" ? (
                                        <ManOutlined style={{ color: primaryColor }} />
                                    ) : pet.sex === "female" ? (
                                        <WomanOutlined style={{ color: primaryColor }} />
                                    ) : (
                                        <QuestionOutlined style={{ color: primaryColor }} />
                                    )}
                                    <span className="capitalize">{pet.sex || "unknown"}</span>
                                </div>
                            </div>

                            {/* Shelter Info */}
                            {pet.shelter && (
                            <div className="shelter-card">
                                <div className="shelter-avatar">
                                    <img
                                        src={pet.shelter.profilePicture || "/dog-placeholder.png"}
                                        alt={pet.shelter.name}
                                        // SSR'd images can fail before hydration attaches onError
                                        ref={(img) => {
                                            if (img?.complete && img.naturalWidth === 0) {
                                                img.src = "/dog-placeholder.png";
                                            }
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.src = "/dog-placeholder.png";
                                        }}
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
                                        <EnvironmentOutlined style={{ color: primaryColor }} />
                                        <span>{pet.shelter.location || pet.area}</span>
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>

                        {/* Image Carousel */}
                        <div className="image-carousel">
                            <Carousel autoplay>
                                {(pet.images?.length ? pet.images : ["/dog-placeholder.png"]).map((img, index) => (
                                    <div key={index} className="carousel-image">
                                        <img
                                            src={img}
                                            alt={`${pet.pet_name} rescue photo ${index + 1} — available for adoption in Pakistan`}
                                        />
                                    </div>
                                ))}
                            </Carousel>
                        </div>
                    </div>

                    {/* Rescue Story */}
                    {(pet.rescue_story || pet.description) && (
                    <div className="rescue-story">
                        <h2>
                            <HeartOutlined style={{ color: primaryColor }} />
                            Rescue Story
                        </h2>
                        <p>{pet.rescue_story || pet.description}</p>
                    </div>
                    )}

                    {/* Medical Section */}
                    {pet.medical_conditions?.length > 0 && (
                    <div className="medical-section">
                        <h2>
                            <MedicineBoxOutlined style={{ color: primaryColor }} />
                            Medical Care Needs
                        </h2>
                        <div className="conditions-grid">
                            {pet.medical_conditions.map((condition, index) => (
                                <div
                                    key={index}
                                    className={`condition-card ${condition.treated ? "treated" : "needs-treatment"}`}>
                                    <h3>{condition.condition}</h3>
                                    <p className={condition.treated ? "treated" : "needs-treatment"}>
                                        {condition.treated
                                            ? "✓ Treatment completed"
                                            : condition.treatment_cost
                                            ? `Rs ${Number(condition.treatment_cost).toLocaleString()} needed`
                                            : "Treatment required"}
                                    </p>
                                    {!condition.treated && <span className="warning-icon">⚠️</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Special Needs */}
                    {pet.special_needs?.length > 0 && (
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
                                {pet.price
                                    ? `Adoption fee: Rs ${Number(pet.price).toLocaleString()}`
                                    : "No adoption fee"}
                            </p>
                        </div>

                        <div className="action-buttons">
                            <CustomButton type="primary" icon={<HeartOutlined />}>
                                Apply to Adopt
                            </CustomButton>

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
