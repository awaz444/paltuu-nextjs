"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/Link";
import { useRouter } from "next/navigation";
import { ChevronDown, ImagePlus, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { compressImageFiles } from "@/utils/imageCompression";
import { PK_ONLY } from "@/lib/site";
import ForumIcon from "./ForumIcon";
import Modal from "./Modal";
import { useMentionPicker } from "./useMentionPicker";

const MAX_CHARS = 2000;
const MAX_PHOTOS = 4;

/** Same wording lib/community.ts uses to place a post in the Adopt community. */
const ADOPT_WORDS = /\b(adopt\w*|rehom\w*|foster\w*)\b|forever home/i;

export type ComposerTopic = { slug: string; name: string; pkOnly?: boolean };
export type ComposerSpecies = { species: string; speciesName: string; breeds: { slug: string; name: string }[] };

/** A community a post can be tagged in: "adoption", "cats" or "cats/persian". */
type Community = { value: string; label: string; icon: string; pkOnly?: boolean };

function Face({ src, size = 40 }: { src: string | null | undefined; size?: number }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src || "/no-profile/no-profile.jpg"}
            alt=""
            aria-hidden
            width={size}
            height={size}
            className="shrink-0 rounded-full bg-gray-100 object-cover"
            style={{ width: size, height: size }}
        />
    );
}

