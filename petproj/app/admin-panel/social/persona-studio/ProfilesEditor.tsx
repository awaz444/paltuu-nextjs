"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

interface PetRow {
    persona_id: string;
    pet_slug: string;
    name: string;
    species: string;
    breed: string | null;
    gender: string;
    bio: string | null;
    avatar_url: string | null;
    missing: string[];
}
interface PersonaRow {
    persona_id: string;
    name: string;
    social_username: string;
    bio: string | null;
    city: string | null;
    avatar_url: string | null;
    status: string;
    seeded: boolean;
    avatar_optional: boolean;
    missing: string[];
    pets: PetRow[];
}
interface Summary {
    personas_complete: number;
    personas_total: number;
    pets_complete: number;
    pets_total: number;
    seeded: number;
}

const API = "/api/v1/admin/persona-studio/profiles";
const initials = (name: string) => name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

interface SaveResult {
    ok: boolean;
    error?: string;
    field?: string;
    synced?: boolean;
}

async function patch(url: string, body: Record<string, unknown>): Promise<SaveResult> {
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, synced: data.synced } : { ok: false, error: data.error ?? "Could not save.", field: data.field };
}

export default function ProfilesEditor({ onNotice }: { onNotice: (msg: string) => void }) {
    const [personas, setPersonas] = useState<PersonaRow[] | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState<string | null>(null);
    const [needsWork, setNeedsWork] = useState(false);
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error("Could not load profiles.");
            const data = await res.json();
            setPersonas(data.personas);
            setSummary(data.summary);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load profiles.");
            setPersonas([]);
        }
    }, []);
    useEffect(() => {
        void load();
    }, [load]);

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (personas ?? []).filter(
            (p) =>
                (!needsWork || p.missing.length > 0 || p.pets.some((x) => x.missing.length > 0)) &&
                (!q || p.name.toLowerCase().includes(q) || p.social_username.includes(q) || p.pets.some((x) => x.name.toLowerCase().includes(q)))
        );
    }, [personas, needsWork, query]);

    if (personas === null) return <p className="text-sm text-gray-500">Loading profiles…</p>;

    return (
        <div>
            {summary && (
                <div className="flex flex-wrap gap-3 mb-4">
                    <Tile label="personas complete" value={summary.personas_complete} of={summary.personas_total} />
                    <Tile label="pets complete" value={summary.pets_complete} of={summary.pets_total} />
                    <Tile label="live accounts created" value={summary.seeded} of={summary.personas_total} />
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a persona, username or pet"
                    className="flex-1 min-w-[220px] min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={needsWork} onChange={(e) => setNeedsWork(e.target.checked)} className="w-5 h-5 accent-[var(--primary-color)]" />
                    Only ones that need work
                </label>
            </div>

            {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
            {shown.length === 0 && <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">Nothing matches.</div>}

            <div className="space-y-3">
                {shown.map((p) => (
                    <PersonaCard key={p.persona_id} persona={p} isOpen={open === p.persona_id} onToggle={() => setOpen(open === p.persona_id ? null : p.persona_id)} onSaved={async (msg) => { onNotice(msg); await load(); }} />
                ))}
            </div>
        </div>
    );
}

function Tile({ label, value, of }: { label: string; value: number; of: number }) {
    return (
        <div className="flex-1 min-w-[150px] bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div className="text-2xl font-bold text-gray-900">{value}<span className="text-sm font-medium text-gray-400">/{of}</span></div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
        </div>
    );
}

function Chip({ done, count }: { done: boolean; count: number }) {
    return done ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Complete</span>
    ) : (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{count} to do</span>
    );
}

function PersonaCard({ persona, isOpen, onToggle, onSaved }: { persona: PersonaRow; isOpen: boolean; onToggle: () => void; onSaved: (msg: string) => Promise<void> }) {
    const petsTodo = persona.pets.filter((p) => p.missing.length > 0).length;
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <button onClick={onToggle} aria-expanded={isOpen} className="w-full flex items-center gap-3 p-3 sm:p-4 text-left">
                {persona.avatar_url ? (
                    <img src={persona.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-gray-200" />
                ) : (
                    <span className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold grid place-items-center">{initials(persona.name)}</span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900 truncate">{persona.name}</span>
                    <span className="block text-xs text-gray-500 truncate">@{persona.social_username} · {persona.city ?? "no city"} · {persona.pets.length} pet{persona.pets.length === 1 ? "" : "s"}</span>
                </span>
                <span className="hidden sm:flex items-center gap-2">
                    <Chip done={persona.missing.length === 0} count={persona.missing.length} />
                    {persona.pets.length > 0 && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${petsTodo === 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{petsTodo === 0 ? "Pets complete" : `${petsTodo} pet${petsTodo === 1 ? "" : "s"} to finish`}</span>}
                </span>
                <span className="text-gray-400 text-lg" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
            </button>

            {isOpen && (
                <div className="border-t border-gray-100 p-3 sm:p-4 space-y-5">
                    {persona.missing.length > 0 && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
                            Still missing: {persona.missing.join(", ")}.
                            {persona.avatar_optional && " (No profile photo is intended for this account.)"}
                        </p>
                    )}
                    {persona.seeded && <p className="text-xs text-gray-500">This account is live in the app, so changes here update the real profile too.</p>}

                    <PersonaForm persona={persona} onSaved={onSaved} />

                    {persona.pets.length > 0 && <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pt-1">Pets</h3>}
                    {persona.pets.map((pet) => <PetForm key={pet.pet_slug} pet={pet} onSaved={onSaved} />)}
                </div>
            )}
        </div>
    );
}

function Field({ id, label, value, onChange, error, hint, multiline, max, prefix }: {
    id: string; label: string; value: string; onChange: (v: string) => void; error?: string | null; hint?: string; multiline?: boolean; max?: number; prefix?: string;
}) {
    const cls = `w-full rounded-lg border bg-gray-50 px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary ${error ? "border-red-400" : "border-gray-300"}`;
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
            <div className="flex items-center gap-1">
                {prefix && <span className="text-gray-400">{prefix}</span>}
                {multiline ? (
                    <textarea id={id} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className={`${cls} min-h-[84px] py-2`} />
                ) : (
                    <input id={id} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className={`${cls} min-h-[44px]`} />
                )}
            </div>
            <div className="flex justify-between gap-2 mt-1">
                <span className={`text-xs ${error ? "text-red-600" : "text-gray-500"}`}>{error ?? hint ?? ""}</span>
                {max && <span className="text-xs text-gray-400">{value.length}/{max}</span>}
            </div>
        </div>
    );
}

function PersonaForm({ persona, onSaved }: { persona: PersonaRow; onSaved: (msg: string) => Promise<void> }) {
    const [name, setName] = useState(persona.name);
    const [username, setUsername] = useState(persona.social_username);
    const [bio, setBio] = useState(persona.bio ?? "");
    const [city, setCity] = useState(persona.city ?? "");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<{ field?: string; error: string } | null>(null);

    const dirty = name !== persona.name || username !== persona.social_username || bio !== (persona.bio ?? "") || city !== (persona.city ?? "");
    const errFor = (f: string) => (err?.field === f ? err.error : null);

    async function save() {
        setBusy(true);
        setErr(null);
        const body: Record<string, string> = {};
        if (name !== persona.name) body.name = name;
        if (username !== persona.social_username) body.social_username = username;
        if (bio !== (persona.bio ?? "")) body.bio = bio;
        if (city !== (persona.city ?? "")) body.city = city;
        const r = await patch(`${API}/${persona.persona_id}`, body);
        setBusy(false);
        if (!r.ok) return setErr({ field: r.field, error: r.error ?? "Could not save." });
        await onSaved(`${persona.name} saved${r.synced ? ", and the live profile updated" : ""}.`);
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`n-${persona.persona_id}`} label="Name" value={name} onChange={setName} error={errFor("name")} />
            <Field id={`u-${persona.persona_id}`} label="Username" value={username} onChange={setUsername} error={errFor("social_username")} prefix="@" hint="Lowercase, numbers, dots, underscores" />
            <div className="sm:col-span-2"><Field id={`b-${persona.persona_id}`} label="Bio" value={bio} onChange={setBio} error={errFor("bio")} multiline max={160} hint="One line. How this person would describe themselves." /></div>
            <Field id={`c-${persona.persona_id}`} label="City" value={city} onChange={setCity} error={errFor("city")} />
            <div className="flex items-end justify-end gap-2">
                {err && !err.field && <span className="text-xs text-red-600 mr-auto">{err.error}</span>}
                <button disabled={!dirty || busy} onClick={() => void save()} className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold disabled:opacity-40">{busy ? "Saving…" : "Save"}</button>
            </div>
        </div>
    );
}

function PetForm({ pet, onSaved }: { pet: PetRow; onSaved: (msg: string) => Promise<void> }) {
    const [name, setName] = useState(pet.name);
    const [breed, setBreed] = useState(pet.breed ?? "");
    const [bio, setBio] = useState(pet.bio ?? "");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<{ field?: string; error: string } | null>(null);

    const dirty = name !== pet.name || breed !== (pet.breed ?? "") || bio !== (pet.bio ?? "");
    const errFor = (f: string) => (err?.field === f ? err.error : null);

    async function save() {
        setBusy(true);
        setErr(null);
        const body: Record<string, string> = {};
        if (name !== pet.name) body.name = name;
        if (breed !== (pet.breed ?? "")) body.breed = breed;
        if (bio !== (pet.bio ?? "")) body.bio = bio;
        const r = await patch(`${API}/${pet.persona_id}/pets/${pet.pet_slug}`, body);
        setBusy(false);
        if (!r.ok) return setErr({ field: r.field, error: r.error ?? "Could not save." });
        await onSaved(`${name} saved${r.synced ? ", and the live pet profile updated" : ""}.`);
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="flex items-center gap-3 mb-3">
                {pet.avatar_url ? (
                    <img src={pet.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                ) : (
                    <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold grid place-items-center">{initials(pet.name)}</span>
                )}
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900">{pet.name} <span className="font-normal text-gray-500">· {pet.gender} {pet.species}</span></div>
                    {pet.missing.length > 0 ? <div className="text-xs text-amber-700">Missing: {pet.missing.join(", ")}</div> : <div className="text-xs text-green-700">Complete</div>}
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field id={`pn-${pet.persona_id}-${pet.pet_slug}`} label="Pet name" value={name} onChange={setName} error={errFor("name")} hint="Renames the live pet profile too, so posts keep tagging the right pet" />
                <Field id={`pbr-${pet.persona_id}-${pet.pet_slug}`} label="Breed" value={breed} onChange={setBreed} error={errFor("breed")} />
                <div className="sm:col-span-2"><Field id={`pb-${pet.persona_id}-${pet.pet_slug}`} label="Bio" value={bio} onChange={setBio} error={errFor("bio")} multiline max={300} /></div>
            </div>
            <div className="flex justify-end items-center gap-2 mt-2">
                {err && !err.field && <span className="text-xs text-red-600 mr-auto">{err.error}</span>}
                <button disabled={!dirty || busy} onClick={() => void save()} className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold disabled:opacity-40">{busy ? "Saving…" : `Save ${pet.name}`}</button>
            </div>
        </div>
    );
}
