import React, { useState } from "react";
import { Modal, Input, Select, Checkbox, Button } from "antd";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store/store";
import "./petGrid.css";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";


const { TextArea } = Input;

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
    const [successMessage, setSuccessMessage] = useState(false);
    useSetPrimaryColor();

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

    const handleUpdate = async () => {
        if (!editingPet) return;

        const response = await fetch("/api/pets", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(editingPet),
        });

        if (!response.ok) {
            console.error("Update failed:", await response.json());
        } else {
            console.log("Update successful");
            setSuccessMessage(true); // Show success message
            setTimeout(() => setSuccessMessage(false), 3000); // Hide after 3 seconds
        }

        setEditingPet(null);
    };

    const handleCancel = () => {
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
    <Modal
        title="Edit Pet Listing"
        visible={!!editingPet}
        onCancel={handleCancel}
        onOk={handleUpdate}
        okText="Update"
        cancelText="Cancel"
    >
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Pet Name</label>
            <Input
                placeholder="Pet Name"
                value={editingPet.pet_name}
                onChange={(e) =>
                    setEditingPet({ ...editingPet, pet_name: e.target.value })
                }
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Pet Type</label>
            <Select
                className="w-full"
                value={editingPet.pet_type}
                onChange={(value) =>
                    setEditingPet({ ...editingPet, pet_type: value })
                }
            >
                <Select.Option value={1}>Dog</Select.Option>
                <Select.Option value={2}>Cat</Select.Option>
                <Select.Option value={3}>Bird</Select.Option>
            </Select>
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Pet Breed</label>
            <Input
                placeholder="Pet Breed"
                value={editingPet.pet_breed || ""}
                onChange={(e) =>
                    setEditingPet({ ...editingPet, pet_breed: e.target.value })
                }
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <Input
                placeholder="Age"
                type="number"
                value={editingPet.age}
                onChange={(e) =>
                    setEditingPet({ ...editingPet, age: Number(e.target.value) })
                }
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <TextArea
                placeholder="Description"
                rows={4}
                value={editingPet.description}
                onChange={(e) =>
                    setEditingPet({ ...editingPet, description: e.target.value })
                }
            />
        </div>

        <div className="flex justify-between mb-4">
            <button
                className={`w-1/2 py-2 px-4 text-center rounded-lg ${editingPet.listing_type === "adoption"
                        ? "bg-primary text-white"
                        : "bg-gray-100"
                    }`}
                onClick={() =>
                    setEditingPet({ ...editingPet, listing_type: "adoption" })
                }
            >
                Adoption
            </button>
            <button
                className={`w-1/2 py-2 px-4 text-center rounded-lg ${editingPet.listing_type === "foster"
                        ? "bg-primary text-white"
                        : "bg-gray-100"
                    }`}
                onClick={() =>
                    setEditingPet({ ...editingPet, listing_type: "foster" })
                }
            >
                Foster
            </button>
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <Input
                placeholder="Price"
                type="number"
                value={editingPet.price}
                onChange={(e) =>
                    setEditingPet({ ...editingPet, price: e.target.value })
                }
                // disabled={editingPet.listing_type === "adoption"}
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Minimum Age of Children</label>
            <Input
                placeholder="Minimum Age of Children"
                type="number"
                value={editingPet.min_age_of_children}
                onChange={(e) =>
                    setEditingPet({
                        ...editingPet,
                        min_age_of_children: Number(e.target.value),
                    })
                }
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Can live with dogs</label>
            <Checkbox
                checked={editingPet.can_live_with_dogs}
                onChange={(e) =>
                    setEditingPet({
                        ...editingPet,
                        can_live_with_dogs: e.target.checked,
                    })
                }
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Can live with cats</label>
            <Checkbox
                checked={editingPet.can_live_with_cats}
                onChange={(e) =>
                    setEditingPet({
                        ...editingPet,
                        can_live_with_cats: e.target.checked,
                    })
                }
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Must have someone home</label>
            <Checkbox
                checked={editingPet.must_have_someone_home}
                onChange={(e) =>
                    setEditingPet({
                        ...editingPet,
                        must_have_someone_home: e.target.checked,
                    })
                }
            />
        </div>

        {/* Energy Level Slider */}
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Energy Level</label>
            <div className="relative">
                <input
                    type="range"
                    min="1"
                    max="5"
                    className="mt-2 w-full"
                    value={editingPet.energy_level ?? 3}
                    onChange={(e) =>
                        setEditingPet({
                            ...editingPet,
                            energy_level: Number(e.target.value),
                        })
                    }
                    onMouseDown={() => {
                        if (editingPet.energy_level === null) setEditingPet({
                            ...editingPet,
                            energy_level: 3,
                        }); 
                    }}
                                style={{
                                    background: editingPet.energy_level
                                        ? `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${
                                              (editingPet.energy_level - 1) * 25
                                          }%, #D1D5DB ${
                                              (editingPet.energy_level - 1) * 25
                                          }%, #D1D5DB 100%)`
                                        : "#D1D5DB important!", // Default background when unselected
                                }}
                />
                <div className="w-full flex justify-between -top-2">
                    <span className="text-sm text-gray-500">Chilled</span>
                    <span className="text-sm text-gray-500">Hyper</span>
                </div>
            </div>
        </div>

        {/* Cuddliness Level Slider */}
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Cuddliness Level</label>
            <div className="relative">
                <input
                    type="range"
                    min="1"
                    max="5"
                    className="mt-2 w-full h-2 rounded-2xl"
                    value={editingPet.cuddliness_level ?? 3}
                    onChange={(e) =>
                        setEditingPet({
                            ...editingPet,
                            cuddliness_level: Number(e.target.value),
                        })
                    }
                    onMouseDown={() => {
                        if (editingPet.cuddliness_level === null) setEditingPet({
                            ...editingPet,
                            cuddliness_level: 3,
                        });
                    }}
                    style={{
                        background: editingPet.cuddliness_level
                            ? `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${
                                  (editingPet.cuddliness_level - 1) * 25
                              }%, #D1D5DB ${(editingPet.cuddliness_level - 1) * 25}%, #D1D5DB 100%)`
                            : "#D1D5DB",
                    }}
                />
                <div className="w-full flex justify-between mt-2 text-sm text-gray-500">
                    <span>Cuddler</span>
                    <span>Independent</span>
                </div>
            </div>
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Health Issues</label>
            <TextArea
                placeholder="Health Issues"
                rows={2}
                value={editingPet.health_issues}
                onChange={(e) =>
                    setEditingPet({ ...editingPet, health_issues: e.target.value })
                }
            />
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Sex</label>
            <Select
                className="w-full"
                value={editingPet.sex}
                onChange={(value) =>
                    setEditingPet({ ...editingPet, sex: value })
                }
            >
                <Select.Option value="male">Male</Select.Option>
                <Select.Option value="female">Female</Select.Option>
            </Select>
        </div>
                    <Checkbox
                        className="mb-4"
                        checked={editingPet.vaccinated || false}
                        onChange={(e) =>
                            setEditingPet({
                                ...editingPet,
                                vaccinated: e.target.checked,
                            })
                        }
                    >
                        Vaccinated
                    </Checkbox>
                    <Checkbox
                        className="mb-4"
                        checked={editingPet.neutered || false}
                        onChange={(e) =>
                            setEditingPet({
                                ...editingPet,
                                neutered: e.target.checked,
                            })
                        }
                    >
                        Neutered
                    </Checkbox>
                </Modal>
            )}


        </div>
    );
};

export default MyListingGrid;