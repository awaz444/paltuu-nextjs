import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store/store";
import { useRouter } from "next/navigation";
import "./petGrid.css";
import Link from "next/link";
import { fetchAdoptionPets } from "@/app/store/slices/adoptionPetsSlice";
import { fetchFosterPets } from "@/app/store/slices/fosterPetsSlice";
import { formatAge } from "@/utils/formatAge";
import { X, Plus, Users, Pencil, MoreHorizontal, Camera, MapPin } from "lucide-react";
import {
    PET_TYPE_OPTIONS,
    getListingStatus,
    LISTING_STATUS_META,
    listingKindLabel,
    formatFee,
    formatShortDate,
    getInitials,
    AVATAR_TONES,
} from "@/utils/listingDisplay";
import PhoneNumberInput from "./PhoneNumberInput";
import { compressImageFiles } from "@/utils/imageCompression";
import { toast } from "react-hot-toast";

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
    bumped_at?: string | null;
    availability_check_sent_at?: string | null;
    // Owner-dashboard extras from /api/v1/profile/listings (absent on other feeds).
    photo_count?: number;
    application_count?: number;
    pending_application_count?: number;
    recent_applicant_names?: string[] | null;
}

interface PetGridProps {
    pets: Pet[];
    showCreateButton?: boolean;
    onPetDeleted?: (petId: number) => void;
    /** When set, the parent owns listing state and receives every change made from a card. */
    onPetUpdated?: (petId: number, patch: Partial<Pet>) => void;
    /** Show the "still available?" check-in inside each card (My Listings shows it in its own queue instead). */
    inlineCheckIn?: boolean;
}

const STEP_NAMES = ["Submitted for review", "Live on Paltuu", "Reviewing applicants", "Adopted"];

