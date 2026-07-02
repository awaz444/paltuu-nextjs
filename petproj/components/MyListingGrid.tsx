import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store/store";
import { useRouter } from "next/navigation";
import "./petGrid.css";
import Link from "next/link";
import { fetchAdoptionPets } from "@/app/store/slices/adoptionPetsSlice";
import { fetchFosterPets } from "@/app/store/slices/fosterPetsSlice";
import { formatAge } from "@/utils/formatAge";
import { X, Plus } from "lucide-react";

export interface Pet {
    pet_id: number;
    owner_id: number;
    pet_name: string;
    pet_type: number;
    pet_breed: string | null;
    city_id: number;
    area: string;
    age_months: number;
    contact_number: string | null;
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
    city: string;
    profile_image_url: string | null;
    image_id: number | null;
    image_url: string | null;
    primary_image?: string | null;
    approved: boolean | null;
}

interface PetGridProps {
    pets: Pet[];
    showCreateButton?: boolean;
}

const PET_TYPE_OPTIONS = [
    { value: 1, label: "Dog" }, { value: 2, label: "Cat" }, { value: 3, label: "Bird" },
    { value: 4, label: "Fish" }, { value: 5, label: "Rabbit" }, { value: 6, label: "Hamster" },
    { value: 7, label: "Guinea Pig" }, { value: 8, label: "Turtle" }, { value: 11, label: "Horse" }, { value: 15, label: "Mouse" },
];

interface ExistingImage { image_id: number; image_url: string; order: number; }
interface NewFile { file: File; preview: string; }

