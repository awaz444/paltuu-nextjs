"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

/** A vet or clinic review, as GET /api/v1/admin/reviews returns it. */
interface Review {
    review_id: number;
    rating: number | null;
    review_content: string | null;
    review_date: string | null;
    vet_id: number | null;
    vet_name: string | null;
    clinic_id: string | number | null;
    clinic_name: string | null;
    user_id: number | null;
    reviewer_name: string | null;
}

type State = "pending" | "approved";

const API = "/api/v1/admin/reviews";

function ago(iso: string | null) {
    if (!iso) return "";
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

/** What the review is about, and where it shows publicly. */
function target(review: Review): { kind: string; name: string; href: string | null } {
    if (review.vet_id) {
        return { kind: "Vet", name: review.vet_name ?? `Vet #${review.vet_id}`, href: `/pet-care/${review.vet_id}` };
    }
    if (review.clinic_id) {
        return { kind: "Clinic", name: review.clinic_name ?? `Clinic #${review.clinic_id}`, href: `/pet-care/clinic/${review.clinic_id}` };
    }
    return { kind: "Unlinked", name: "No vet or clinic", href: null };
}

function Stars({ rating }: { rating: number | null }) {
    const value = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
    return (
        <span className="text-amber-500 text-sm" aria-label={`${value} out of 5 stars`}>
            {"★".repeat(value)}
            <span className="text-gray-300">{"★".repeat(5 - value)}</span>
        </span>
    );
}

export default function AdminReviewsPage() {
    const { user, isHydrating } = useAuth();
    const router = useRouter();
    const [state, setState] = useState<State>("pending");
    const [reviews, setReviews] = useState<Review[] | null>(null);
    const [counts, setCounts] = useState<{ pending: number; approved: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    useEffect(() => {
        if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
    }, [user, isHydrating, router]);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API}?state=${state}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Could not load reviews.");
            const data = await res.json();
            setReviews(data.reviews ?? []);
            setCounts(data.counts ?? null);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load reviews.");
            setReviews([]);
        }
    }, [state]);

    useEffect(() => {
        setReviews(null);
        void load();
    }, [load]);

    async function act(review: Review, action: "approve" | "unapprove" | "delete") {
        if (action === "delete" && !window.confirm("Delete this review for good? This can't be undone.")) return;
        setBusyId(review.review_id);
        try {
            const res = await fetch(`${API}/${review.review_id}`, action === "delete"
                ? { method: "DELETE" }
                : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
            if (!res.ok) throw new Error("Could not update that review.");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update that review.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <Link href="/admin-panel" className="text-gray-500 hover:text-primary text-sm">← Admin Panel</Link>
                <h1 className="text-xl font-bold text-primary">Vet &amp; Clinic Reviews</h1>
            </div>

            <p className="text-sm text-gray-600 mb-4 max-w-2xl">
                New reviews of vets and clinics stay hidden until they&apos;re approved here. Approve genuine ones,
                even when they&apos;re critical; delete spam, abuse or reviews of the wrong place.
            </p>

            <div className="inline-flex bg-white rounded-lg border border-gray-200 p-1 mb-5" role="tablist">
                {(["pending", "approved"] as const).map((s) => (
                    <button
                        key={s}
                        role="tab"
                        aria-selected={state === s}
                        onClick={() => setState(s)}
                        className={`px-4 py-2 text-sm font-semibold rounded-md ${state === s ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                        {s === "pending" ? "Waiting" : "Published"}
                        {counts && <span className="ml-1.5 opacity-80">({counts[s]})</span>}
                    </button>
                ))}
            </div>

            {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

            {reviews === null ? (
                <p className="text-gray-500 text-sm">Loading…</p>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
                    {state === "pending" ? "No reviews waiting. New vet and clinic reviews show up here." : "No published reviews yet."}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {reviews.map((review) => {
                        const about = target(review);
                        const busy = busyId === review.review_id;
                        return (
                            <article key={review.review_id} className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{about.kind}</span>
                                    <span className="text-xs text-gray-500">{ago(review.review_date)}</span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-gray-900">
                                    {about.href ? (
                                        <Link href={about.href} target="_blank" className="hover:text-primary hover:underline">{about.name}</Link>
                                    ) : about.name}
                                </p>
                                <div className="mt-1"><Stars rating={review.rating} /></div>
                                <p className="text-gray-900 mt-2 mb-1 leading-snug whitespace-pre-line break-words">
                                    {review.review_content?.trim() ? `“${review.review_content.trim()}”` : <span className="text-gray-400 italic">Rating only, no text</span>}
                                </p>
                                <p className="text-xs text-gray-500">by <strong>{review.reviewer_name ?? "a deleted user"}</strong></p>
                                <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
                                    {state === "pending" ? (
                                        <button disabled={busy} onClick={() => act(review, "approve")} className="min-h-[40px] px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                                            {busy ? "Saving…" : "Approve"}
                                        </button>
                                    ) : (
                                        <button disabled={busy} onClick={() => act(review, "unapprove")} className="min-h-[40px] px-4 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">
                                            {busy ? "Saving…" : "Hide"}
                                        </button>
                                    )}
                                    <button disabled={busy} onClick={() => act(review, "delete")} className="min-h-[40px] px-4 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60">
                                        Delete
                                    </button>
                                    <span className="ml-auto text-[11px] text-gray-400">review #{review.review_id}</span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