/** Calls the availability endpoint; returns the updated pet fields or throws with a user-facing message. */
export async function setListingAvailability(petId: number, available: boolean): Promise<Partial<Pet>> {
    const res = await fetch(`/api/v1/pets/${petId}/availability`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Couldn't update the listing. Please try again.");
    return data;
}

interface ExistingImage { image_id: number; image_url: string; order: number; }
interface NewFile { file: File; preview: string; }

const MyListingGrid: React.FC<PetGridProps> = ({ pets, showCreateButton = true, onPetDeleted, onPetUpdated, inlineCheckIn = true }) => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editingPet, setEditingPet] = useState<Pet | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [successToast, setSuccessToast] = useState(false);

    // "Still available?" check-in (PALTU-102). Local overrides so a card updates
    // immediately without the parent refetching the whole list.
    const [statusOverrides, setStatusOverrides] = useState<Record<number, Partial<Pet>>>({});
    const [availabilityLoading, setAvailabilityLoading] = useState<number | null>(null);
    // Per-card "more actions" menu; closes on any click outside a menu.
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    useEffect(() => {
        if (openMenu === null) return;
        const close = (e: MouseEvent) => {
            if (!(e.target as Element | null)?.closest?.("[data-listing-menu]")) setOpenMenu(null);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [openMenu]);

    // Images
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newFiles, setNewFiles] = useState<NewFile[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);

    // Close modal on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setEditingPet(null); setDeleteConfirm(null); setOpenMenu(null); } };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Lock body scroll when modal open
    useEffect(() => {
        document.body.style.overflow = editingPet ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [editingPet]);

    const handleViewApplications = (pet: Pet) =>
        router.push(
            pet.listing_type === "foster"
                ? `/foster-applicants?pet_id=${pet.pet_id}`
                : `/adoption-applicants?pet_id=${pet.pet_id}`
        );

    const handleDelete = async (petId: number) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/v1/pets/${petId}`, {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                toast.success("Listing deleted successfully");
                onPetDeleted?.(petId);
                dispatch(fetchAdoptionPets({}));
                dispatch(fetchFosterPets());
            } else {
                const data = await res.json().catch(() => null);
                const errMsg = data?.error || data?.message || "Failed to delete listing";
                toast.error(errMsg);
            }
        } catch (err: any) {
            toast.error(err?.message || "Network error. Failed to delete listing.");
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(null);
        }
    };

    const handleAvailability = async (pet: Pet, available: boolean) => {
        setAvailabilityLoading(pet.pet_id);
        setOpenMenu(null);
        try {
            const data = await setListingAvailability(pet.pet_id, available);
            if (onPetUpdated) onPetUpdated(pet.pet_id, data);
            else setStatusOverrides((prev) => ({ ...prev, [pet.pet_id]: data }));
            toast.success(available ? `${pet.pet_name} is back at the top of the adoption page` : `Marked ${pet.pet_name} as adopted 🎉`);
            dispatch(fetchAdoptionPets({}));
        } catch (err: any) {
            toast.error(err?.message || "Network error. Please try again.");
        } finally {
            setAvailabilityLoading(null);
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
                const raw = newFiles.map((f) => f.file).filter(Boolean);
                const compressed = await compressImageFiles(raw);
                const formData = new FormData();
                compressed.forEach((f) => formData.append("files", f));
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
                const cover = finalImages[0]?.image_url ?? null;
                onPetUpdated?.(editingPet.pet_id, {
                    ...editingPet,
                    photo_count: finalImages.length,
                    image_url: cover,
                    primary_image: cover,
                });
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

    const menuItemClass = "w-full text-left min-h-[40px] px-3 rounded-lg text-[13px] font-medium text-[#18181B] hover:bg-[#F5F4F1] transition-colors flex items-center";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {showCreateButton && (
                <Link
                    href="/create-listing"
                    className="bg-white border border-dashed border-[#D9D6D0] rounded-[18px] min-h-[260px] flex flex-col items-center justify-center gap-3 text-[#18181B] hover:border-[#A1A1AA] transition-colors"
                >
                    <span className="w-12 h-12 rounded-full border border-[#E6E4DF] flex items-center justify-center">
                        <Plus size={20} />
                    </span>
                    <span className="text-sm font-semibold">Create new listing</span>
                </Link>
            )}

            {pets.map((basePet) => {
                const pet = { ...basePet, ...statusOverrides[basePet.pet_id] } as Pet;
                const status = getListingStatus(pet);
                const isPaused = status === "paused";
                const needsCheckIn = inlineCheckIn && pet.approved && (isPaused || (pet.adoption_status === "available" && !!pet.availability_check_sent_at));
                const statusLabel = pet.adoption_status === "fostered" ? "Fostered" : LISTING_STATUS_META[status].label;
                const appCount = pet.application_count;
                const hasCounts = typeof appCount === "number";
                const pendingCount = pet.pending_application_count ?? 0;
                const applicantNames = (pet.recent_applicant_names ?? []).filter(Boolean).slice(0, 3);
                const showProgress = pet.listing_type === "adoption" || pet.listing_type === "foster";
                const step = status === "review" ? 1 : status === "adopted" ? 4 : (appCount ?? 0) > 0 ? 3 : 2;
                const stepLabel = isPaused
                    ? "Paused"
                    : step === 4 && pet.listing_type === "foster" ? "Fostered" : STEP_NAMES[step - 1];
                const traits = [
                    pet.vaccinated && "Vaccinated",
                    pet.neutered && "Neutered",
                    pet.min_age_of_children > 0 && `Kids ${pet.min_age_of_children}+`,
                    pet.can_live_with_dogs && "Good with dogs",
                    pet.can_live_with_cats && "Good with cats",
                ].filter(Boolean) as string[];
                const metaLine = [
                    pet.pet_breed,
                    pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : null,
                    formatAge(pet.age_months),
                ].filter(Boolean).join(" · ");
                const place = [pet.city, pet.area].filter(Boolean).join(", ");
                const canMarkAdopted = !!pet.approved && (status === "live" || status === "paused");
                const busy = availabilityLoading === pet.pet_id;

                return (
                <article
                    key={pet.pet_id}
                    className="relative bg-white border border-[#E6E4DF] rounded-[18px] flex flex-col hover:border-[#CFCBC4] transition-colors"
                >
                    {/* Photo */}
                    <div className="relative m-2 mb-0 aspect-[4/3] rounded-xl overflow-hidden bg-[#ECE8E1]">
                        <img
                            src={pet.primary_image || (pet as any).primaryImage || pet.image_url || "/dog-placeholder.png"}
                            alt={pet.pet_name}
                            className={`w-full h-full object-cover block ${status === "adopted" ? "grayscale opacity-80" : ""}`}
                        />
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white rounded-full pl-2.5 pr-3 py-1.5 text-xs font-semibold text-[#18181B]">
                            <span className="w-[7px] h-[7px] rounded-full" style={{ background: LISTING_STATUS_META[status].dot }} />
                            {statusLabel}
                        </span>
                        {(pet.photo_count ?? 0) > 1 && (
                            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 bg-[#18181B] text-white rounded-lg px-2 py-1 text-xs font-semibold tabular-nums">
                                <Camera size={13} aria-hidden="true" />
                                {pet.photo_count}
                                <span className="sr-only">photos</span>
                            </span>
                        )}
                    </div>

                    {/* Details */}
                    <div className="px-5 pt-[18px] flex flex-col gap-1.5">
                        <div className="flex justify-between gap-3">
                            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B6B73]">
                                {listingKindLabel(pet.listing_type, pet.pet_type)}
                            </span>
                            {pet.created_at && (
                                <span className="text-xs text-[#6B6B73] whitespace-nowrap">Listed {formatShortDate(pet.created_at)}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-baseline gap-3">
                            <h3 className="text-[22px] font-semibold tracking-tight text-[#18181B] truncate">{pet.pet_name}</h3>
                            <span className="text-sm font-semibold text-[#18181B] whitespace-nowrap">{formatFee(pet.price)}</span>
                        </div>
                        {metaLine && <p className="text-sm text-[#3F3F46]">{metaLine}</p>}
                        {place && (
                            <p className="text-[13px] text-[#6B6B73] flex items-center gap-1.5">
                                <MapPin size={14} aria-hidden="true" className="shrink-0" />
                                <span className="truncate">{place}</span>
                            </p>
                        )}
                        {traits.length > 0 && (
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                                {traits.map((t) => (
                                    <li key={t} className="text-xs font-medium text-[#3F3F46] border border-[#E6E4DF] rounded-full px-2.5 py-1">{t}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Lifecycle progress */}
                    {showProgress && (
                        <div className="px-5 pt-[18px] pb-4 flex flex-col gap-2">
                            <div className="flex justify-between text-xs">
                                <span className="font-semibold text-[#18181B]">{stepLabel}</span>
                                <span className="text-[#6B6B73] tabular-nums">Step {step} of 4</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1" aria-hidden="true">
                                {[1, 2, 3, 4].map((n) => (
                                    <span
                                        key={n}
                                        className={`h-1 rounded-sm ${
                                            isPaused
                                                ? n <= step ? "bg-[#A1A1AA]" : "bg-[#E6E4DF]"
                                                : n < step || (n === step && status === "adopted")
                                                    ? "bg-[#18181B]"
                                                    : n === step ? "bg-primary" : "bg-[#E6E4DF]"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {!showProgress && <div className="pb-4" />}

                    {/* Still-available check-in (PALTU-102) */}
                    {needsCheckIn && (
                        <div className="mx-5 mb-4 p-4 border border-[#E6E4DF] rounded-xl bg-[#FAFAF8] flex flex-col gap-3">
                            <div>
                                <p className="text-sm font-semibold text-[#18181B]">
                                    {isPaused ? `${pet.pet_name} is paused` : `Is ${pet.pet_name} still looking for a home?`}
                                </p>
                                <p className="text-[13px] leading-relaxed text-[#52525B] mt-1">
                                    {isPaused
                                        ? "Hidden from the adoption page until you relist."
                                        : "Confirming keeps the listing near the top of the adoption page."}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAvailability(pet, true)}
                                    disabled={busy}
                                    className="flex-1 min-h-[44px] bg-primary text-white text-[13px] rounded-[10px] font-semibold disabled:opacity-60"
                                >
                                    {isPaused ? "Relist" : "Yes, keep listed"}
                                </button>
                                <button
                                    onClick={() => handleAvailability(pet, false)}
                                    disabled={busy}
                                    className="flex-1 min-h-[44px] bg-white border border-[#D9D6D0] text-[#18181B] text-[13px] rounded-[10px] font-semibold hover:border-[#A1A1AA] transition-colors disabled:opacity-60"
                                >
                                    Mark adopted
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer: applications + actions */}
                    <div className="mt-auto border-t border-[#EEECE8] flex items-center gap-1 p-1.5">
                        <button
                            type="button"
                            onClick={() => handleViewApplications(pet)}
                            className="flex-1 min-w-0 min-h-[46px] px-2.5 rounded-[10px] flex items-center gap-2.5 text-left text-sm font-semibold text-[#18181B] hover:bg-[#F2F1EE] transition-colors"
                        >
                            {!hasCounts ? (
                                <>
                                    <Users size={18} aria-hidden="true" />
                                    View applications
                                </>
                            ) : appCount! > 0 ? (
                                <>
                                    {applicantNames.length > 0 && (
                                        <span className="flex shrink-0" aria-hidden="true">
                                            {applicantNames.map((n, i) => (
                                                <span
                                                    key={i}
                                                    className={`w-7 h-7 rounded-full border-2 border-white text-[10px] font-bold text-[#3F3F46] flex items-center justify-center ${i > 0 ? "-ml-2" : ""}`}
                                                    style={{ background: AVATAR_TONES[i % AVATAR_TONES.length] }}
                                                >
                                                    {getInitials(n)}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                    <span className="whitespace-nowrap">
                                        {appCount} {appCount === 1 ? "application" : "applications"}
                                    </span>
                                    {pendingCount > 0 && status !== "adopted" && (
                                        <span className="text-xs font-semibold text-primary whitespace-nowrap">{pendingCount} new</span>
                                    )}
                                </>
                            ) : (
                                <span className="text-[13px] font-normal text-[#6B6B73]">
                                    {status === "review" ? "Applications open once approved" : "No applications yet"}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            aria-label={`Edit ${pet.pet_name}`}
                            onClick={() => handleEdit(pet)}
                            className="w-11 h-11 shrink-0 rounded-[10px] flex items-center justify-center text-[#3F3F46] hover:bg-[#F2F1EE] transition-colors"
                        >
                            <Pencil size={17} aria-hidden="true" />
                        </button>
                        <div data-listing-menu className="relative shrink-0">
                            <button
                                type="button"
                                aria-label={`More actions for ${pet.pet_name}`}
                                aria-haspopup="menu"
                                aria-expanded={openMenu === pet.pet_id}
                                onClick={() => setOpenMenu(openMenu === pet.pet_id ? null : pet.pet_id)}
                                className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[#3F3F46] hover:bg-[#F2F1EE] transition-colors"
                            >
                                <MoreHorizontal size={18} aria-hidden="true" />
                            </button>
                            {openMenu === pet.pet_id && (
                                <div role="menu" className="absolute right-0 bottom-[52px] z-20 w-[210px] bg-white border border-[#E2E0DB] rounded-xl p-1.5 flex flex-col">
                                    {canMarkAdopted && (
                                        <button type="button" role="menuitem" disabled={busy} onClick={() => handleAvailability(pet, false)} className={menuItemClass}>
                                            Mark as adopted
                                        </button>
                                    )}
                                    {status === "live" && (
                                        <Link role="menuitem" href={`/browse-pets/${pet.pet_id}`} className={menuItemClass} onClick={() => setOpenMenu(null)}>
                                            View public page
                                        </Link>
                                    )}
                                    {(canMarkAdopted || status === "live") && <div className="h-px bg-[#EEECE8] my-1" />}
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => { setOpenMenu(null); setDeleteConfirm(pet.pet_id); }}
                                        className={`${menuItemClass} !text-[#B91C1C] !font-semibold`}
                                    >
                                        Delete listing
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </article>
                );
            })}

            {/* Delete confirm modal */}
            {deleteConfirm !== null && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div role="dialog" aria-modal="true" aria-labelledby="delete-listing-title" className="bg-white border border-[#E6E4DF] rounded-2xl p-7 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h3 id="delete-listing-title" className="text-lg font-semibold text-[#18181B] mb-2">Delete this listing?</h3>
                        <p className="text-[#52525B] text-sm mb-6">The listing and all its applications are removed. This can&apos;t be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 min-h-[46px] border border-[#D9D6D0] text-[#18181B] rounded-xl font-semibold text-sm hover:border-[#A1A1AA] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={deleteLoading}
                                className="flex-1 min-h-[46px] bg-[#B91C1C] text-white rounded-xl font-semibold text-sm hover:bg-[#991B1B] transition-colors disabled:opacity-60"
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
                                <PhoneNumberInput
                                    value={editingPet.contact_number || ""}
                                    onChange={(v) => setEditingPet({ ...editingPet, contact_number: v })}
                                    className={inputClass}
                                />
                            )}

                            {field(`Description (${(editingPet.description || '').length}/2500)`,
                                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Description" maxLength={2500} value={editingPet.description}
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
