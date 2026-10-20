"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { resizeForUpload } from "@/lib/personaStudio/resizeImage";

type TimeOfDay = "any" | "morning" | "afternoon" | "evening" | "night";

interface StudioPersona {
    persona_id: string;
    name: string;
    city: string | null;
    avatar_url: string | null;
    gender: "male" | "female";
    needs_avatar: boolean;
    avatar_reason: string | null;
}
interface StudioPet {
    persona_id: string;
    persona_name: string;
    pet_slug: string;
    name: string;
    species: string;
    breed: string | null;
    avatar_url: string | null;
    total: number;
    described: number;
    available: number;
}
interface Photo {
    id: string;
    persona_id: string;
    persona_name: string;
    pet_slug: string | null;
    pet_name: string | null;
    url: string;
    note: string | null;
    time_of_day: TimeOfDay;
    use_count: number;
    last_used_at: string | null;
}

const API = "/api/v1/admin/persona-studio";
/** A pet can start posting once it has this many described photos. */
const READY_TARGET = 5;
const NOTE_MAX = 280;

/** Tap to add. Most photos are one of these plus a few words. */
const QUICK_PHRASES = [
    "asleep", "curled up", "stretched out", "on the sofa", "on the bed", "in a box", "at the window",
    "in the sun", "eating", "drinking water", "playing with a toy", "looking at the camera",
    "grooming", "on a walk", "at the vet", "outdoors",
];
const TIMES: Array<{ value: TimeOfDay; label: string }> = [
    { value: "any", label: "Any time" },
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
    { value: "night", label: "Night" },
];

const isDescribed = (p: Photo) => (p.note ?? "").trim().length > 0;
const initials = (name: string) => name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

