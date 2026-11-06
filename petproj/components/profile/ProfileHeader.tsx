"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { BadgeCheck, CalendarDays, Lock, MoreHorizontal, Pencil, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "@/components/community/Avatar";
import GetAppModal from "@/components/community/GetAppModal";
import LinkifiedText from "@/components/community/LinkifiedText";
import Modal from "@/components/community/Modal";
import FollowListModal from "./FollowListModal";
import { useProfile } from "./ProfileProvider";

// Pakistani mobile numbers, the usual way people write them in a bio.
const PHONE_RE = /(?:\+?92[\s-]?|0)3\d{2}[\s-]?\d{7}/g;

/** Bio text with links and phone numbers tappable: "see my profile for the number" should end in a call. */
function BioText({ text }: { text: string }) {
    const parts: ReactNode[] = [];
    let last = 0;
    for (const match of Array.from(text.matchAll(PHONE_RE))) {
        const at = match.index ?? 0;
        if (at > last) parts.push(<LinkifiedText key={`t${at}`} text={text.slice(last, at)} />);
        parts.push(
            <a key={`p${at}`} href={`tel:${match[0].replace(/[\s-]/g, "")}`} className="font-medium text-primary hover:underline">
                {match[0]}
            </a>
        );
        last = at + match[0].length;
    }
    if (last < text.length) parts.push(<LinkifiedText key="end" text={text.slice(last)} />);
    return <Fragment>{parts}</Fragment>;
}

// Mirrors REPORT_REASONS in lib/moderation.ts, which imports the database and can't load in the browser.
const REPORT_REASONS = [
    { code: "SPAM", label: "Spam" },
    { code: "HATE_SPEECH", label: "Hate speech or symbols" },
    { code: "HARASSMENT", label: "Bullying or harassment" },
    { code: "ANIMAL_ABUSE", label: "Animal abuse" },
    { code: "MISINFORMATION", label: "False information" },
    { code: "INAPPROPRIATE", label: "Inappropriate content" },
    { code: "SCAM", label: "Scam or fraud" },
    { code: "OTHER", label: "Other" },
];

const outlineButton =
    "rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-60";

