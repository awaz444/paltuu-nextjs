"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Flag {
    id: string;
    persona_id: string;
    persona_name: string;
    comment_id: string;
    post_id: string;
    author_name: string | null;
    reason: "needs_admin" | "identity_question" | "sensitive" | "abusive";
    content: string;
    created_at: string;
    resolved_at: string | null;
    resolved_note: string | null;
    post_content: string | null;
}

const API = "/api/v1/admin/persona-studio/inbox";

const REASONS: Record<Flag["reason"], { label: string; help: string; badge: string }> = {
    needs_admin: {
        label: "For the team",
        help: "Asked about the app, an order, an adoption or a price. A persona cannot answer this.",
        badge: "bg-orange-100 text-orange-700",
    },
    identity_question: {
        label: "Asked if it is a bot",
        help: "The persona has not replied and never will. Answer as the company, or leave it.",
        badge: "bg-red-100 text-red-700",
    },
    sensitive: {
        label: "Sad or sensitive",
        help: "Loss, illness or grief. Worth a human reply, or none.",
        badge: "bg-gray-200 text-gray-700",
    },
    abusive: { label: "Abusive", help: "Not engaged with.", badge: "bg-gray-200 text-gray-700" },
};

function ago(iso: string) {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export default function PersonaInboxPage() {
    const { user, isHydrating } = useAuth();
    const router = useRouter();
    const [state, setState] = useState<"open" | "resolved">("open");
    const [flags, setFlags] = useState<Flag[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
    }, [user, isHydrating, router]);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API}?state=${state}`);
            if (!res.ok) throw new Error("Could not load the Inbox.");
            setFlags(await res.json());
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load the Inbox.");
            setFlags([]);
        }
    }, [state]);

    useEffect(() => {
        setFlags(null);
        void load();
    }, [load]);

    async function act(flag: Flag, action: "resolve" | "reopen") {
        setBusyId(flag.id);
        try {
            const res = await fetch(`${API}/${flag.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            if (!res.ok) throw new Error("Could not update that.");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update that.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    <Link href="/admin-panel" className="text-gray-500 hover:text-primary text-sm">← Admin Panel</Link>
                    <h1 className="text-xl font-bold text-primary">Persona Inbox</h1>
                </div>
                <Link href="/admin-panel/social/persona-studio" className="text-sm text-primary underline">← Persona Studio</Link>
            </div>

            <p className="text-sm text-gray-600 mb-4 max-w-2xl">
                Personas answer real people who talk to them. These are the comments they did <strong>not</strong> answer, because a person needs to: a question about the app, someone asking whether the account is a bot, or something sad.
            </p>

            <div className="inline-flex bg-white rounded-lg border border-gray-200 p-1 mb-5" role="tablist">
                {(["open", "resolved"] as const).map((s) => (
                    <button key={s} role="tab" aria-selected={state === s} onClick={() => setState(s)} className={`px-4 py-2 text-sm font-semibold rounded-md ${state === s ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                        {s === "open" ? "To handle" : "Handled"}
                    </button>
                ))}
            </div>

            {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

            {flags === null ? (
                <p className="text-gray-500 text-sm">Loading…</p>
            ) : flags.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
                    {state === "open" ? "Nothing waiting. When a real person asks a persona about the app, or whether it is a bot, it shows up here." : "Nothing handled yet."}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {flags.map((flag) => {
                        const meta = REASONS[flag.reason];
                        return (
                            <article key={flag.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col">
                                <div className="flex items-start justify-between gap-2">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                                    <span className="text-xs text-gray-500">{ago(state === "open" ? flag.created_at : flag.resolved_at ?? flag.created_at)}</span>
                                </div>
                                <p className="text-lg text-gray-900 mt-3 mb-1 leading-snug">“{flag.content}”</p>
                                <p className="text-xs text-gray-500 mb-2">
                                    from <strong>{flag.author_name ?? "a user"}</strong>, on {flag.persona_name}’s{flag.post_content ? " post:" : " thread"}
                                </p>
                                {flag.post_content && <p className="text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2 mb-2">{flag.post_content}</p>}
                                <p className="text-xs text-gray-500">{meta.help}</p>
                                {flag.resolved_note && <p className="text-xs text-gray-500 mt-1">Note: {flag.resolved_note}</p>}
                                <div className="mt-auto pt-3 flex items-center gap-3">
                                    {state === "open" ? (
                                        <button disabled={busyId === flag.id} onClick={() => act(flag, "resolve")} className="min-h-[40px] px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                                            {busyId === flag.id ? "Saving…" : "Mark handled"}
                                        </button>
                                    ) : (
                                        <button disabled={busyId === flag.id} onClick={() => act(flag, "reopen")} className="min-h-[40px] px-4 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">
                                            Reopen
                                        </button>
                                    )}
                                    <span className="text-[11px] text-gray-400">comment #{flag.comment_id} · post #{flag.post_id}</span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