function timeAgo(iso: string | null) {
    if (!iso) return "never";
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

async function readError(res: Response, fallback: string) {
    try {
        return (await res.json()).error ?? fallback;
    } catch {
        return fallback;
    }
}

export default function PersonaStudioPage() {
    const { user, isHydrating } = useAuth();
    const router = useRouter();

    const [personas, setPersonas] = useState<StudioPersona[] | null>(null);
    const [pets, setPets] = useState<StudioPet[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [section, setSection] = useState<"pets" | "profiles">("pets");
    const [selected, setSelected] = useState("all"); // "personaId/petSlug"
    const [onlyTodo, setOnlyTodo] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
    }, [user, isHydrating, router]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const [filterPersona, filterPet] = selected === "all" ? [null, null] : selected.split("/");

    const loadSummary = useCallback(async () => {
        const res = await fetch(API);
        if (!res.ok) throw new Error(await readError(res, "Could not load the Studio."));
        const data = await res.json();
        setPersonas(data.personas);
        setPets(data.pets);
    }, []);

    const loadPhotos = useCallback(async () => {
        const q = new URLSearchParams();
        if (filterPersona) q.set("persona_id", filterPersona);
        if (filterPet) q.set("pet_slug", filterPet);
        const res = await fetch(`${API}/photos?${q}`);
        if (!res.ok) throw new Error(await readError(res, "Could not load photos."));
        setPhotos(await res.json());
    }, [filterPersona, filterPet]);

    const reload = useCallback(async () => {
        try {
            await Promise.all([loadSummary(), loadPhotos()]);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load the Studio.");
            setPersonas((p) => p ?? []);
        }
    }, [loadSummary, loadPhotos]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const visible = useMemo(() => (onlyTodo ? photos.filter((p) => !isDescribed(p)) : photos), [photos, onlyTodo]);
    const active = photos.find((p) => p.id === activeId) ?? null;
    const selectedPet = pets.find((p) => `${p.persona_id}/${p.pet_slug}` === selected) ?? null;

    async function upload(files: FileList | null, target: { personaId: string; petSlug: string }) {
        if (!files || files.length === 0) return;
        setError(null);
        const list = Array.from(files);
        setProgress({ done: 0, total: list.length });
        let added = 0;
        let dupes = 0;
        let firstId: string | null = null;

        // One at a time: camera-roll photos on a mobile connection, and parallel
        // uploads just mean parallel timeouts.
        for (const [i, file] of list.entries()) {
            try {
                const data = await resizeForUpload(file);
                const res = await fetch(`${API}/photos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data, kind: "post", persona_id: target.personaId, pet_slug: target.petSlug }),
                });
                if (!res.ok) throw new Error(await readError(res, `Could not upload ${file.name}.`));
                const out = await res.json();
                if (out.uploaded) {
                    added++;
                    firstId ??= out.id;
                } else dupes++;
            } catch (err) {
                setError(err instanceof Error ? err.message : `Could not upload ${file.name}.`);
            }
            setProgress({ done: i + 1, total: list.length });
        }
        setProgress(null);
        if (added || dupes) showToast(`${added} added${dupes ? `, ${dupes} already in the library` : ""}.${added ? " Describe them now." : ""}`);
        await reload();
        if (firstId) setActiveId(firstId);
    }

    async function uploadProfile(files: FileList | null, kind: "avatar" | "pet_avatar", personaId: string, petSlug?: string) {
        if (!files?.[0]) return;
        setError(null);
        try {
            const data = await resizeForUpload(files[0], 800);
            const res = await fetch(`${API}/photos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data, kind, persona_id: personaId, pet_slug: petSlug ?? null }),
            });
            if (!res.ok) throw new Error(await readError(res, "Could not upload that photo."));
            showToast("Profile photo saved.");
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not upload that photo.");
        }
    }

    async function save(photo: Photo, patch: { note: string; time_of_day: TimeOfDay; pet_slug: string | null }, advance: boolean) {
        setError(null);
        const res = await fetch(`${API}/photos/${photo.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        });
        if (!res.ok) {
            setError(await readError(res, "Could not save."));
            return;
        }
        const next = photos.map((p) =>
            p.id === photo.id ? { ...p, note: patch.note.trim() || null, time_of_day: patch.time_of_day, pet_slug: patch.pet_slug } : p
        );
        setPhotos(next);
        void loadSummary();
        if (advance) {
            const pending = next.filter((p) => !isDescribed(p) && p.id !== photo.id);
            const idx = next.findIndex((p) => p.id === photo.id);
            const following = pending.find((p) => next.indexOf(p) > idx) ?? pending[0] ?? null;
            setActiveId(following?.id ?? null);
            showToast(following ? "Saved." : "Saved. That was the last one that needed a description.");
        } else showToast("Saved.");
    }

    async function remove(photo: Photo) {
        if (!window.confirm("Delete this photo? This cannot be undone.")) return;
        const res = await fetch(`${API}/photos/${photo.id}`, { method: "DELETE" });
        if (!res.ok) {
            setError(await readError(res, "Could not delete."));
            return;
        }
        setActiveId(null);
        showToast("Deleted.");
        await reload();
    }

    if (personas === null) {
        return <div className="bg-gray-100 min-h-screen flex items-center justify-center text-gray-500">Loading the Studio…</div>;
    }

    const totals = pets.reduce(
        (a, p) => ({ total: a.total + p.total, described: a.described + p.described, ready: a.ready + (p.described >= READY_TARGET ? 1 : 0) }),
        { total: 0, described: 0, ready: 0 }
    );
    const needAvatar = personas.filter((p) => p.needs_avatar);
    const haveAvatar = needAvatar.filter((p) => p.avatar_url).length;

    return (
        <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8 pb-28">
            {toast && <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg z-[70] text-sm shadow-lg">{toast}</div>}

            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    <Link href="/admin-panel" className="text-gray-500 hover:text-primary text-sm">← Admin Panel</Link>
                    <h1 className="text-xl font-bold text-primary">Persona Studio</h1>
                </div>
                <Link href="/admin-panel/social/persona-inbox" className="text-sm text-primary underline">Persona Inbox →</Link>
            </div>

            {/* Stats + section switch */}
            <div className="flex flex-wrap items-stretch gap-3 mb-5">
                <div className="flex flex-1 gap-3 min-w-[280px]">
                    <Stat value={totals.total - totals.described} label="need a description" />
                    <Stat value={totals.ready} of={pets.length} label="pets ready to post" />
                    <Stat value={haveAvatar} of={needAvatar.length} label="profile photos in" />
                </div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 self-center" role="tablist">
                    {(["pets", "profiles"] as const).map((s) => (
                        <button
                            key={s}
                            role="tab"
                            aria-selected={section === s}
                            onClick={() => setSection(s)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${section === s ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
                        >
                            {s === "pets" ? "Pet photos" : "Profile photos"}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

            {section === "profiles" ? (
                <ProfilePhotos personas={personas} pets={pets} onUpload={uploadProfile} />
            ) : (
                <div className={`grid gap-4 grid-cols-1 lg:items-start ${active ? "lg:grid-cols-[250px_minmax(0,1fr)_390px]" : "lg:grid-cols-[250px_minmax(0,1fr)]"}`}>
                    {/* Pets: a swipeable strip on a phone, a column on a wide screen */}
                    <nav aria-label="Pets" className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-11rem)] lg:sticky lg:top-4 pb-1">
                        <PetChip active={selected === "all"} onClick={() => setSelected("all")} face={<span className="bg-primary text-white">All</span>} title="Everyone" sub={`${totals.described} of ${totals.total} described`} />
                        {pets.map((pet) => (
                            <PetChip
                                key={`${pet.persona_id}/${pet.pet_slug}`}
                                active={selected === `${pet.persona_id}/${pet.pet_slug}`}
                                onClick={() => setSelected(`${pet.persona_id}/${pet.pet_slug}`)}
                                face={pet.avatar_url ? <img src={pet.avatar_url} alt="" className="w-full h-full object-cover" /> : <span>{initials(pet.name)}</span>}
                                title={pet.name}
                                sub={pet.persona_name.split(" ")[0]}
                                meter={{ value: pet.described, target: READY_TARGET }}
                            />
                        ))}
                    </nav>

                    {/* Photos */}
                    <section aria-label="Photos" className="min-w-0">
                        {selectedPet ? (
                            <Dropzone pet={selectedPet} progress={progress} onUpload={(f) => upload(f, { personaId: selectedPet.persona_id, petSlug: selectedPet.pet_slug })} />
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
                                <p className="font-semibold text-gray-800">Pick a pet to add photos.</p>
                                <p className="text-sm text-gray-500 mt-1">Photos are added per pet, so the caption knows who is in the picture. Below is every photo, with the ones that still need a description first.</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between my-3">
                            <span className="text-sm text-gray-500">{visible.length} photo{visible.length === 1 ? "" : "s"}</span>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} className="w-5 h-5 accent-[var(--primary-color)]" />
                                Only ones that need a description
                            </label>
                        </div>

                        {visible.length === 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
                                {photos.length === 0 ? (selectedPet ? `No photos of ${selectedPet.name} yet. Add a few above.` : "No photos yet. Choose a pet and add some.") : "Everything here is described."}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
                                {visible.map((photo) => (
                                    <button
                                        key={photo.id}
                                        onClick={() => setActiveId(photo.id)}
                                        aria-label={isDescribed(photo) ? photo.note ?? "Photo" : "Photo needing a description"}
                                        className={`relative aspect-square overflow-hidden rounded-lg bg-gray-200 border-2 ${photo.id === activeId ? "border-primary" : "border-transparent"} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                                    >
                                        <img src={photo.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                                        <span className={`absolute left-1.5 top-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${isDescribed(photo) ? "bg-green-600" : "bg-amber-500"}`}>
                                            {isDescribed(photo) ? "✓" : "Needs description"}
                                        </span>
                                        {photo.use_count > 0 && <span className="absolute right-1.5 bottom-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white">used {photo.use_count}×</span>}
                                        {!selectedPet && photo.pet_name && <span className="absolute left-1.5 bottom-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white">{photo.pet_name}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Editor: a bottom sheet on a phone, a sticky side panel on a wide screen */}
                    {active && (
                        <>
                            <div className="fixed inset-0 bg-black/45 z-40 lg:hidden" onClick={() => setActiveId(null)} />
                            <Editor
                                key={active.id}
                                photo={active}
                                pets={pets.filter((p) => p.persona_id === active.persona_id)}
                                remaining={photos.filter((p) => !isDescribed(p) && p.id !== active.id).length}
                                hasNext={photos.some((p) => !isDescribed(p) && p.id !== active.id)}
                                onClose={() => setActiveId(null)}
                                onSave={(patch, advance) => save(active, patch, advance)}
                                onDelete={() => remove(active)}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------

function Stat({ value, of, label }: { value: number; of?: number; label: string }) {
    return (
        <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div className="text-2xl font-bold text-gray-900">
                {value}
                {of !== undefined && <span className="text-sm font-medium text-gray-400">/{of}</span>}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
        </div>
    );
}

function PetChip({ active, onClick, face, title, sub, meter }: { active: boolean; onClick: () => void; face: React.ReactNode; title: string; sub: string; meter?: { value: number; target: number } }) {
    const pct = meter ? Math.min(100, Math.round((meter.value / meter.target) * 100)) : 0;
    return (
        <button
            onClick={onClick}
            aria-current={active ? "true" : undefined}
            className={`flex-none min-w-[160px] lg:min-w-0 flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-gray-200 bg-white hover:border-primary/50"}`}
        >
            <span className="flex-none w-10 h-10 rounded-full overflow-hidden grid place-items-center text-sm font-bold text-primary bg-primary/10 border border-gray-200 [&>span]:w-full [&>span]:h-full [&>span]:grid [&>span]:place-items-center">{face}</span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900 truncate">{title}</span>
                <span className="block text-[11px] text-gray-500">{sub}</span>
                {meter && (
                    <span className={`block h-1.5 mt-1.5 rounded-full overflow-hidden ${meter.value === 0 ? "bg-amber-200" : "bg-gray-200"}`} role="img" aria-label={`${meter.value} of ${meter.target} photos described`}>
                        <span className={`block h-full rounded-full ${meter.value >= meter.target ? "bg-green-600" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </span>
                )}
            </span>
        </button>
    );
}

function Dropzone({ pet, progress, onUpload }: { pet: StudioPet; progress: { done: number; total: number } | null; onUpload: (f: FileList | null) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const remaining = Math.max(0, READY_TARGET - pet.described);
    return (
        <div
            className={`bg-white rounded-lg border-2 border-dashed p-4 transition-colors ${dragging ? "border-primary bg-primary/10" : "border-gray-300"}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); onUpload(e.dataTransfer.files); }}
        >
            <h2 className="font-bold text-gray-900">
                {pet.name} <span className="font-normal text-gray-500 text-sm">· {pet.breed ?? pet.species} · {pet.persona_name}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
                {pet.described >= READY_TARGET
                    ? `Ready to post. ${pet.available} described photo${pet.available === 1 ? "" : "s"} not used recently.`
                    : `${remaining} more described photo${remaining === 1 ? "" : "s"} before ${pet.name} can start posting. Use one animal, phone-shot, no watermarks.`}
            </p>
            <button onClick={() => input.current?.click()} disabled={progress !== null} className="mt-3 w-full min-h-[44px] rounded-lg bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-60">
                {progress ? `Uploading ${progress.done} of ${progress.total}…` : `+ Add photos of ${pet.name}`}
                <span className="hidden lg:inline">{progress ? "" : ", or drop them here"}</span>
            </button>
            <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
        </div>
    );
}

function Editor({ photo, pets, remaining, hasNext, onClose, onSave, onDelete }: {
    photo: Photo; pets: StudioPet[]; remaining: number; hasNext: boolean;
    onClose: () => void;
    onSave: (patch: { note: string; time_of_day: TimeOfDay; pet_slug: string | null }, advance: boolean) => Promise<void>;
    onDelete: () => void;
}) {
    const [note, setNote] = useState(photo.note ?? "");
    const [time, setTime] = useState<TimeOfDay>(photo.time_of_day);
    const [petSlug, setPetSlug] = useState<string | null>(photo.pet_slug);
    const [busy, setBusy] = useState(false);
    const area = useRef<HTMLTextAreaElement>(null);

    const dirty = note.trim() !== (photo.note ?? "").trim() || time !== photo.time_of_day || petSlug !== photo.pet_slug;
    const wasDescribed = (photo.note ?? "").trim().length > 0;
    const canSave = note.trim().length > 0 && !busy;
    const touch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

    useEffect(() => {
        if (!touch) area.current?.focus();
    }, [touch]);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    async function submit(advance: boolean) {
        if (!canSave) return;
        setBusy(true);
        await onSave({ note: note.trim(), time_of_day: time, pet_slug: petSlug }, advance);
        setBusy(false);
    }
    const addPhrase = (phrase: string) => {
        setNote((cur) => {
            const base = cur.trimEnd();
            return (base ? `${base.replace(/[,.]$/, "")}, ${phrase}` : phrase).slice(0, NOTE_MAX);
        });
        area.current?.focus();
    };

    return (
        <aside
            aria-label="Describe this photo"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto overscroll-contain bg-white rounded-t-2xl px-4 pt-2 shadow-2xl lg:static lg:z-auto lg:max-h-[calc(100vh-11rem)] lg:sticky lg:top-4 lg:rounded-lg lg:border lg:border-gray-200 lg:pt-4 lg:shadow-none"
        >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 lg:hidden" aria-hidden="true" />
            <div className="flex items-baseline gap-2 mb-3">
                <strong className="text-gray-900">{photo.pet_name ?? "Photo"}</strong>
                <span className="text-sm text-gray-500">{photo.persona_name}</span>
                <button onClick={onClose} aria-label="Close" className="ml-auto self-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-lg leading-none">×</button>
            </div>

            <div className="rounded-lg bg-gray-100 overflow-hidden mb-4 grid place-items-center">
                <img src={photo.url} alt="" className="block w-full max-h-[42vh] object-contain" />
            </div>

            <label htmlFor="note" className="block text-xs font-semibold text-gray-600 mb-1">What is in this photo?</label>
            <textarea
                id="note"
                ref={area}
                value={note}
                maxLength={NOTE_MAX}
                placeholder="e.g. asleep on the carpet with her paws stretched out, afternoon light"
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        void submit(true);
                    }
                }}
                className="w-full min-h-[92px] rounded-lg border border-gray-300 bg-gray-50 p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-between gap-3 mt-1 mb-3">
                <span className="text-xs text-gray-500">Describe the picture, not the caption. The persona writes the caption from this.</span>
                <span className={`text-xs ${note.length > NOTE_MAX - 30 ? "text-amber-600" : "text-gray-500"}`}>{note.length}/{NOTE_MAX}</span>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick phrases">
                {QUICK_PHRASES.map((phrase) => (
                    <button key={phrase} type="button" onClick={() => addPhrase(phrase)} className="min-h-[34px] px-3 rounded-full border border-gray-300 bg-gray-50 text-[13px] font-medium text-gray-800 hover:border-primary hover:bg-primary/10">
                        {phrase}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                <span className="block text-xs font-semibold text-gray-600 mb-1">Best posted</span>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto" role="radiogroup">
                    {TIMES.map((t) => (
                        <button key={t.value} role="radio" aria-checked={time === t.value} onClick={() => setTime(t.value)} className={`flex-1 whitespace-nowrap px-3 py-2 text-[13px] font-semibold rounded-md ${time === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Only posted at this time of day. Leave on Any time unless the light gives it away.</p>
            </div>

            {pets.length > 1 && (
                <div className="mt-3">
                    <label htmlFor="pet" className="block text-xs font-semibold text-gray-600 mb-1">Which pet is this?</label>
                    <select id="pet" value={petSlug ?? ""} onChange={(e) => setPetSlug(e.target.value || null)} className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-gray-50 px-3">
                        {petSlug === null && <option value="">Not set</option>}
                        {pets.map((p) => <option key={p.pet_slug} value={p.pet_slug}>{p.name}</option>)}
                    </select>
                </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
                {photo.use_count === 0 ? "Not posted yet." : `Posted ${photo.use_count} time${photo.use_count === 1 ? "" : "s"}, last ${timeAgo(photo.last_used_at)}.`} A photo is never reused.
            </p>

            {/* Stays in view while the photo and phrases scroll past it */}
            <div className="sticky bottom-0 -mx-4 mt-3 px-4 pt-3 pb-3 bg-gradient-to-b from-transparent to-white to-[14px] flex flex-col gap-2">
                {wasDescribed && !dirty ? (
                    <button onClick={onClose} className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-gray-50 font-semibold">Done</button>
                ) : (
                    <>
                        <button disabled={!canSave} onClick={() => void submit(true)} className="w-full min-h-[44px] rounded-lg bg-primary text-white font-semibold disabled:opacity-50">
                            {busy ? "Saving…" : hasNext ? `Save & next (${remaining} left)` : "Save"}
                        </button>
                        {hasNext && <button disabled={!canSave} onClick={() => void submit(false)} className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-gray-50 font-semibold disabled:opacity-50">Save and stay</button>}
                    </>
                )}
            </div>
            <div className="pb-5 lg:pb-3">
                <button onClick={onDelete} className="w-full min-h-[44px] rounded-lg border border-red-300 text-red-600 font-semibold hover:bg-red-50">Delete photo</button>
                <p className="hidden lg:block text-center text-xs text-gray-400 mt-2">Ctrl/⌘ + Enter saves and moves on. Esc closes.</p>
            </div>
        </aside>
    );
}

function ProfilePhotos({ personas, pets, onUpload }: {
    personas: StudioPersona[]; pets: StudioPet[];
    onUpload: (files: FileList | null, kind: "avatar" | "pet_avatar", personaId: string, petSlug?: string) => void;
}) {
    const needs = personas.filter((p) => p.needs_avatar);
    const skips = personas.filter((p) => !p.needs_avatar);
    const men = personas.filter((p) => p.gender === "male");
    const women = personas.filter((p) => p.gender === "female");
    const withPhoto = (list: StudioPersona[]) => list.filter((p) => p.needs_avatar).length;

    return (
        <div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
                <h2 className="font-bold text-gray-900 mb-1">Who gets a profile photo</h2>
                <p className="text-sm text-gray-600">
                    Twenty accounts that all have a face on them is a giveaway, so coverage is deliberately uneven:{" "}
                    <strong>{withPhoto(men)} of {men.length} men</strong> and <strong>{withPhoto(women)} of {women.length} women</strong> have one.
                    The rest stay blank on purpose.
                </p>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Needs a photo · {needs.length}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 mb-6">
                {needs.map((p) => (
                    <AvatarSlot key={p.persona_id} name={p.name} sub={p.city ?? ""} url={p.avatar_url} round onPick={(f) => onUpload(f, "avatar", p.persona_id)} />
                ))}
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pet profile photos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 mb-6">
                {pets.map((p) => (
                    <AvatarSlot key={`${p.persona_id}/${p.pet_slug}`} name={p.name} sub={`${p.persona_name.split(" ")[0]}'s ${p.species}`} url={p.avatar_url} onPick={(f) => onUpload(f, "pet_avatar", p.persona_id, p.pet_slug)} />
                ))}
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Blank on purpose · {skips.length}</h3>
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {skips.map((p) => (
                    <div key={p.persona_id} className="flex items-center gap-3 p-3">
                        <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold grid place-items-center">{initials(p.name)}</span>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.avatar_reason}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AvatarSlot({ name, sub, url, round, onPick }: { name: string; sub: string; url: string | null; round?: boolean; onPick: (f: FileList | null) => void }) {
    const input = useRef<HTMLInputElement>(null);
    return (
        <button onClick={() => input.current?.click()} className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-center hover:border-primary">
            {url ? (
                <img src={url} alt="" loading="lazy" className={`w-20 h-20 object-cover mb-1 ${round ? "rounded-full" : "rounded-2xl"}`} />
            ) : (
                <span className={`w-20 h-20 mb-1 grid place-items-center border-2 border-dashed border-gray-300 text-primary text-3xl font-light ${round ? "rounded-full" : "rounded-2xl"}`}>+</span>
            )}
            <span className="text-sm font-semibold text-gray-900">{name}</span>
            <span className="text-xs text-gray-500">{url ? "Tap to replace" : sub || "Add a photo"}</span>
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { onPick(e.target.files); e.target.value = ""; }} />
        </button>
    );
}
