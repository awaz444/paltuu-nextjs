"use client";

// Edit a listing: photos, details, compatibility. Used by My Listings and by
// MyListingGrid (rescue and shop panels). Moved out of MyListingGrid and
// restyled to the shared modal (PALTU-141); the save logic is unchanged.

import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "react-hot-toast";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { compressImageFiles } from "@/utils/imageCompression";
import { formatAge } from "@/utils/formatAge";
import { PET_TYPE_OPTIONS } from "@/utils/listingDisplay";
import type { Pet } from "@/components/MyListingGrid";
import { Modal, Field, Segmented, CheckRow, btn, inputClass } from "./ui";

interface ExistingImage {
    image_id: number;
    image_url: string;
    order: number;
}
interface NewFile {
    file: File;
    preview: string;
}

const MAX_PHOTOS = 5;

export default function EditListingModal({
    pet,
    onClose,
    onSaved,
}: {
    /** The listing to edit; null keeps the modal closed. */
    pet: Pet | null;
    onClose: () => void;
    onSaved: (petId: number, patch: Partial<Pet>) => void;
}) {
    const [draft, setDraft] = useState<Pet | null>(pet);
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newFiles, setNewFiles] = useState<NewFile[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDraft(pet);
        setExistingImages([]);
        setNewFiles([]);
        if (!pet) return;
        let cancelled = false;
        setLoadingImages(true);
        fetch(`/api/v1/pets/${pet.pet_id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!cancelled && data?.images) setExistingImages(data.images);
            })
            .catch(() => {})
            .finally(() => !cancelled && setLoadingImages(false));
        return () => {
            cancelled = true;
        };
    }, [pet]);

    const close = () => {
        newFiles.forEach((f) => URL.revokeObjectURL(f.preview));
        onClose();
    };

    if (!pet || !draft) return null;

    const set = (patch: Partial<Pet>) => setDraft((d) => (d ? { ...d, ...patch } : d));
    const photoCount = existingImages.length + newFiles.length;

    const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const room = Math.max(0, MAX_PHOTOS - photoCount);
        setNewFiles((prev) => [...prev, ...files.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
        e.target.value = "";
    };

    const removeNewFile = (index: number) =>
        setNewFiles((prev) => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });

    const save = async () => {
        setSaving(true);
        try {
            let uploadedUrls: string[] = [];
            if (newFiles.length > 0) {
                const compressed = await compressImageFiles(newFiles.map((f) => f.file));
                const formData = new FormData();
                compressed.forEach((f) => formData.append("files", f));
                const uploadRes = await fetch("/api/v1/upload-image", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("Couldn't upload the new photos. Please try again.");
                uploadedUrls = (await uploadRes.json()).urls || [];
            }

            const finalImages = [
                ...existingImages.map((img, i) => ({ image_id: img.image_id, image_url: img.image_url, order: i })),
                ...uploadedUrls.map((url, i) => ({ image_url: url, order: existingImages.length + i })),
            ];

            const res = await fetch(`/api/v1/pets/${draft.pet_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...draft, images: finalImages }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Couldn't save the listing. Please try again.");
            }

            const cover = finalImages[0]?.image_url ?? null;
            onSaved(draft.pet_id, { ...draft, photo_count: finalImages.length, image_url: cover, primary_image: cover });
            toast.success("Listing updated");
            close();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't save the listing. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const level = (key: "energy_level" | "cuddliness_level", label: string, low: string, high: string) => (
        <Field label={label}>
            <input
                type="range"
                min={1}
                max={5}
                value={draft[key] ?? 3}
                onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<Pet>)}
                className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{low}</span>
                <span>{high}</span>
            </div>
        </Field>
    );

    return (
        <Modal
            open
            onClose={close}
            closeDisabled={saving}
            title={`Edit ${pet.pet_name}`}
            subtitle="Changes show on the listing straight away."
            size="lg"
            footer={
                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <button type="button" onClick={close} disabled={saving} className={btn.secondary}>
                        Cancel
                    </button>
                    <button type="button" onClick={save} disabled={saving} className={btn.primary}>
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            }>
            <div className="space-y-5">
                <Field label={`Photos (${photoCount}/${MAX_PHOTOS})`} hint="The first photo is the cover.">
                    {loadingImages ? (
                        <p className="py-2 text-sm text-gray-500">Loading photos…</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {existingImages.map((img) => (
                                <div key={img.image_id} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        aria-label="Remove photo"
                                        onClick={() => setExistingImages((prev) => prev.filter((i) => i.image_id !== img.image_id))}
                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-red-600">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {newFiles.map((f, i) => (
                                <div key={f.preview} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                    <img src={f.preview} alt="" className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        aria-label="Remove photo"
                                        onClick={() => removeNewFile(i)}
                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-red-600">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {photoCount < MAX_PHOTOS && (
                                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-500 transition-colors hover:border-primary hover:text-primary">
                                    <Plus size={18} />
                                    Add
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={addFiles} />
                                </label>
                            )}
                        </div>
                    )}
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Name">
                        <input className={`${inputClass} h-11`} value={draft.pet_name} onChange={(e) => set({ pet_name: e.target.value })} />
                    </Field>
                    <Field label="Type">
                        <select className={`${inputClass} h-11`} value={draft.pet_type} onChange={(e) => set({ pet_type: Number(e.target.value) })}>
                            {PET_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Breed">
                        <input className={`${inputClass} h-11`} value={draft.pet_breed || ""} onChange={(e) => set({ pet_breed: e.target.value })} />
                    </Field>
                    <Field label="Sex">
                        <Segmented
                            label="Sex"
                            value={(draft.sex as "male" | "female") || "male"}
                            onChange={(v) => set({ sex: v })}
                            options={[
                                { value: "male", label: "Male" },
                                { value: "female", label: "Female" },
                            ]}
                        />
                    </Field>
                    <Field label="Age in months" hint={formatAge(draft.age_months)}>
                        <input
                            type="number"
                            min={0}
                            className={`${inputClass} h-11`}
                            value={draft.age_months}
                            onChange={(e) => set({ age_months: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Contact number">
                        <PhoneNumberInput
                            value={draft.contact_number || ""}
                            onChange={(v) => set({ contact_number: v })}
                            className={`${inputClass} flex h-11 items-center`}
                        />
                    </Field>
                </div>

                <Field label={`Description (${(draft.description || "").length}/2500)`}>
                    <textarea
                        rows={4}
                        maxLength={2500}
                        className={`${inputClass} resize-none py-2.5 leading-relaxed`}
                        value={draft.description || ""}
                        onChange={(e) => set({ description: e.target.value })}
                    />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Listing type">
                        <Segmented
                            label="Listing type"
                            value={(draft.listing_type as "adoption" | "foster") || "adoption"}
                            onChange={(v) => set({ listing_type: v })}
                            options={[
                                { value: "adoption", label: "Adoption" },
                                { value: "foster", label: "Foster" },
                            ]}
                        />
                    </Field>
                    <Field label="Adoption fee (Rs)" hint="Leave empty for a free adoption.">
                        <input
                            type="number"
                            min={0}
                            className={`${inputClass} h-11`}
                            value={draft.price ?? ""}
                            onChange={(e) => set({ price: e.target.value })}
                        />
                    </Field>
                    <Field label="Youngest child it's fine with (years)">
                        <input
                            type="number"
                            min={0}
                            className={`${inputClass} h-11`}
                            value={draft.min_age_of_children ?? 0}
                            onChange={(e) => set({ min_age_of_children: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Health notes">
                        <input className={`${inputClass} h-11`} value={draft.health_issues || ""} onChange={(e) => set({ health_issues: e.target.value })} />
                    </Field>
                </div>

                <Field label="Good to know">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <CheckRow label="Good with dogs" checked={!!draft.can_live_with_dogs} onChange={(v) => set({ can_live_with_dogs: v })} />
                        <CheckRow label="Good with cats" checked={!!draft.can_live_with_cats} onChange={(v) => set({ can_live_with_cats: v })} />
                        <CheckRow label="Vaccinated" checked={!!draft.vaccinated} onChange={(v) => set({ vaccinated: v })} />
                        <CheckRow label="Neutered or spayed" checked={!!draft.neutered} onChange={(v) => set({ neutered: v })} />
                        <CheckRow
                            label="Needs someone home"
                            description="Shouldn't be left alone for long"
                            checked={!!draft.must_have_someone_home}
                            onChange={(v) => set({ must_have_someone_home: v })}
                        />
                    </div>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {level("energy_level", "Energy", "Chilled", "Hyper")}
                    {level("cuddliness_level", "Cuddliness", "Cuddler", "Independent")}
                </div>
            </div>
        </Modal>
    );
}
