import React, { useState, useEffect } from "react";
import Link from "next/link";
import { EnvironmentOutlined, PhoneOutlined } from "@ant-design/icons";
import "./LostAndFoundGrid.css";

interface LostAndFoundPet {
    post_id: number;
    user_id: number;
    post_type: string;
    pet_description: string;
    city_id: number;
    location: string;
    contact_info: string;
    post_date: string;
    status: string;
    category_id: number;
    image_url: string | null;
    city: string;
    category_name: string;
    date: string | null;
    user_name: string;
    user_profile_image: string | null;
}

interface LostAndFoundGridProps {
    pets: LostAndFoundPet[];
}

const LostAndFoundGrid: React.FC<LostAndFoundGridProps> = ({ pets }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedPet, setSelectedPet] = useState<LostAndFoundPet | null>(null);

    const showModal = (pet: LostAndFoundPet) => {
        setSelectedPet(pet);
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedPet(null);
    };

    // Close on Escape key
    useEffect(() => {
        if (!isModalVisible) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleModalClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isModalVisible]);

    // Lock body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = isModalVisible ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isModalVisible]);

    const sortedPets = [...pets].sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime();
    });

    if (sortedPets.length === 0) {
        return <p>No lost or found pets available at the moment.</p>;
    }

    const formatDate = (d: string | null) =>
        d
            ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : "N/A";

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {/* Report button — desktop card */}
                <Link
                    href="/lost-and-found-create-listing"
                    className="create-listing-btn hidden sm:flex bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 text-sm sm:text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-flag mb-3" viewBox="0 0 16 16">
                        <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001M14 1.221c-.22.078-.48.167-.766.255-.81.252-1.872.523-2.734.523-.886 0-1.592-.286-2.203-.534l-.008-.003C7.662 1.21 7.139 1 6.5 1c-.669 0-1.606.229-2.415.478A21 21 0 0 0 3 1.845v6.433c.22-.078.48-.167.766-.255C4.576 7.77 5.638 7.5 6.5 7.5c.847 0 1.548.28 2.158.525l.028.01C9.32 8.29 9.86 8.5 10.5 8.5c.668 0 1.606-.229 2.415-.478A21 21 0 0 0 14 7.655V1.222z" />
                    </svg>
                    Report Lost/Found
                </Link>

                {/* Report button — mobile floating */}
                <Link href="/lost-and-found-create-listing" className="fixed bottom-4 left-1/2 transform -translate-x-1/2 sm:hidden z-40">
                    <button className="flex items-center gap-1.5 bg-white text-primary border-2 border-primary p-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="h-3.5 w-3.5" viewBox="0 0 16 16">
                            <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001M14 1.221c-.22.078-.48.167-.766.255-.81.252-1.872.523-2.734.523-.886 0-1.592-.286-2.203-.534l-.008-.003C7.662 1.21 7.139 1 6.5 1c-.669 0-1.606.229-2.415.478A21 21 0 0 0 3 1.845v6.433c.22-.078.48-.167.766-.255C4.576 7.77 5.638 7.5 6.5 7.5c.847 0 1.548.28 2.158.525l.028.01C9.32 8.29 9.86 8.5 10.5 8.5c.668 0 1.606-.229 2.415-.478A21 21 0 0 0 14 7.655V1.222z" />
                        </svg>
                        <span className="text-xs">Report Lost/Found</span>
                    </button>
                </Link>

                {/* Pet cards */}
                {sortedPets.map((pet) => (
                    <div
                        key={pet.post_id}
                        className="bg-white pr-3 pl-3 pt-3 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:cursor-pointer hover:scale-102 transition-all duration-300"
                        onClick={() => showModal(pet)}
                    >
                        <div className="relative">
                            <img
                                src={pet.image_url || "./dog-placeholder.png"}
                                alt={pet.pet_description || "Lost or Found Pet"}
                                className="w-full aspect-square object-cover rounded-2xl"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-xl mb-1">{pet.category_name}</h3>
                            <div className="flex flex-row gap-2 mb-1 min-w-0">
                                <p className="text-gray-400 text-sm sm:text-base truncate">{pet.location}</p>
                            </div>
                            <div className="flex flex-row gap-2 items-center mb-2">
                                <EnvironmentOutlined className="text-primary" />
                                <p className="text-gray-600">{pet.city}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== Custom Modal ===== */}
            {isModalVisible && selectedPet && (
                /* Backdrop */
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={handleModalClose}
                >
                    {/* Modal card — click inside doesn't close */}
                    <div
                        className="bg-white rounded-3xl shadow-md w-full max-w-2xl mx-auto relative overflow-y-auto max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <img
                                    src={selectedPet.user_profile_image || "/no-profile/no-profile.jpg"}
                                    alt={selectedPet.user_name}
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900 leading-tight">{selectedPet.user_name}</p>
                                    <p className="text-xs text-gray-400">{formatDate(selectedPet.post_date)}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleModalClose}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg transition-colors"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Image */}
                                <img
                                    src={selectedPet.image_url || "./dog-placeholder.png"}
                                    alt={selectedPet.pet_description || "Lost or Found Pet"}
                                    className="w-full aspect-square object-cover rounded-2xl"
                                />

                                {/* Details */}
                                <div className="flex flex-col gap-4">
                                    {/* Status badge */}
                                    <span className={`self-start px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedPet.status === "resolved"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-primary/10 text-primary"
                                    }`}>
                                        {selectedPet.status === "resolved" ? "Resolved" : selectedPet.post_type === "lost" ? "Still Lost" : "Still Found"}
                                    </span>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Pet Category</label>
                                        <p className="border rounded-2xl p-3 text-gray-800 bg-gray-50">{selectedPet.category_name}</p>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                                        <p className="border rounded-2xl p-3 text-gray-800 bg-gray-50 flex items-center gap-2">
                                            <EnvironmentOutlined className="text-primary shrink-0" />
                                            {selectedPet.city}{selectedPet.location ? ` — ${selectedPet.location}` : ""}
                                        </p>
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                            {selectedPet.post_type === "lost" ? "Date Lost" : "Date Found"}
                                        </label>
                                        <p className="border rounded-2xl p-3 text-gray-800 bg-gray-50">{formatDate(selectedPet.date)}</p>
                                    </div>

                                    {/* Contact */}
                                    {selectedPet.contact_info && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Contact Info</label>
                                            <a
                                                href={`tel:${selectedPet.contact_info}`}
                                                className="flex items-center gap-2 border-2 border-primary rounded-2xl p-3 text-primary font-medium hover:bg-primary/5 transition-colors"
                                            >
                                                <PhoneOutlined />
                                                {selectedPet.contact_info}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {selectedPet.pet_description && (
                                <div className="mt-6 pt-5 border-t border-gray-100">
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Pet Description</label>
                                    <p className="border rounded-2xl p-3 text-gray-800 bg-gray-50 whitespace-pre-line">
                                        {selectedPet.pet_description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LostAndFoundGrid;
