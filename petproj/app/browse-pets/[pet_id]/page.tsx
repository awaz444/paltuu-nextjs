'use client';
import React, { useState, useEffect } from "react";
import { PetWithImages } from "../../types/petWithImages";
import Navbar from "../../../components/navbar";
import AdoptionFormModal from "../../../components/AdoptionFormModal";
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

let user_id: string;
const PetDetailsPage: React.FC<{ params: { pet_id: string } }> = ({ params }) => {
    const { pet_id } = params;
    const [pet, setPet] = useState<PetWithImages | null>(null);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [IsModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useSetPrimaryColor();

    useEffect(() => {
        const userString = localStorage.getItem("user");
        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user?.id) {
                    user_id=user.id;
                } else {
                    console.warn("User ID is missing from stored user data.");
                }
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
        const userString = localStorage.getItem("user");

        if (userString) {
            setIsModalVisible(true);
        } else {
            message.warning("You need to log in to apply for adoption.");
            window.location.href = "/login";
        }
    };

    const handleModalClose = () => setIsModalVisible(false);
    const handleFormSubmit = (formData: any) => {
        console.log("Adoption form data submitted:", formData);
    };

    const [primaryColor, setPrimaryColor] = useState("#000000"); // Default fallback color

    useEffect(() => {
        // Get the computed style of the `--primary-color` CSS variable
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
                                                <g id="SVGRepo_iconCarrier">
                                                    <g>
                                                        <g>
                                                            <path d="M21.572,28.926c5.067,0,9.19-5.533,9.19-12.334s-4.123-12.334-9.19-12.334c-5.067,0-9.19,5.533-9.19,12.334 S16.504,28.926,21.572,28.926z M21.572,7.258c3.355,0,6.19,4.275,6.19,9.334s-2.834,9.334-6.19,9.334 c-3.356,0-6.19-4.275-6.19-9.334S18.216,7.258,21.572,7.258z"></path>
                                                            <path d="M48.83,40.922c-0.189-0.256-0.37-0.498-0.466-0.707c-2.054-4.398-7.689-9.584-16.813-9.713L31.2,30.5 c-8.985,0-14.576,4.912-16.813,9.51c-0.077,0.156-0.247,0.361-0.427,0.576c-0.212,0.254-0.423,0.512-0.604,0.793 c-1.89,2.941-2.853,6.25-2.711,9.318c0.15,3.26,1.512,5.877,3.835,7.369c0.937,0.604,1.95,0.907,3.011,0.907 c2.191,0,4.196-1.233,6.519-2.664c1.476-0.907,3.002-1.848,4.698-2.551c0.191-0.063,0.968-0.158,2.241-0.158 c1.515,0,2.6,0.134,2.833,0.216c1.653,0.729,3.106,1.688,4.513,2.612c2.154,1.418,4.188,2.759,6.395,2.759 c0.947,0,1.867-0.248,2.732-0.742c4.778-2.715,5.688-10.162,2.03-16.603C49.268,41.52,49.048,41.219,48.83,40.922z M45.939,55.838 c-0.422,0.238-0.818,0.35-1.25,0.35c-1.308,0-2.9-1.049-4.746-2.264c-1.438-0.947-3.066-2.02-4.949-2.852 c-0.926-0.41-2.934-0.472-4.046-0.472c-1.629,0-2.76,0.128-3.362,0.375c-1.943,0.808-3.646,1.854-5.149,2.779 c-1.934,1.188-3.604,2.219-4.946,2.219c-0.49,0-0.931-0.137-1.389-0.432c-1.483-0.953-2.356-2.724-2.461-4.984 c-0.113-2.45,0.682-5.135,2.238-7.557c0.113-0.177,0.25-0.334,0.383-0.492c0.274-0.328,0.586-0.701,0.823-1.188 c1.84-3.781,6.514-7.82,14.115-7.82l0.308,0.002c7.736,0.109,12.451,4.369,14.137,7.982c0.225,0.479,0.517,0.875,0.773,1.223 c0.146,0.199,0.301,0.4,0.426,0.619C49.684,48.326,49.279,53.939,45.939,55.838z"></path>
                                                            <path d="M41.111,28.926c5.068,0,9.191-5.533,9.191-12.334S46.18,4.258,41.111,4.258c-5.066,0-9.189,5.533-9.189,12.334 S36.044,28.926,41.111,28.926z M41.111,7.258c3.355,0,6.191,4.275,6.191,9.334s-2.834,9.334-6.191,9.334 c-3.355,0-6.189-4.275-6.189-9.334S37.756,7.258,41.111,7.258z"></path>
                                                            <path d="M56.205,22.592c-4.061,0-7.241,4.213-7.241,9.59c0,5.375,3.181,9.588,7.241,9.588s7.24-4.213,7.24-9.588 C63.445,26.805,60.266,22.592,56.205,22.592z M56.205,38.77c-2.299,0-4.241-3.018-4.241-6.588c0-3.572,1.942-6.59,4.241-6.59 s4.24,3.018,4.24,6.59C60.445,35.752,58.503,38.77,56.205,38.77z"></path>
                                                            <path d="M14.482,32.182c0-5.377-3.181-9.59-7.241-9.59S0,26.805,0,32.182c0,5.375,3.181,9.588,7.241,9.588 S14.482,37.557,14.482,32.182z M7.241,38.77C4.942,38.77,3,35.752,3,32.182c0-3.572,1.942-6.59,4.241-6.59 c2.299,0,4.241,3.018,4.241,6.59C11.482,35.752,9.54,38.77,7.241,38.77z"></path>
                                                        </g>
                                                    </g>
                                                </g>
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
                                    {pet.adoption_status === "available" ? "Available" : "Adopted"}
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
                                            Adoption Fee
                                        </h3>
                                        <p className="text-xl font-bold text-gray-800">
                                            {pet.price ? `PKR ${pet.price}` : "None"}
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
                                >
                                    Apply for Adoption Process
                                </Button>

                                <Button
                                    block
                                    size="large"
                                    className="button-two h-14 text-lg font-semibold rounded-xl border-primary text-primary"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    Contact Owner
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

            <AdoptionFormModal
                petId={parseInt(pet_id)}
                userId={user_id}
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