function CommunityPicker({
    open,
    onClose,
    topics,
    species,
    selected,
    onSelect,
}: {
    open: boolean;
    onClose: () => void;
    topics: ComposerTopic[];
    species: ComposerSpecies[];
    selected: Community | null;
    onSelect: (c: Community | null) => void;
}) {
    const [query, setQuery] = useState("");
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setQuery("");
            setTimeout(() => input.current?.focus(), 0);
        }
    }, [open]);

    const q = query.trim().toLowerCase();
    const matches = (label: string) => !q || label.toLowerCase().includes(q);

    const topicOptions: Community[] = topics
        .map((t) => ({ value: t.slug, label: t.name, icon: t.slug, pkOnly: t.pkOnly }))
        .filter((c) => matches(c.label));

    const speciesGroups = species
        .map((s) => {
            const head: Community = { value: s.species, label: s.speciesName, icon: s.species };
            const breeds: Community[] = s.breeds
                .map((b) => ({ value: `${s.species}/${b.slug}`, label: `${s.speciesName} › ${b.name}`, icon: `${s.species}/${b.slug}` }))
                .filter((c) => matches(c.label));
            return { head, breeds, show: matches(head.label) || breeds.length > 0 };
        })
        .filter((g) => g.show);

    const pick = (c: Community | null) => {
        onSelect(c);
        onClose();
    };

    const row = (c: Community, indent = false) => (
        <li key={c.value} className={c.pkOnly ? PK_ONLY : undefined}>
            <button
                type="button"
                onClick={() => pick(c)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                    indent ? "pl-11" : ""
                } ${selected?.value === c.value ? "bg-primary/10 font-semibold text-primary" : "text-gray-800"}`}
            >
                {!indent && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-base">
                        <ForumIcon speciesSlug={c.icon} size={28} />
                    </span>
                )}
                <span className="truncate">{indent ? c.label.split(" › ")[1] : c.label}</span>
            </button>
        </li>
    );

    return (
        <Modal open={open} onClose={onClose} label="Choose a community" fullScreenOnMobile>
            <div className="flex max-h-full flex-col sm:max-h-[75vh]">
                {/* Modal's close button sits top left: the title starts beside it. */}
                <div className="px-4 pb-3 pt-3.5">
                    <h2 className="pl-9 text-lg font-bold text-gray-900">Post in a community</h2>
                    <p className="mt-0.5 pl-9 text-sm text-gray-500">Optional. Pick one so the right people see it.</p>
                    <label className="mt-3 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-primary">
                        <Search className="h-4 w-4 text-gray-400" aria-hidden />
                        <input
                            ref={input}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search, e.g. Persian, Lost & Found"
                            className="w-full border-0 bg-transparent p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                        />
                    </label>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    <ul>
                        {!q && (
                            <li>
                                <button
                                    type="button"
                                    onClick={() => pick(null)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                                        !selected ? "bg-primary/10 font-semibold text-primary" : "text-gray-800"
                                    }`}
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base" aria-hidden>
                                        🐾
                                    </span>
                                    No community, just my feed
                                </button>
                            </li>
                        )}
                        {topicOptions.map((c) => row(c))}
                    </ul>
                    {speciesGroups.map((g) => (
                        <ul key={g.head.value} className="mt-2 border-t border-gray-100 pt-2">
                            {row(g.head)}
                            {g.breeds.map((b) => row(b, true))}
                        </ul>
                    ))}
                    {q && topicOptions.length === 0 && speciesGroups.length === 0 && (
                        <p className="px-3 py-6 text-center text-sm text-gray-500">No community called “{query.trim()}”.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
}

/** Points people giving a pet away (or looking for one) at the Adopt section, which is built for it. */
function AdoptTip({ onDismiss, onTagAdopt }: { onDismiss: () => void; onTagAdopt?: () => void }) {
    return (
        <div role="note" className="relative mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3 pr-9 text-sm text-gray-800">
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Hide tip"
                className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-white hover:text-gray-700"
            >
                <X className="h-4 w-4" aria-hidden />
            </button>
            <p className="font-semibold text-gray-900">Finding a home for a pet?</p>
            <p className="mt-0.5 text-gray-600">
                Paltuu has a whole Adopt section for this. Adopters browse it by city, breed and age, so a listing there gives your pet a much
                better chance of being adopted. You can still post here too.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link href="/create-listing" className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white">
                    List for adoption
                </Link>
                <Link href="/browse-pets" className="rounded-full border border-primary px-3 py-1.5 text-xs font-bold text-primary">
                    Looking to adopt? Browse pets
                </Link>
                {onTagAdopt && (
                    <button type="button" onClick={onTagAdopt} className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
                        Tag this post in Adopt
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Create-post box at the top of the home feed (PALTU-167), like the composer
 * above the timeline on x.com. A normal post by default, optionally tagged in
 * one community (Adopt, Lost & Found, a species or a breed). Signed-out
 * visitors are sent to sign in when they start typing.
 */
export default function CreatePostBox({ topics, species }: { topics: ComposerTopic[]; species: ComposerSpecies[] }) {
    const { user, isAuthenticated, isHydrating } = useAuth();
    const router = useRouter();
    const [text, setText] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [community, setCommunity] = useState<Community | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [tipHidden, setTipHidden] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [posted, setPosted] = useState(false);
    const box = useRef<HTMLTextAreaElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const mentions = useMentionPicker(box, text, setText);

    const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
    useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

    // Grow with the text instead of scrolling inside a small box.
    useEffect(() => {
        const el = box.current;
        if (!el) return;
        el.style.height = "";
        // Empty: keep the two rows. Measuring then can catch the box before it
        // has its width, when the placeholder wraps letter by letter.
        if (!text) return;
        el.style.height = `${Math.min(Math.max(el.scrollHeight, 48), 320)}px`;
    }, [text]);

    const signedOut = !isHydrating && !isAuthenticated;
    const goSignIn = () => {
        window.location.href = `/auth?callbackUrl=${encodeURIComponent(window.location.pathname || "/home")}`;
    };

    const trimmed = text.trim();
    const over = text.length > MAX_CHARS;
    const canSend = (trimmed.length > 0 || photos.length > 0) && !over && !sending;
    const showAdoptTip = !tipHidden && ADOPT_WORDS.test(text);

    const addPhotos = (files: FileList | null) => {
        if (!files) return;
        const images = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type === "");
        if (images.length < files.length) setError("Only photos can be added here for now.");
        else setError(null);
        setPhotos((prev) => [...prev, ...images].slice(0, MAX_PHOTOS));
    };

    const uploadPhotos = async () => {
        const compressed = await compressImageFiles(photos);
        const media: { media_type: string; url: string; thumbnail_url: string | null }[] = [];
        // One photo per request keeps each body well under Vercel's 4.5 MB limit.
        for (const file of compressed) {
            const form = new FormData();
            form.append("files", file);
            const res = await fetch("/api/v1/social/upload", { method: "POST", credentials: "include", body: form });
            if (res.status === 401) throw new Error("signin");
            if (!res.ok) throw new Error("Couldn't upload a photo. Please try again.");
            const body = await res.json();
            for (const m of body.media ?? []) media.push({ media_type: "image", url: m.url, thumbnail_url: m.thumbnail_url ?? null });
        }
        return media;
    };

    const send = async () => {
        if (signedOut) return goSignIn();
        if (!canSend) return;
        setSending(true);
        setError(null);
        try {
            const media = photos.length ? await uploadPhotos() : [];
            const res = await fetch("/api/v1/social/posts", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    post_type: media.length ? "image" : "text",
                    content: mentions.encode(trimmed),
                    media,
                    ...(community ? { forum: community.value } : {}),
                }),
            });
            if (res.status === 401) return goSignIn();
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error || "Couldn't post. Please try again.");
                return;
            }
            setText("");
            mentions.reset();
            setPhotos([]);
            setCommunity(null);
            setTipHidden(false);
            setPosted(true);
            setTimeout(() => setPosted(false), 4000);
            router.refresh();
        } catch (e) {
            if (e instanceof Error && e.message === "signin") return goSignIn();
            setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Couldn't post. Check your connection and try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <section aria-label="Create a post" className="-mx-4 mb-3 border-y border-gray-200 bg-white px-4 py-3 sm:mx-0 sm:rounded-2xl sm:border">
            <div className="flex gap-3">
                <Face src={user?.profile_image_url} />
                <div className="min-w-0 flex-1">
                    <textarea
                        ref={box}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            mentions.check();
                        }}
                        onSelect={mentions.check}
                        onFocus={() => signedOut && goSignIn()}
                        onKeyDown={(e) => {
                            if (mentions.onKeyDown(e)) return;
                            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
                        }}
                        placeholder="What's your pet up to?"
                        aria-label="Write a post"
                        rows={2}
                        className="block min-h-[48px] w-full resize-none border-0 bg-transparent p-0 pt-2 text-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
                    />
                    {mentions.menu}

                    {previews.length > 0 && (
                        <div className={`mt-2 grid gap-2 ${previews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                            {previews.map((src, i) => (
                                <div key={src} className="relative overflow-hidden rounded-xl bg-gray-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="" className={`w-full object-cover ${previews.length === 1 ? "max-h-80" : "aspect-square"}`} />
                                    <button
                                        type="button"
                                        onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                                        aria-label="Remove photo"
                                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                                    >
                                        <X className="h-4 w-4" aria-hidden />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {showAdoptTip && (
                        <AdoptTip
                            onDismiss={() => setTipHidden(true)}
                            onTagAdopt={
                                community?.value === "adoption" || !topics.some((t) => t.slug === "adoption")
                                    ? undefined
                                    : () => setCommunity({ value: "adoption", label: "Adopt", icon: "adoption" })
                            }
                        />
                    )}

                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    {posted && <p className="mt-2 text-sm font-medium text-green-700">Posted. It&apos;s in the feed now.</p>}

                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                        <div className="flex min-w-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={() => (signedOut ? goSignIn() : fileInput.current?.click())}
                                disabled={photos.length >= MAX_PHOTOS || sending}
                                aria-label="Add photos"
                                title="Add photos"
                                className="shrink-0 rounded-full p-2 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
                            >
                                <ImagePlus className="h-5 w-5" aria-hidden />
                            </button>
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={(e) => {
                                    addPhotos(e.target.files);
                                    e.target.value = "";
                                }}
                            />
                            {community ? (
                                <span className="flex min-w-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/5 py-1 pl-2 pr-1 text-sm font-semibold text-primary">
                                    <button type="button" onClick={() => setPickerOpen(true)} className="flex min-w-0 items-center gap-1.5">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs">
                                            <ForumIcon speciesSlug={community.icon} size={20} />
                                        </span>
                                        <span className="truncate">{community.label}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCommunity(null)}
                                        aria-label={`Remove ${community.label}`}
                                        className="shrink-0 rounded-full p-0.5 hover:bg-primary/10"
                                    >
                                        <X className="h-3.5 w-3.5" aria-hidden />
                                    </button>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => (signedOut ? goSignIn() : setPickerOpen(true))}
                                    className="flex min-w-0 items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary"
                                >
                                    <span className="truncate">
                                        <span className="hidden sm:inline">Choose c</span>
                                        <span className="sm:hidden">C</span>ommunity
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                                </button>
                            )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            {text.length > MAX_CHARS - 200 && (
                                <span className={`text-xs ${over ? "font-semibold text-red-600" : "text-gray-400"}`}>{MAX_CHARS - text.length}</span>
                            )}
                            <button
                                type="button"
                                onClick={send}
                                disabled={!signedOut && !canSend}
                                className="rounded-full bg-primary px-5 py-1.5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
                            >
                                {sending ? "Posting…" : "Post"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CommunityPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                topics={topics}
                species={species}
                selected={community}
                onSelect={setCommunity}
            />
        </section>
    );
}