export default function ProfileHeader() {
    const { profile, viewer, isSignedIn, refresh, setTab } = useProfile();
    const [list, setList] = useState<"followers" | "following" | null>(null);
    const [busy, setBusy] = useState(false);
    const [prompt, setPrompt] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportNote, setReportNote] = useState("");
    const [reportReason, setReportReason] = useState("SPAM");
    const menuRef = useRef<HTMLDivElement>(null);
    const path = `/profile/${profile.id}`;

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [menuOpen]);

    const act = async (url: string, init: RequestInit, done?: string) => {
        setBusy(true);
        try {
            const res = await fetch(url, { credentials: "include", ...init });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error || "Something went wrong");
            }
            if (done) toast.success(done);
            await refresh();
            return true;
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Something went wrong");
            return false;
        } finally {
            setBusy(false);
        }
    };

    const needsSignIn = () => {
        if (isSignedIn) return false;
        setPrompt(true);
        return true;
    };

    const toggleFollow = () => {
        if (needsSignIn()) return;
        act(`/api/v1/social/follow/${profile.id}`, { method: "POST" });
    };

    const block = () => {
        setMenuOpen(false);
        if (needsSignIn()) return;
        if (!window.confirm(`Block ${profile.name}? They won't be able to see your profile or posts.`)) return;
        act(`/api/v1/users/${profile.id}/block`, { method: "POST" }, "User blocked");
    };

    const submitReport = async () => {
        const ok = await act(
            `/api/v1/users/${profile.id}/report`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason_code: reportReason, additional_note: reportNote.trim() || undefined }),
            },
            "Thanks, we'll take a look"
        );
        if (ok) {
            setReportOpen(false);
            setReportNote("");
        }
    };

    const share = async () => {
        const url = `${window.location.origin}${path}`;
        try {
            if (navigator.share) await navigator.share({ title: `${profile.name} on Paltuu`, url });
            else {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied");
            }
        } catch {
            // Closing the share sheet isn't an error.
        }
    };

    const followLabel = viewer.isFollowing ? "Following" : viewer.isPending ? "Requested" : profile.isPrivate ? "Request to follow" : "Follow";
    const hiddenByBlock = viewer.blockedByMe || viewer.blockingMe;

    const stat = (value: number, label: string, onClick?: () => void) => {
        const inner = (
            <>
                <span className="font-bold text-gray-900">{value.toLocaleString()}</span>{" "}
                <span className="text-gray-500">{label}</span>
            </>
        );
        return onClick ? (
            <button type="button" onClick={onClick} className="text-sm hover:underline">
                {inner}
            </button>
        ) : (
            <span className="text-sm">{inner}</span>
        );
    };

    return (
        <header className="border-b border-gray-200 bg-white">
            {/* Starts 1rem up on desktop, behind the navbar's rounded corners, like the forum banner. */}
            <div className="relative h-28 w-full overflow-hidden bg-primary md:-mt-4 md:h-44">
                {profile.cover && !profile.suspended && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.cover} alt="" className="h-full w-full object-cover" />
                )}
            </div>

            <div className="mx-auto max-w-3xl px-4 pb-4">
                <div className="flex items-end justify-between gap-3">
                    <div className="relative z-10 -mt-10 shrink-0 rounded-full border-4 border-white bg-white md:-mt-14">
                        <Avatar src={profile.suspended ? null : profile.avatar} name={profile.name} size={96} />
                    </div>

                    {!profile.suspended && (
                        <div className="flex items-center gap-2 pt-3">
                            <button type="button" onClick={share} aria-label="Share profile" className="rounded-full border border-gray-300 p-2 text-gray-700 hover:bg-gray-50">
                                <Share2 size={16} />
                            </button>
                            {/* Who's looking isn't known until the viewer loads: don't flash Follow at the profile's owner. */}
                            {!viewer.loaded ? (
                                <span aria-hidden className="h-8 w-24 animate-pulse rounded-full bg-gray-100" />
                            ) : viewer.isOwn ? (
                                <button type="button" onClick={() => setTab("account")} className={`${outlineButton} inline-flex items-center gap-1.5`}>
                                    <Pencil size={14} /> Edit profile
                                </button>
                            ) : viewer.blockedByMe ? (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => act(`/api/v1/users/${profile.id}/block`, { method: "DELETE" }, "User unblocked")}
                                    className={outlineButton}
                                >
                                    Unblock
                                </button>
                            ) : viewer.blockingMe ? null : (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={toggleFollow}
                                    className={
                                        viewer.isFollowing || viewer.isPending
                                            ? outlineButton
                                            : "rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                    }
                                >
                                    {followLabel}
                                </button>
                            )}
                            {viewer.loaded && !viewer.isOwn && (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        type="button"
                                        aria-label="More options"
                                        aria-expanded={menuOpen}
                                        onClick={() => setMenuOpen((v) => !v)}
                                        className="rounded-full border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                    {menuOpen && (
                                        <div className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    if (!needsSignIn()) setReportOpen(true);
                                                }}
                                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Report
                                            </button>
                                            {!viewer.blockedByMe && (
                                                <button type="button" onClick={block} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">
                                                    Block
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-3">
                    <h1 className="flex flex-wrap items-center gap-1.5 text-xl font-extrabold text-gray-900 md:text-2xl">
                        <span className="break-words">{profile.name}</span>
                        {profile.verified && !profile.suspended && <BadgeCheck size={20} className="text-primary" aria-label="Verified" />}
                        {profile.isPrivate && !profile.suspended && <Lock size={16} className="text-gray-400" aria-label="Private account" />}
                    </h1>
                    {profile.username && <p className="text-sm text-gray-500">@{profile.username}</p>}
                </div>

                {profile.suspended ? (
                    <p className="mt-3 rounded-xl bg-gray-100 p-3 text-sm text-gray-700">
                        This account has been suspended for violating our Community Guidelines.
                    </p>
                ) : (
                    <>
                        {profile.bio && !hiddenByBlock && (
                            <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-gray-800">
                                <BioText text={profile.bio} />
                            </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                            {stat(profile.followerCount, profile.followerCount === 1 ? "Follower" : "Followers", viewer.locked ? undefined : () => setList("followers"))}
                            {stat(profile.followingCount, "Following", viewer.locked ? undefined : () => setList("following"))}
                            {stat(profile.postCount, profile.postCount === 1 ? "Post" : "Posts")}
                            {viewer.followsMe && !viewer.isOwn && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">Follows you</span>}
                        </div>
                        {profile.joinedAt && (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500">
                                <CalendarDays size={13} /> Joined {format(new Date(profile.joinedAt), "MMMM yyyy")}
                            </p>
                        )}
                    </>
                )}
            </div>

            <FollowListModal kind={list} onClose={() => setList(null)} />

            <GetAppModal
                open={prompt}
                onClose={() => setPrompt(false)}
                title={`Log in to follow ${profile.name}`}
                body="Use your Paltuu account, the same one as in the app. New here? Signing up is free."
                signInHref={`/auth?callbackUrl=${encodeURIComponent(path)}`}
            />

            <Modal open={reportOpen} onClose={() => setReportOpen(false)} label={`Report ${profile.name}`}>
                <div className="space-y-3 px-6 pb-6 pt-12">
                    <h2 className="text-lg font-bold text-gray-900">Report {profile.name}</h2>
                    <label className="block text-sm font-medium text-gray-700">
                        Reason
                        <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                            {REPORT_REASONS.map((r) => (
                                <option key={r.code} value={r.code}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Anything to add? (optional)
                        <textarea
                            value={reportNote}
                            onChange={(e) => setReportNote(e.target.value)}
                            rows={3}
                            maxLength={500}
                            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                    </label>
                    <button type="button" disabled={busy} onClick={submitReport} className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                        Send report
                    </button>
                </div>
            </Modal>
        </header>
    );
}
