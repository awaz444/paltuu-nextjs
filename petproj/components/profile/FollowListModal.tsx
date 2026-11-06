"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/community/Avatar";
import Modal from "@/components/community/Modal";
import { useProfile } from "./ProfileProvider";

type Person = {
    user_id: number;
    name: string | null;
    social_username: string | null;
    profile_image_url: string | null;
    verified: boolean | null;
    bio: string | null;
    is_private: boolean | null;
    is_followed_by_me: boolean;
    has_pending_request: boolean;
    is_blocked_by_me: boolean;
    is_blocking_me: boolean;
};

export default function FollowListModal({ kind, onClose }: { kind: "followers" | "following" | null; onClose: () => void }) {
    const { profile, viewer, refresh } = useProfile();
    const { isAuthenticated, user } = useAuth();
    const [people, setPeople] = useState<Person[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const myId = Number(user?.id ?? user?.user_id ?? 0);

    const load = useCallback(
        async (next: string | null) => {
            if (!kind) return;
            setLoading(true);
            setError(false);
            try {
                const qs = new URLSearchParams({ limit: "30", ...(next ? { cursor: next } : {}) });
                const res = await fetch(`/api/v1/social/users/${profile.id}/${kind}?${qs}`, { credentials: "include" });
                if (!res.ok) throw new Error();
                const data = await res.json();
                const rows: Person[] = data[kind] ?? [];
                setPeople((prev) => (next ? [...prev, ...rows] : rows));
                setCursor(data.next_cursor ?? null);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        },
        [kind, profile.id]
    );

    useEffect(() => {
        if (!kind) return;
        setPeople([]);
        setCursor(null);
        load(null);
    }, [kind, load]);

    const toggleFollow = async (person: Person) => {
        const res = await fetch(`/api/v1/social/follow/${person.user_id}`, { method: "POST", credentials: "include" });
        if (!res.ok) return toast.error("Could not update. Please try again.");
        const data = await res.json();
        setPeople((prev) =>
            prev.map((p) =>
                p.user_id === person.user_id ? { ...p, is_followed_by_me: Boolean(data.following), has_pending_request: data.status === "pending" } : p
            )
        );
        refresh();
    };

    const removeFollower = async (person: Person) => {
        if (!window.confirm(`Remove ${person.name || "this follower"}? They won't be told.`)) return;
        const res = await fetch(`/api/v1/social/users/${profile.id}/followers?followerId=${person.user_id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) return toast.error("Could not remove this follower.");
        setPeople((prev) => prev.filter((p) => p.user_id !== person.user_id));
        refresh();
    };

    const title = kind === "followers" ? "Followers" : "Following";

    return (
        <Modal open={Boolean(kind)} onClose={onClose} label={title}>
            <div className="max-h-[80vh] overflow-y-auto px-4 pb-4 pt-12 sm:px-6">
                <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
                {error && <p className="py-6 text-center text-sm text-gray-500">Couldn&apos;t load this list. Please try again.</p>}
                {!error && !loading && people.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500">
                        {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
                    </p>
                )}
                <ul className="divide-y divide-gray-100">
                    {people.map((p) => (
                        <li key={p.user_id} className="flex items-center gap-3 py-2.5">
                            <Link href={`/profile/${p.user_id}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                                <Avatar src={p.profile_image_url} name={p.name || p.social_username || "Paltuu member"} size={40} />
                                <span className="min-w-0">
                                    <span className="flex items-center gap-1 truncate text-sm font-semibold text-gray-900">
                                        <span className="truncate">{p.name || p.social_username || "Paltuu member"}</span>
                                        {p.verified && <BadgeCheck size={14} className="shrink-0 text-primary" aria-label="Verified" />}
                                    </span>
                                    {p.social_username && <span className="block truncate text-xs text-gray-500">@{p.social_username}</span>}
                                </span>
                            </Link>
                            {kind === "followers" && viewer.isOwn ? (
                                <button type="button" onClick={() => removeFollower(p)} className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                    Remove
                                </button>
                            ) : (
                                isAuthenticated &&
                                p.user_id !== myId &&
                                !p.is_blocked_by_me &&
                                !p.is_blocking_me && (
                                    <button
                                        type="button"
                                        onClick={() => toggleFollow(p)}
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                            p.is_followed_by_me || p.has_pending_request
                                                ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                : "bg-primary text-white hover:opacity-90"
                                        }`}
                                    >
                                        {p.is_followed_by_me ? "Following" : p.has_pending_request ? "Requested" : "Follow"}
                                    </button>
                                )
                            )}
                        </li>
                    ))}
                </ul>
                {loading && <p className="py-4 text-center text-sm text-gray-400">Loading…</p>}
                {!loading && cursor && (
                    <button type="button" onClick={() => load(cursor)} className="mt-2 w-full rounded-full border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Show more
                    </button>
                )}
            </div>
        </Modal>
    );
}
