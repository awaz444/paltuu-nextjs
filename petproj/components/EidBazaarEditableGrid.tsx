import React, { useState } from "react";
import { Modal, Input, Select, Checkbox, Button } from "antd";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store/store";
import { EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
// import "./qurbaniGrid.css";

const { TextArea } = Input;

export interface QurbaniAnimal {
    id: string;
    species: "Goat" | "Cow" | "Bull" | "Sheep" | "Camel";
    breed: string;
    age: number;
    weight: number;
    teethCount?: number;
    hornCondition?: "Good" | "Damaged" | "Broken" | "None";
    isVaccinated: boolean;
    description?: string;
    price: number | null;
    status: "Available" | "Sold" | "Reserved";
    location: string;
    city: string;
    sellerName: string;
    sellerContact: string;
    sellerProfileImage?: string;
    images: string[];
    approved?: boolean;
}

interface QurbaniGridProps {
    animals: QurbaniAnimal[];
}

const QurbaniGrid: React.FC<QurbaniGridProps> = ({ animals }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [showConfirm, setShowConfirm] = useState<{
        id: string | null;
        show: boolean;
    }>({ id: null, show: false });
    const [loading, setLoading] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<QurbaniAnimal | null>(
        null
    );
    const [successMessage, setSuccessMessage] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    const handleDelete = async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/qurbani-animals/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Delete failed:", errorData);
                // You might want to show an error message to the user here
            } else {
                console.log("Delete successful");
                // Here you should update your local state or refetch the data
                // For example, if using Redux:
                // dispatch(removeAnimal(id));
                // Or if you want to refetch:
                // dispatch(fetchAnimals());
            }
        } catch (error) {
            console.error("Network error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmation = (id: string) => {
        setShowConfirm({ id, show: true });
    };

    const confirmDelete = async (id: string) => {
        setLoading(true);
        await handleDelete(id);
        setShowConfirm({ id: null, show: false });
    };

    const cancelDelete = () => {
        setShowConfirm({ id: null, show: false });
    };

    const handleEdit = (animal: QurbaniAnimal) => {
        setEditingAnimal(animal);
    };

    const handleUpdate = async () => {
        if (!editingAnimal) return;

        try {
            const { id, ...updateData } = editingAnimal;
            const response = await fetch(`/api/qurbani-animals/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                console.error("Update failed:", await response.json());
            } else {
                console.log("Update successful");
                setSuccessMessage(true);
                setTimeout(() => setSuccessMessage(false), 3000);
                // Here you should update your local state or refetch the data
                // For example, if using Redux:
                // dispatch(updateAnimal(await response.json()));
                // Or if you want to refetch:
                // dispatch(fetchAnimals());
            }
        } catch (error) {
            console.error("Network error:", error);
        } finally {
            setEditingAnimal(null);
        }
    };

    const handleCancel = () => {
        setEditingAnimal(null);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {animals.map((animal) => (
                <div
                    key={animal.id}
                    className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 relative">
                    <div className="relative">
                        <div className="absolute top-2 right-2 flex gap-2">
                            {/* Delete Button */}
                            <button
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-200 transition"
                                onClick={() => handleConfirmation(animal.id)}>
                                <img
                                    src="/trash.svg"
                                    alt="Delete"
                                    className="w-4 h-4"
                                />
                            </button>
                            {/* Edit Button */}
                            <button
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-200 transition"
                                onClick={() => handleEdit(animal)}>
                                <img
                                    src="/pen.svg"
                                    alt="Edit"
                                    className="w-4 h-4"
                                />
                            </button>
                        </div>

                        {/* Approval Status */}
                        {animal.approved !== undefined && (
                            <div className="absolute top-2 left-2 flex gap-2">
                                <div
                                    className={`${
                                        animal.approved
                                            ? "bg-green-600"
                                            : "bg-orange-500"
                                    } text-white text-sm font-semibold px-3 py-1 rounded-full`}>
                                    {animal.approved ? "Approved" : "Pending"}
                                </div>
                            </div>
                        )}

                        <img
                            src={animal.images[0] || "/animal-placeholder.png"}
                            alt={animal.breed}
                            className="w-full h-48 object-cover rounded-2xl"
                        />

                        {animal.price !== null && (
                            <div className="absolute bottom-2 right-2 bg-primary text-white text-sm font-semibold px-3 py-1 rounded-full">
                                PKR {animal.price.toLocaleString()}
                            </div>
                        )}
                    </div>

                    <div className="p-4">
                        <h3 className="font-bold text-2xl mb-1">
                            {animal.breed}
                        </h3>
                        <p className="text-gray-600 mb-1">
                            {animal.age} years • {animal.weight} kg
                        </p>
                        <p className="text-gray-600 mb-1">
                            {animal.city} - {animal.location}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {animal.isVaccinated && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    Vaccinated
                                </span>
                            )}
                            {animal.teethCount && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {animal.teethCount} teeth
                                </span>
                            )}
                            {animal.hornCondition && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                    Horns: {animal.hornCondition}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Confirmation Popup */}
            {showConfirm.show && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-3xl shadow-lg max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">
                            Are you sure you want to delete this animal?
                        </h3>
                        <div className="flex justify-between">
                            <button
                                className="bg-primary text-white px-4 py-2 rounded-xl"
                                onClick={() => confirmDelete(showConfirm.id!)}
                                disabled={loading}>
                                {loading ? "Deleting..." : "Confirm"}
                            </button>
                            <button
                                className="bg-white text-primary border border-primary px-4 py-2 rounded-xl"
                                onClick={cancelDelete}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Form Popup */}
            {editingAnimal && (
                <Modal
                    title="Edit Animal Listing"
                    open={!!editingAnimal}
                    onCancel={handleCancel}
                    footer={null}
                    className="rounded-2xl"
                    width={800}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Breed
                                </label>
                                <Input
                                    value={editingAnimal.breed}
                                    onChange={(e) =>
                                        setEditingAnimal({
                                            ...editingAnimal,
                                            breed: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Species
                                </label>
                                <Select
                                    className="w-full"
                                    value={editingAnimal.species}
                                    onChange={(value) =>
                                        setEditingAnimal({
                                            ...editingAnimal,
                                            species: value as any,
                                        })
                                    }>
                                    <Select.Option value="Goat">
                                        Goat
                                    </Select.Option>
                                    <Select.Option value="Cow">
                                        Cow
                                    </Select.Option>
                                    <Select.Option value="Bull">
                                        Bull
                                    </Select.Option>
                                    <Select.Option value="Sheep">
                                        Sheep
                                    </Select.Option>
                                    <Select.Option value="Camel">
                                        Camel
                                    </Select.Option>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Age (years)
                                </label>
                                <Input
                                    type="number"
                                    value={editingAnimal.age}
                                    onChange={(e) =>
                                        setEditingAnimal({
                                            ...editingAnimal,
                                            age: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Weight (kg)
                                </label>
                                <Input
                                    type="number"
                                    value={editingAnimal.weight}
                                    onChange={(e) =>
                                        setEditingAnimal({
                                            ...editingAnimal,
                                            weight: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Teeth Count
                                </label>
                                <Input
                                    type="number"
                                    value={editingAnimal.teethCount}
                                    onChange={(e) =>
                                        setEditingAnimal({
                                            ...editingAnimal,
                                            teethCount: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Horn Condition
                            </label>
                            <Select
                                className="w-full"
                                value={editingAnimal.hornCondition}
                                onChange={(value) =>
                                    setEditingAnimal({
                                        ...editingAnimal,
                                        hornCondition: value as any,
                                    })
                                }>
                                <Select.Option value="Good">Good</Select.Option>
                                <Select.Option value="Damaged">
                                    Damaged
                                </Select.Option>
                                <Select.Option value="Broken">
                                    Broken
                                </Select.Option>
                                <Select.Option value="None">None</Select.Option>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Vaccination Status
                            </label>
                            <Checkbox
                                checked={editingAnimal.isVaccinated}
                                onChange={(e) =>
                                    setEditingAnimal({
                                        ...editingAnimal,
                                        isVaccinated: e.target.checked,
                                    })
                                }>
                                Vaccinated
                            </Checkbox>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Price (PKR)
                            </label>
                            <Input
                                type="number"
                                value={editingAnimal.price || undefined}
                                onChange={(e) =>
                                    setEditingAnimal({
                                        ...editingAnimal,
                                        price: e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <TextArea
                                rows={4}
                                value={editingAnimal.description}
                                onChange={(e) =>
                                    setEditingAnimal({
                                        ...editingAnimal,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    City
                                </label>
                                <Input
                                    value={editingAnimal.city}
                                    onChange={(e) =>
                                        setEditingAnimal({
                                            ...editingAnimal,
                                            city: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Location
                                </label>
                                <Input
                                    value={editingAnimal.location}
                                    onChange={(e) =>
                                        setEditingAnimal({
                                            ...editingAnimal,
                                            location: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={handleCancel}
                                className="px-5 py-2 text-primary rounded-3xl font-semibold border border-primary bg-white transition-colors duration-200">
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-5 py-2 bg-primary text-white rounded-3xl font-semibold border border-primary transition-colors duration-200">
                                Update
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default QurbaniGrid;