const MyListingGrid: React.FC<PetGridProps> = ({ pets, showCreateButton = true }) => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editingPet, setEditingPet] = useState<Pet | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [successToast, setSuccessToast] = useState(false);

    // Images
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newFiles, setNewFiles] = useState<NewFile[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);

    // Close modal on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setEditingPet(null); setDeleteConfirm(null); } };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Lock body scroll when modal open
    useEffect(() => {
        document.body.style.overflow = editingPet ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [editingPet]);

    const handleViewApplications = (petId: number) => router.push(`/adoption-applicants?pet_id=${petId}`);

    const handleDelete = async (petId: number) => {
        setDeleteLoading(true);
        try {
            await fetch(`/api/v1/pets/${petId}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
            dispatch(fetchAdoptionPets({}));
            dispatch(fetchFosterPets());
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(null);
        }
    };

    const handleEdit = async (pet: Pet) => {
        setEditingPet(pet);
        setExistingImages([]);
        setNewFiles([]);
        setLoadingImages(true);
        try {
            const res = await fetch(`/api/v1/pets/${pet.pet_id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.images) setExistingImages(data.images);
            }
        } finally {
            setLoadingImages(false);
        }
    };

    const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const canAdd = Math.max(0, 5 - existingImages.length - newFiles.length);
        const toAdd = files.slice(0, canAdd).map((file) => ({ file, preview: URL.createObjectURL(file) }));
        setNewFiles((prev) => [...prev, ...toAdd]);
        e.target.value = "";
    };

    const removeNewFile = (index: number) => {
        setNewFiles((prev) => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleUpdate = async () => {
        if (!editingPet) return;
        setUpdateLoading(true);
        try {
            let uploadedUrls: string[] = [];
            if (newFiles.length > 0) {
                const formData = new FormData();
                newFiles.forEach((f) => formData.append("files", f.file));
                const uploadRes = await fetch("/api/v1/upload-image", { method: "POST", body: formData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedUrls = uploadData.urls || [];
                }
            }

            const finalImages = [
                ...existingImages.map((img, i) => ({ image_id: img.image_id, image_url: img.image_url, order: i })),
                ...uploadedUrls.map((url, i) => ({ image_url: url, order: existingImages.length + i })),
            ];

            const res = await fetch(`/api/v1/pets/${editingPet.pet_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...editingPet, images: finalImages }),
            });

            if (res.ok) {
                setSuccessToast(true);
                setTimeout(() => setSuccessToast(false), 3000);
                dispatch(fetchAdoptionPets({}));
                dispatch(fetchFosterPets());
            }

            setEditingPet(null);
            setNewFiles([]);
            setExistingImages([]);
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingPet(null);
        newFiles.forEach((f) => URL.revokeObjectURL(f.preview));
        setNewFiles([]);
        setExistingImages([]);
    };

    const field = (label: string, children: React.ReactNode) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
        </div>
    );

    const inputClass = "p-3 w-full border rounded-2xl focus:outline-none focus:border-primary transition-colors";
    const checkboxRow = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
        <label className="flex items-center gap-3 cursor-pointer py-1">
            <input type="checkbox" className="w-4 h-4 accent-primary rounded" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {showCreateButton && (
                <Link
                    href="/create-listing"
                    className="bg-white text-primary p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-[1.02] transition-all duration-300 min-h-[260px]"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center mb-3">
                        <Plus size={22} className="text-primary" />
                    </div>
                    <span className="text-sm font-medium">Create new listing</span>
                </Link>
            )}

            {pets.map((pet) => (
                <div
                    key={pet.pet_id}
                    className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-[#a03048] hover:scale-[1.02] transition-all duration-300 relative"
                >
                    <div className="relative">
                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex gap-2 z-10">
                            <button
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition"
                                onClick={() => setDeleteConfirm(pet.pet_id)}
                            >
                                <img src="/trash.svg" alt="Delete" className="w-4 h-4" />
                            </button>
                            <button
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition"
                                onClick={() => handleEdit(pet)}
                            >
                                <img src="/pen.svg" alt="Edit" className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Status badge */}
                        <div className="absolute top-2 left-2 z-10">
                            <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${pet.approved ? "bg-green-600" : "bg-orange-500"}`}>
                                {pet.approved ? "Approved" : "Pending"}
                            </span>
                        </div>
                        <img
                            src={pet.primary_image || (pet as any).primaryImage || pet.image_url || "/dog-placeholder.png"}
                            alt={pet.pet_name}
                            className="w-full aspect-square object-cover rounded-2xl block"
                        />
                    </div>
                    <div className="pt-4 pl-2">
                        <h3 className="font-bold text-xl mb-1">{pet.pet_name}</h3>
                        <p className="text-gray-500 text-sm mb-0.5">{formatAge(pet.age_months)}</p>
                        <p className="text-gray-500 text-sm">{pet.city} — {pet.area}</p>
                    </div>
                </div>
            ))}

            {/* Delete confirm modal */}
            {deleteConfirm !== null && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this listing?</h3>
                        <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-medium hover:border-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={deleteLoading}
                                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
                            >
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editingPet && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleCancelEdit}>
                    <div
                        className="bg-white rounded-3xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                            <h2 className="text-lg font-bold text-gray-900">Edit Listing</h2>
                            <button onClick={handleCancelEdit} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                <X size={16} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Photos */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                                {loadingImages ? (
                                    <p className="text-gray-400 text-sm py-2">Loading photos...</p>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Existing images */}
                                        {existingImages.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {existingImages.map((img) => (
                                                    <div key={img.image_id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100">
                                                        <img src={img.image_url} alt="Pet" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setExistingImages((prev) => prev.filter((i) => i.image_id !== img.image_id))}
                                                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* New file previews */}
                                        {newFiles.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {newFiles.map((f, i) => (
                                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100">
                                                        <img src={f.preview} alt="New" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNewFile(i)}
                                                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Upload button */}
                                        {existingImages.length + newFiles.length < 5 && (
                                            <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-primary transition-colors text-sm text-gray-500">
                                                <Plus size={16} /> Add Photos
                                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleNewFileChange} />
                                            </label>
                                        )}
                                        <p className="text-xs text-gray-400">Maximum 5 photos total</p>
                                    </div>
                                )}
                            </div>

                            {field("Pet Name",
                                <input type="text" className={inputClass} value={editingPet.pet_name}
                                    onChange={(e) => setEditingPet({ ...editingPet, pet_name: e.target.value })} />
                            )}

                            {field("Pet Type",
                                <select className={inputClass} value={editingPet.pet_type}
                                    onChange={(e) => setEditingPet({ ...editingPet, pet_type: Number(e.target.value) })}>
                                    {PET_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            )}

                            {field("Pet Breed",
                                <input type="text" className={inputClass} placeholder="Breed" value={editingPet.pet_breed || ""}
                                    onChange={(e) => setEditingPet({ ...editingPet, pet_breed: e.target.value })} />
                            )}

                            {field("Age (months)",
                                <>
                                    <input type="number" className={inputClass} value={editingPet.age_months}
                                        onChange={(e) => setEditingPet({ ...editingPet, age_months: Number(e.target.value) })} />
                                    <p className="text-xs text-gray-400 mt-1">Current: {formatAge(editingPet.age_months)}</p>
                                </>
                            )}

                            {field("Contact Number",
                                <input type="text" className={inputClass} placeholder="+923..." value={editingPet.contact_number || ""}
                                    onChange={(e) => setEditingPet({ ...editingPet, contact_number: e.target.value })} />
                            )}

                            {field("Description",
                                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Description" value={editingPet.description}
                                    onChange={(e) => setEditingPet({ ...editingPet, description: e.target.value })} />
                            )}

                            {/* Listing type toggle */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type</label>
                                <div className="flex gap-2">
                                    {["adoption", "foster"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setEditingPet({ ...editingPet, listing_type: type })}
                                            className={`flex-1 py-2.5 rounded-2xl text-sm font-medium capitalize transition-colors ${editingPet.listing_type === type ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {field("Price",
                                <input type="number" className={inputClass} placeholder="Price" value={editingPet.price}
                                    onChange={(e) => setEditingPet({ ...editingPet, price: e.target.value })} />
                            )}

                            {field("Minimum Age of Children",
                                <input type="number" className={inputClass} value={editingPet.min_age_of_children}
                                    onChange={(e) => setEditingPet({ ...editingPet, min_age_of_children: Number(e.target.value) })} />
                            )}

                            {/* Checkboxes */}
                            <div className="mb-4 space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Living Compatibility</label>
                                {checkboxRow("Can live with dogs", editingPet.can_live_with_dogs, (v) => setEditingPet({ ...editingPet, can_live_with_dogs: v }))}
                                {checkboxRow("Can live with cats", editingPet.can_live_with_cats, (v) => setEditingPet({ ...editingPet, can_live_with_cats: v }))}
                                {checkboxRow("Must have someone home", editingPet.must_have_someone_home, (v) => setEditingPet({ ...editingPet, must_have_someone_home: v }))}
                                {checkboxRow("Vaccinated", editingPet.vaccinated || false, (v) => setEditingPet({ ...editingPet, vaccinated: v }))}
                                {checkboxRow("Neutered", editingPet.neutered || false, (v) => setEditingPet({ ...editingPet, neutered: v }))}
                            </div>

                            {/* Energy level */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
                                <input type="range" min="1" max="5" className="w-full" value={editingPet.energy_level ?? 3}
                                    onChange={(e) => setEditingPet({ ...editingPet, energy_level: Number(e.target.value) })}
                                    style={{ background: `linear-gradient(to right, #a03048 0%, #a03048 ${(editingPet.energy_level - 1) * 25}%, #D1D5DB ${(editingPet.energy_level - 1) * 25}%, #D1D5DB 100%)` }}
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Chilled</span><span>Hyper</span></div>
                            </div>

                            {/* Cuddliness level */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cuddliness Level</label>
                                <input type="range" min="1" max="5" className="w-full" value={editingPet.cuddliness_level ?? 3}
                                    onChange={(e) => setEditingPet({ ...editingPet, cuddliness_level: Number(e.target.value) })}
                                    style={{ background: `linear-gradient(to right, #a03048 0%, #a03048 ${(editingPet.cuddliness_level - 1) * 25}%, #D1D5DB ${(editingPet.cuddliness_level - 1) * 25}%, #D1D5DB 100%)` }}
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Cuddler</span><span>Independent</span></div>
                            </div>

                            {field("Health Issues",
                                <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Any health issues" value={editingPet.health_issues}
                                    onChange={(e) => setEditingPet({ ...editingPet, health_issues: e.target.value })} />
                            )}

                            {field("Sex",
                                <select className={inputClass} value={editingPet.sex || ""}
                                    onChange={(e) => setEditingPet({ ...editingPet, sex: e.target.value })}>
                                    <option value="">Select sex</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                                <button onClick={handleCancelEdit} className="flex-1 py-3 border-2 border-primary text-primary rounded-2xl font-medium hover:bg-primary hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={updateLoading}
                                    className="flex-1 py-3 bg-primary text-white rounded-2xl font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                                >
                                    {updateLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success toast */}
            {successToast && (
                <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white bg-green-500">
                    Listing updated successfully!
                </div>
            )}
        </div>
    );
};

export default MyListingGrid;
