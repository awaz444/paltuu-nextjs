import React, { useState } from "react";
import Link from "next/link";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { Modal } from "antd";
import { EnvironmentOutlined, UserOutlined, ExclamationOutlined } from "@ant-design/icons";
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
    useSetPrimaryColor();

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

    const sortedPets = pets.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime();
    });

    if (sortedPets.length === 0) {
        return <p>No lost or found pets available at the moment.</p>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
            <Link
                href="/lost-and-found-create-listing"
                className="create-listing-btn hidden sm:flex bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 text-sm sm:text-base">

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    fill="currentColor"
                    className="bi bi-flag mb-3"
                    viewBox="0 0 16 16"
                >
                    <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001M14 1.221c-.22.078-.48.167-.766.255-.81.252-1.872.523-2.734.523-.886 0-1.592-.286-2.203-.534l-.008-.003C7.662 1.21 7.139 1 6.5 1c-.669 0-1.606.229-2.415.478A21 21 0 0 0 3 1.845v6.433c.22-.078.48-.167.766-.255C4.576 7.77 5.638 7.5 6.5 7.5c.847 0 1.548.28 2.158.525l.028.01C9.32 8.29 9.86 8.5 10.5 8.5c.668 0 1.606-.229 2.415-.478A21 21 0 0 0 14 7.655V1.222z" />
                </svg>
                Report Lost/Found
            </Link>
            <Link
                href="/lost-and-found-create-listing"
                className="fixed bottom-4 right-2 sm:hidden z-50">
                <button className="flex items-center gap-1.5 bg-white text-primary border-2 border-primary p-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="h-3.5 w-3.5" // Smaller icon
                        viewBox="0 0 16 16">

                        <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001M14 1.221c-.22.078-.48.167-.766.255-.81.252-1.872.523-2.734.523-.886 0-1.592-.286-2.203-.534l-.008-.003C7.662 1.21 7.139 1 6.5 1c-.669 0-1.606.229-2.415.478A21 21 0 0 0 3 1.845v6.433c.22-.078.48-.167.766-.255C4.576 7.77 5.638 7.5 6.5 7.5c.847 0 1.548.28 2.158.525l.028.01C9.32 8.29 9.86 8.5 10.5 8.5c.668 0 1.606-.229 2.415-.478A21 21 0 0 0 14 7.655V1.222z" />
                    </svg>
                    <span className="text-xs">Report</span> {/* Smaller text and shorter label */}
                </button>
            </Link>
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
                        <h3 className="font-bold text-xl mb-1">
                            {pet.category_name}
                        </h3>
                        <div className="flex flex-row gap-2 mb-1">
                            <p className="text-gray-400 text-sm sm:text-base">{pet.location}</p>
                        </div>
                        <div className="flex flex-row gap-2 items-center mb-2">
                            <EnvironmentOutlined className="text-primary" />
                            <p className="text-gray-600">{pet.city}</p>
                        </div>

                        {/* New User Info Section */}
                        <div className="flex flex-row gap-2 items-center">
                            {pet.user_profile_image ? (
                                <img
                                    src={pet.user_profile_image}
                                    alt={pet.user_name}
                                    className="w-5 h-5 rounded-full object-cover"
                                />
                            ) : (
                                <UserOutlined className="text-primary" />
                            )}
                            <p
                                className="text-gray-600 truncate max-w-[120px] sm:max-w-[140px]"
                                title={pet.user_name}
                            >
                                {pet.user_name}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
            {selectedPet && (
                <Modal
                    title={selectedPet.category_name}
                    open={isModalVisible}
                    onCancel={handleModalClose}
                    footer={null}
                    className="custom-modal"
                    bodyStyle={{ padding: '24px' }}
                >
                    <div className="modal-content-wrapper">
                        {/* User Header Section */}
                        <div className="flex items-center gap-3 mb-6">
                            {selectedPet.user_profile_image ? (
                                <img
                                    src={selectedPet.user_profile_image}
                                    alt={selectedPet.user_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <UserOutlined className="text-xl text-gray-400" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-lg">{selectedPet.user_name}</h3>
                                <p className="text-sm text-gray-500">
                                    {new Date(selectedPet.post_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Image Section */}
                            <div className="relative w-full aspect-square">
                                <img
                                    src={selectedPet.image_url || "./dog-placeholder.png"}
                                    alt={selectedPet.pet_description || "Lost or Found Pet"}
                                    className="w-full h-full object-cover rounded-xl shadow-sm"
                                />
                            </div>

                            {/* Details Section */}
                            <div className="space-y-4">
                                <div className="flex flex-row">
                                    <div className="text-primary text-lg"><ExclamationOutlined /></div>
                                    {/* Status Badge */}
                                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedPet.status === 'resolved'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-primary-100 text-primary-800'
                                        }`}>
                                        {selectedPet.status === 'active' ? 'Still Lost/Found' : 'Lost/Found!'}
                                    </div>
                                </div>
                                {/* Details List */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Location</label>
                                        <p className="flex items-center gap-2 text-gray-800">
                                            <EnvironmentOutlined className="text-primary" />
                                            {selectedPet.city} - {selectedPet.location}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">
                                            {selectedPet.post_type === "lost" ? "Lost Date" : "Found Date"}
                                        </label>
                                        <p className="text-gray-800">
                                            {selectedPet.date ?
                                                new Date(selectedPet.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : "N/A"}
                                        </p>
                                    </div>

                                    {/* Contact Section */}
                                    {selectedPet.contact_info && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <label className="text-sm font-medium text-gray-500">Contact Information</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-primary"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M2.005 5.995V18c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-16c-1.103 0-2 .897-2 1.995zM4 6h16v12H4V6z"></path>
                                                    <path d="M16 3H8v2h8V3z"></path>
                                                    <path d="M12 15.5 18 9h-6z"></path>
                                                </svg>
                                                <a
                                                    href={`tel:${selectedPet.contact_info}`}
                                                    className="text-primary hover:text-primary-dark transition-colors"
                                                >
                                                    {selectedPet.contact_info}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        {selectedPet.pet_description && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="text-lg font-semibold mb-2">Description</h4>
                                <p className="text-gray-700 whitespace-pre-line">
                                    {selectedPet.pet_description}
                                </p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default LostAndFoundGrid;
