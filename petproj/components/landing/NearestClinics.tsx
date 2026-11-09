"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

/**
 * "Use my location" for the landing pages' vets section. Asks for the browser's
 * location only when tapped (never on page load), then lists the nearest
 * clinics from the public /api/v1/clinics?sort=distance endpoint. Until then it
 * shows whatever the server rendered (`initial`), so the page stays static.
 */

interface ClinicRow {
    clinic_id: number;
    name: string;
    address: string | null;
    city: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
}

type State =
    | { kind: "idle" }
    | { kind: "locating" }
    | { kind: "done"; clinics: (ClinicRow & { km: number | null })[] }
    | { kind: "error"; message: string };

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export default function NearestClinics({ initial, label = "Use my location" }: { initial: ReactNode; label?: string }) {
    const [state, setState] = useState<State>({ kind: "idle" });

    const locate = () => {
        if (!("geolocation" in navigator)) {
            setState({ kind: "error", message: "Your browser can't share a location." });
            return;
        }
        setState({ kind: "locating" });
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const params = new URLSearchParams({
                        sort: "distance",
                        lat: String(coords.latitude),
                        lng: String(coords.longitude),
                        limit: "5",
                        listing_type: "clinic",
                    });
                    const res = await fetch(`/api/v1/clinics?${params}`);
                    if (!res.ok) throw new Error(String(res.status));
                    const { data } = (await res.json()) as { data: ClinicRow[] };
                    const clinics = data.map((c) => {
                        const lat = Number(c.latitude);
                        const lng = Number(c.longitude);
                        const km =
                            Number.isFinite(lat) && Number.isFinite(lng) && c.latitude !== null && c.longitude !== null
                                ? distanceKm(coords.latitude, coords.longitude, lat, lng)
                                : null;
                        return { ...c, km };
                    });
                    setState({ kind: "done", clinics });
                } catch {
                    setState({ kind: "error", message: "We couldn't load clinics near you. Try again." });
                }
            },
            () => setState({ kind: "error", message: "Location is off, so these are the top clinics instead." }),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
    };

    return (
        <div>
            <button
                type="button"
                onClick={locate}
                disabled={state.kind === "locating"}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-primary transition-colors hover:border-primary disabled:opacity-60"
            >
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
                {state.kind === "locating" ? "Finding clinics near you…" : label}
            </button>
            {state.kind === "error" && <p className="-mt-2 mb-4 text-[13px] text-gray-600">{state.message}</p>}

            {state.kind === "done" ? (
                state.clinics.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                        {state.clinics.map((c) => (
                            <li key={c.clinic_id}>
                                <Link
                                    href={`/pet-care/clinic/${c.clinic_id}`}
                                    className="flex h-full items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 transition-colors hover:border-primary"
                                >
                                    <Image src="/icons/features/vet.jpg" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="text-sm font-bold text-gray-900">{c.name}</span>
                                        <span className="line-clamp-1 text-xs text-gray-600">{c.address || c.city}</span>
                                    </span>
                                    {c.km !== null && (
                                        <span className="whitespace-nowrap text-xs font-semibold text-gray-700">
                                            {c.km < 10 ? c.km.toFixed(1) : Math.round(c.km)} km
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-600">No clinics on Paltuu near you yet.</p>
                )
            ) : (
                initial
            )}
        </div>
    );
}
