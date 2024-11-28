import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { AppDispatch } from "@/app/store/store";

import "./petGrid.css";

interface Pet {
    pet_id: number;
    owner_id: number;
    pet_name: string;
    pet_type: number;
    pet_breed: string | null;
    city_id: number;
    area: string;
    age: number;
    description: string;
    adoption_status: string;
    price: string;
    min_age_of_children: number;
    can_live_with_dogs: boolean;
    can_live_with_cats: boolean;
    must_have_someone_home: boolean;
    energy_level: number;
    cuddliness_level: number;
    health_issues: string;
    created_at: string;
    sex: string | null;
    listing_type: string;
    vaccinated: boolean | null;
    neutered: boolean | null;
    payment_frequency: string | null;
    city: string;
    profile_image_url: string | null;
    image_id: number | null;
    image_url: string | null;
}

interface PetGridProps {
    pets: Pet[];
    isMyListing?: boolean;
}

const PetGrid: React.FC<PetGridProps> = ({ pets, isMyListing = false }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [showConfirm, setShowConfirm] = useState<{ pet_id: number | null, show: boolean }>({ pet_id: null, show: false });
    const [loading, setLoading] = useState(false);

    const fetchPets = async () => {
        // Replace with your logic to refetch pets (e.g., dispatch an action or call the API)
        console.log("Fetching pets...");
    };

    const handleDelete = async (petId: number) => {
        const response = await fetch('/api/pets', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pet_id: petId }),
        });

        setLoading(false); // Stop loading

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Delete failed:', errorData);
        } else {
            console.log('Delete successful');
            await fetchPets(); // Refetch pets after successful deletion
        }
    };

    const handleConfirmation = (petId: number) => {
        setShowConfirm({ pet_id: petId, show: true });
    };

    const confirmDelete = async (petId: number) => {
        setLoading(true); // Start loading while deleting
        await handleDelete(petId);
        setShowConfirm({ pet_id: null, show: false }); // Close the confirmation popup
    };

    const cancelDelete = () => {
        setShowConfirm({ pet_id: null, show: false }); // Close the confirmation popup without deletion
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <Link
                href="/create-listing"
                className="create-listing-btn bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex flex-col items-center justify-center border-2 border-transparent hover:border-[#A03048] hover:scale-102 transition-all duration-300"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-plus-circle mb-5 plus-sign"
                    viewBox="0 0 16 16"
                >
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                </svg>
                Create new listing
            </Link>
            {pets.map((pet) => {
                const CardContent = (
                    <div
                        className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-[#A03048] hover:scale-102 transition-all duration-300 relative"
                    >
                        <div className="relative">
                            {isMyListing && (
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {/* Delete Button */}
                                    <button
                                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-200 transition"
                                        onClick={() => handleConfirmation(pet.pet_id)}
                                    >
                                        <img src="/trash.svg" alt="Delete" className="w-4 h-4" />
                                    </button>
                                    {/* Edit Button */}
                                    <button
                                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-200 transition"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click
                                            console.log('pen clicked');
                                        }}
                                    >
                                        <img src="/pen.svg" alt="Edit" className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <img
                                src={pet.image_url || '/dog-placeholder.png'}
                                alt={pet.pet_name}
                                className="w-full h-48 object-cover rounded-2xl"
                            />
                            {Number(pet.price) > 0 && (
                                <div className="absolute bottom-2 right-2 bg-primary text-white text-sm font-semibold px-3 py-1 rounded-full">
                                    PKR {pet.price}
                                    {pet.payment_frequency && ` / ${pet.payment_frequency}`}
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-2xl mb-1">{pet.pet_name}</h3>
                            <p className="text-gray-600 mb-1">
                                {pet.age} {pet.age > 1 ? 'years' : 'year'} old
                            </p>
                            <p className="text-gray-600 mb-1">
                                {pet.city} - {pet.area}
                            </p>
                        </div>
                    </div>
                );

                return isMyListing ? (
                    <div key={pet.pet_id}>{CardContent}</div>
                ) : (
                    <Link
                        key={pet.pet_id}
                        href={
                            pet.listing_type === 'adoption'
                                ? `/browse-pets/${pet.pet_id}`
                                : `/foster-pets/${pet.pet_id}`
                        }
                        passHref
                    >
                        {CardContent}
                    </Link>
                );
            })}
            
            {/* Confirmation Popup */}
            {showConfirm.show && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-3xl shadow-lg max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">Are you sure you want to delete this pet?</h3>
                        <div className="flex justify-between">
                            <button
                                className="bg-primary text-white px-4 py-2 rounded rounded-xl"
                                onClick={() => confirmDelete(showConfirm.pet_id!)}
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                                className="bg-white text-primary border border-primary px-4 py-2 rounded rounded-xl"
                                onClick={cancelDelete}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PetGrid;
