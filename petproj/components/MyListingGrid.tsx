import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import { AppDispatch } from "@/app/store/store";
import "./petGrid.css";

export interface Pet {
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
}

const MyListingGrid: React.FC<PetGridProps> = ({ pets }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [showConfirm, setShowConfirm] = useState<{ pet_id: number | null, show: boolean }>({ pet_id: null, show: false });
    const [loading, setLoading] = useState(false);
    const [editingPet, setEditingPet] = useState<Pet | null>(null);

    const handleDelete = async (petId: number) => {
        const response = await fetch('/api/pets', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pet_id: petId }),
        });

        setLoading(false);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Delete failed:', errorData);
        } else {
            console.log('Delete successful');
        }
    };

    const handleConfirmation = (petId: number) => {
        setShowConfirm({ pet_id: petId, show: true });
    };

    const confirmDelete = async (petId: number) => {
        setLoading(true);
        await handleDelete(petId);
        setShowConfirm({ pet_id: null, show: false });
    };

    const cancelDelete = () => {
        setShowConfirm({ pet_id: null, show: false });
    };

    const handleEdit = (pet: Pet) => {
        setEditingPet(pet);
    };

    const handleUpdate = async (updatedPet: Pet) => {
        const response = await fetch('/api/pets', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedPet),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Update failed:', errorData);
        } else {
            console.log('Update successful');
        }

        setEditingPet(null);
    };

    const cancelEdit = () => {
        setEditingPet(null);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div
                className="create-listing-btn bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300"
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
            </div>
            {pets.map((pet) => (
                <div key={pet.pet_id} className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 relative">
                    <div className="relative">
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
                                onClick={() => handleEdit(pet)}
                            >
                                <img src="/pen.svg" alt="Edit" className="w-4 h-4" />
                            </button>
                        </div>
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
            ))}

            {/* Confirmation Popup */}
            {showConfirm.show && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-3xl shadow-lg max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">Are you sure you want to delete this pet?</h3>
                        <div className="flex justify-between">
                            <button
                                className="bg-primary text-white px-4 py-2 rounded-xl"
                                onClick={() => confirmDelete(showConfirm.pet_id!)}
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                                className="bg-white text-primary border border-primary px-4 py-2 rounded-xl"
                                onClick={cancelDelete}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Form Popup */}
            {editingPet && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-3xl shadow-lg max-w-lg w-full">
                        <h3 className="text-lg font-bold mb-4">Edit Pet Listing</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdate(editingPet);
                            }}
                        >
                            <input
                                type="text"
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.pet_name}
                                onChange={(e) => setEditingPet({ ...editingPet, pet_name: e.target.value })}
                                placeholder="Pet Name"
                            />
                            <select
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.pet_type}
                                onChange={(e) => setEditingPet({ ...editingPet, pet_type: Number(e.target.value) })}
                            >
                                <option value={1}>Dog</option>
                                <option value={2}>Cat</option>
                                <option value={3}>Bird</option>
                            </select>
                            <input
                                type="text"
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.pet_breed || ""}
                                onChange={(e) => setEditingPet({ ...editingPet, pet_breed: e.target.value })}
                                placeholder="Pet Breed"
                            />
                            <input
                                type="number"
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.age}
                                onChange={(e) => setEditingPet({ ...editingPet, age: Number(e.target.value) })}
                                placeholder="Age"
                            />
                            <textarea
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.description}
                                onChange={(e) => setEditingPet({ ...editingPet, description: e.target.value })}
                                placeholder="Description"
                            />
                            <input
                                type="number"
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.price}
                                onChange={(e) => setEditingPet({ ...editingPet, price: e.target.value })}
                                placeholder="Price"
                            />
                            <select
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.listing_type}
                                onChange={(e) => setEditingPet({ ...editingPet, listing_type: e.target.value })}
                            >
                                <option value="Adopt">Adopt</option>
                                <option value="Buy">Buy</option>
                            </select>
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={editingPet.can_live_with_dogs}
                                    onChange={(e) => setEditingPet({ ...editingPet, can_live_with_dogs: e.target.checked })}
                                />
                                <label>Can live with dogs</label>
                            </div>
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={editingPet.can_live_with_cats}
                                    onChange={(e) => setEditingPet({ ...editingPet, can_live_with_cats: e.target.checked })}
                                />
                                <label>Can live with cats</label>
                            </div>
                            <input
                                type="number"
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.energy_level}
                                onChange={(e) => setEditingPet({ ...editingPet, energy_level: Number(e.target.value) })}
                                placeholder="Energy Level (1-5)"
                            />
                            <input
                                type="number"
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.cuddliness_level}
                                onChange={(e) => setEditingPet({ ...editingPet, cuddliness_level: Number(e.target.value) })}
                                placeholder="Cuddliness Level (1-5)"
                            />
                            <textarea
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.health_issues || ""}
                                onChange={(e) => setEditingPet({ ...editingPet, health_issues: e.target.value })}
                                placeholder="Health Issues"
                            />
                            <input
                                type="text"
                                className="border rounded p-2 w-full mb-4"
                                value={editingPet.sex || ""}
                                onChange={(e) => setEditingPet({ ...editingPet, sex: e.target.value })}
                                placeholder="Sex (Male/Female)"
                            />
                            <button
                                type="submit"
                                className="w-full bg-primary text-white p-2 rounded hover:bg-primary-dark transition"
                            >
                                Update
                            </button>
                            <button
                                type="button"
                                className="w-full bg-gray-300 text-black p-2 rounded mt-2 hover:bg-gray-400 transition"
                                onClick={cancelEdit}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyListingGrid;
