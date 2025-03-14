'use client';
import React, { useState, useEffect } from "react";
import { PetWithImages } from "../../types/petWithImages";
import Navbar from "../../../components/navbar";
import FosterFormModal from "@/components/FosterFormModal";
import LoginModal from "../../../components/LoginModal";
import {
    Spin,
    Card,
    List,
    Divider,
    Button,
    Modal,
    message,
    Form,
    Input,
    Rate,
    Carousel,
    Tag,
    Row,
    Col,
} from "antd";
import {
    CopyOutlined,
    WhatsAppOutlined,
    HeartOutlined,
    EnvironmentOutlined,
    InfoCircleOutlined,
    DownOutlined,
    MedicineBoxOutlined,
} from "@ant-design/icons";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { MoonLoader } from "react-spinners";
import './styles.css'

const PetDetailsPage: React.FC<{ params: { pet_id: string } }> = ({ params }) => {
    const { pet_id } = params;
    const [pet, setPet] = useState<PetWithImages | null>(null);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [IsModalOpen, setIsModalOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useSetPrimaryColor();

    useEffect(() => {
        const userString = localStorage.getItem("user");
        if (userString) {
            try {
                const user = JSON.parse(userString);
                setUserId(user?.id || null);
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchPetDetails = async () => {
            try {
                const res = await fetch(`/api/browse-pets/${pet_id}`);
                if (!res.ok) throw new Error("Pet not found");

                const petData = await res.json();
                setPet(petData);

                const images = [
                    petData.profile_image_url,
                    ...petData.additional_images.map(
                        (image: { image_url: string }) => image.image_url
                    ),
                ]
                    .filter(Boolean)
                    .slice(0, 5);
                setCarouselImages(images);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (pet_id) fetchPetDetails();
    }, [pet_id]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success("Copied to clipboard!");
    };

    const handleWhatsApp = (phone: string) => {
        const whatsappUrl = `https://wa.me/${phone}`;
        window.open(whatsappUrl, "_blank");
    };

    const handleAdoptClick = () => {
        if (pet?.adoption_status !== 'available') return;

        if (!userId) {
            setShowLoginModal(true);
            return;
        }
        setIsModalVisible(true);
    };

    const handleContactClick = () => {
        if (pet?.adoption_status !== 'available') return;
        setIsModalOpen(true);
    };

    const handleLoginSuccess = () => {
        const userString = localStorage.getItem("user");
        if (userString) {
            const user = JSON.parse(userString);
            setUserId(user.id);
        }
        setShowLoginModal(false);
    };

    const handleModalClose = () => setIsModalVisible(false);
    const handleFormSubmit = (formData: any) => {
        console.log("Adoption form data submitted:", formData);
    };

    const [primaryColor, setPrimaryColor] = useState("#000000");

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="text-center mt-10">
                <h2 className="text-lg font-semibold">
                    Pet details not available.
                </h2>
            </div>
        );
    }

    return (
        <>
            <LoginModal
                visible={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />
            <Modal
                title="Contact Information"
                visible={IsModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                className="rounded-lg"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-700">{pet.phone_number}</p>
                            <p className="text-sm text-gray-500">Phone Number</p>
                        </div>
                        <Button
                            icon={<CopyOutlined className="text-primary" />}
                            size="small"
                            onClick={() => handleCopy(pet.phone_number)}
                            className="border-none shadow-none"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-700">{pet.email}</p>
                            <p className="text-sm text-gray-500">Email Address</p>
                        </div>
                        <Button
                            icon={<CopyOutlined className="text-primary" />}
                            size="small"
                            onClick={() => handleCopy(pet.email)}
                            className="border-none shadow-none"
                        />
                    </div>

                    <Button
                        type="primary"
                        block
                        icon={<WhatsAppOutlined />}
                        className="bg-green-500 hover:bg-green-600 text-white h-12 rounded-lg flex items-center justify-center"
                        onClick={() => handleWhatsApp(pet.phone_number)}
                    >
                        Message via WhatsApp
                    </Button>
                </div>
            </Modal>

            <Navbar />
            <div className="pet-details min-h-screen bg-gray-50 py-8 px-4 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <Card className="shadow-xl rounded-2xl overflow-hidden border-none">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Image Gallery */}
                            <div className="md:w-1/2">
                                <Carousel
                                    autoplay
                                    dots={{ className: "custom-dots" }}
                                    className="rounded-xl overflow-hidden"
                                >
                                    {carouselImages.map((image) => (
                                        <div key={image} className="aspect-square">
                                            <img
                                                src={image || "/placeholder.jpg"}
                                                alt={`${pet.pet_name}-image`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </Carousel>
                            </div>

                            {/* Pet Information */}
                            <div className="md:w-1/2 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                            {pet.pet_name}
                                        </h1>
                                        <div className="flex items-center gap-2 text-lg text-gray-600">
                                            <svg
                                                fill="#000000"
                                                version="1.1"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 63.445 63.445"
                                                className="w-5 h-5"
                                            >
                                                {/* SVG paths */}
                                            </svg>
                                            <span>{pet.pet_breed}</span>
                                            <span>•</span>
                                            <span>{pet.age} {pet.age > 1 ? "years" : "year"} old</span>
                                        </div>
                                    </div>
                                </div>

                                <Tag
                                    color={pet.adoption_status === "available" ? "green" : "red"}
                                    className="rounded-full px-4 py-1 text-base"
                                >
                                    {pet.adoption_status === "available" ? "Available" : "Fostered"}
                                </Tag>

                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary text-white pr-3 pl-3 pt-3 pb-2 rounded-lg">
                                            <EnvironmentOutlined className="text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 mb-1">
                                                Location
                                            </h3>
                                            <p className="text-lg text-gray-800">
                                                {pet.city}, {pet.area}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <h3 className="text-sm font-semibold text-gray-500 mb-1">
                                            Owner is willing to pay you
                                        </h3>
                                        <p className="text-xl font-bold text-gray-800">
                                            {pet.price
                                                ? `PKR ${pet.price}${pet.payment_frequency ? ` per ${pet.payment_frequency}` : ""}`
                                                : "None"}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <h3 className="text-sm font-semibold text-gray-500 mb-1">
                                            Sex
                                        </h3>
                                        <p className="text-xl font-bold text-gray-800 capitalize">
                                            {pet.sex || "Unknown"}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    className="button-one h-14 text-lg bg-primary font-semibold rounded-xl hover:bg-primary"
                                    onClick={handleAdoptClick}
                                    disabled={pet.adoption_status !== 'available'}
                                >
                                    {pet.adoption_status === 'available' 
                                        ? userId  
                                            ? "Apply for Fostering" 
                                            : "Login to Apply"
                                        : "Already Fostered"}
                                </Button>

                                <Button
                                    block
                                    size="large"
                                    className="button-two h-14 text-lg font-semibold rounded-xl border-primary text-primary"
                                    onClick={handleContactClick}
                                    disabled={pet.adoption_status !== 'available'}
                                >
                                    {pet.adoption_status === 'available' 
                                        ? "Contact Owner" 
                                        : "Not Available"}
                                </Button>
                            </div>
                        </div>

                        <Divider className="my-8" />

                        {/* Detailed Information Sections */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <Section title="About" icon={<InfoCircleOutlined />}>
                                    <p className="text-gray-600 leading-relaxed">
                                        {pet.description || "No description provided."}
                                    </p>
                                </Section>

                                <Section title="Health & Care" icon={<MedicineBoxOutlined />}>
                                    <InfoRow label="Vaccinated" value={pet.vaccinated ? "Yes" : "No"} />
                                    <InfoRow label="Neutered" value={pet.neutered ? "Yes" : "No"} />
                                    <InfoRow label="Health Issues" value={pet.health_issues || "None"} />
                                </Section>
                            </div>

                            <div className="space-y-6">
                                <Section title="Behavior">
                                    {/* Energy Level */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Energy Level
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={pet.energy_level}
                                                disabled
                                                className="mt-2 w-full appearance-none h-2 rounded-lg bg-gray-300"
                                                style={{
                                                    background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${(pet.energy_level - 1) * 25}%, #D1D5DB ${(pet.energy_level - 1) * 25}%, #D1D5DB 100%)`
                                                }}
                                            />
                                            <div className="w-full flex justify-between mt-2 text-sm text-gray-500">
                                                <span>Chilled</span>
                                                <span>Hyper</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cuddliness Level */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Cuddliness Level
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={pet.cuddliness_level}
                                                disabled
                                                className="mt-2 w-full appearance-none h-2 rounded-lg bg-gray-300"
                                                style={{
                                                    background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${(pet.cuddliness_level - 1) * 25}%, #D1D5DB ${(pet.cuddliness_level - 1) * 25}%, #D1D5DB 100%)`
                                                }}
                                            />
                                            <div className="w-full flex justify-between mt-2 text-sm text-gray-500">
                                                <span>Independent</span>
                                                <span>Cuddler</span>
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                                <Section title="Living Preferences">
                                    <InfoRow label="Good with Dogs" value={pet.can_live_with_dogs ? "Yes" : "No"} />
                                    <InfoRow label="Good with Cats" value={pet.can_live_with_cats ? "Yes" : "No"} />
                                    <InfoRow label="Requires Companion at all times" value={pet.must_have_someone_home ? "Yes" : "No"} />
                                </Section>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <FosterFormModal
                petId={parseInt(pet_id)}
                userId={userId || ""}
                visible={isModalVisible}
                onClose={handleModalClose}
                onSubmit={handleFormSubmit}
            />
        </>
    );
};

const Section: React.FC<{ title: string; icon?: React.ReactNode; children?: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
            {icon && React.cloneElement(icon as React.ReactElement, { className: "text-primary text-lg" })}
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>
        {children}
    </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-800 font-medium">{value}</span>
    </div>
);

export default PetDetailsPage;
