"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, Heart, Lock, MessageCircle, PawPrint } from "lucide-react";
import AccountPanel from "./AccountPanel";
import { useProfile, type ApiPost } from "./ProfileProvider";

function Empty({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/features/paws.jpg" alt="" aria-hidden width={80} height={80} className="mx-auto mb-3 h-20 w-20" />
            <h2 className="mb-1 text-base font-bold text-gray-900">{title}</h2>
            {body && <p className="mx-auto max-w-sm text-sm text-gray-500">{body}</p>}
            {children}
        </div>
    );
}

const ago = (date: string | null | undefined) => (date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : "");

/** One post, or a thing done to a post, in a client-loaded list. Private accounts' posts have no public page to open. */
function Row({ postId, text, thumb, meta, linkable = true }: { postId?: number; text: string | null; thumb?: string | null; meta?: ReactNode; linkable?: boolean }) {
    const body = (
        <div className="flex gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
                {meta && <p className="mb-0.5 text-xs text-gray-500">{meta}</p>}
                <p className="line-clamp-3 whitespace-pre-line break-words text-sm text-gray-800">{text?.trim() || "Photo"}</p>
            </div>
            {thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            )}
        </div>
    );
    return linkable && postId ? (
        <Link href={`/p/${postId}`} className="block transition-colors hover:bg-gray-50">
            {body}
        </Link>
    ) : (
        body
    );
}

const listBox = "-mx-4 divide-y divide-gray-200 border-y border-gray-200 bg-white sm:mx-0 sm:overflow-hidden sm:rounded-2xl sm:border";

function firstThumb(media: ApiPost["media"]): string | null {
    const m = media?.[0];
    if (!m) return null;
    return m.thumbnail_url || (m.media_type === "video" ? null : m.url) || null;
}

/** Fetch one page-shaped endpoint the first time its tab opens. */
function useCursorList<T>(url: string | null, pick: (data: any) => T[]) {
    const [items, setItems] = useState<T[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const load = useCallback(
        async (next: string | null) => {
            if (!url) return;
            setLoading(true);
            setError(false);
            try {
                const joiner = url.includes("?") ? "&" : "?";
                const res = await fetch(next ? `${url}${joiner}cursor=${encodeURIComponent(next)}` : url, { credentials: "include" });
                if (!res.ok) throw new Error();
                const data = await res.json();
                const rows = pick(data);
                setItems((prev) => (next ? [...prev, ...rows] : rows));
                setCursor(data.next_cursor ?? null);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        },
        // pick is a stable inline mapper for this url
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [url]
    );

    useEffect(() => {
        setItems([]);
        setCursor(null);
        load(null);
    }, [load]);

    return { items, cursor, loading, error, more: () => load(cursor) };
}

function ListFooter({ loading, error, cursor, more }: { loading: boolean; error: boolean; cursor: string | null; more: () => void }) {
    return (
        <>
            {loading && <p className="py-6 text-center text-sm text-gray-400">Loading…</p>}
            {error && <p className="py-6 text-center text-sm text-gray-500">Couldn&apos;t load this. Please try again.</p>}
            {!loading && cursor && (
                <button type="button" onClick={more} className="mt-3 w-full rounded-full border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Show more
                </button>
            )}
        </>
    );
}

type PetProfile = { pet_profile_id: number; name: string; species: string; breed: string | null; gender: string | null; age: unknown; bio: string | null; avatar_url: string | null; adoption_listing_id: number | null; is_listed_for_adoption: boolean };

function ageLabel(age: unknown): string | null {
    if (!age) return null;
    if (typeof age === "string") return age;
    if (typeof age === "object") {
        const a = age as { years?: number; months?: number; display?: string; label?: string };
        if (a.display || a.label) return (a.display || a.label) as string;
        if (a.years) return `${a.years} yr${a.years === 1 ? "" : "s"}`;
        if (a.months) return `${a.months} mo`;
    }
    return null;
}

function PetsTab() {
    const { profile, viewer } = useProfile();
    const { items, loading, error } = useCursorList<PetProfile>(`/api/v1/users/${profile.id}/pet-profiles`, (d) => d.pets ?? []);
    if (!loading && !error && items.length === 0) {
        return <Empty title="No pets yet" body={viewer.isOwn ? "Add your pet's profile in the Paltuu app." : `${profile.name} hasn't added a pet.`} />;
    }
    return (
        <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((p) => {
                    const card = (
                        <>
                            {p.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.avatar_url} alt={p.name} className="aspect-square w-full object-cover" />
                            ) : (
                                <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
                                    <PawPrint size={32} />
                                </div>
                            )}
                            <div className="p-3">
                                <p className="truncate text-sm font-bold text-gray-900">{p.name}</p>
                                <p className="truncate text-xs text-gray-500">{[p.breed || p.species, ageLabel(p.age)].filter(Boolean).join(" · ")}</p>
                                {p.is_listed_for_adoption && <p className="mt-1 text-xs font-semibold text-primary">Up for adoption</p>}
                            </div>
                        </>
                    );
                    const cls = "block overflow-hidden rounded-2xl border border-gray-200 bg-white";
                    return p.is_listed_for_adoption && p.adoption_listing_id ? (
                        <Link key={p.pet_profile_id} href={`/browse-pets/${p.adoption_listing_id}`} className={`${cls} transition-colors hover:border-primary`}>
                            {card}
                        </Link>
                    ) : (
                        <div key={p.pet_profile_id} className={cls}>
                            {card}
                        </div>
                    );
                })}
            </div>
            <ListFooter loading={loading} error={error} cursor={null} more={() => {}} />
        </>
    );
}

type Listing = { pet_id: number; pet_name: string; pet_breed: string | null; adoption_status: string | null; main_image: string | null };

function ListingsTab() {
    const { profile, viewer } = useProfile();
    const { items, loading, error } = useCursorList<Listing>(`/api/v1/social/profile/${profile.id}/pets`, (d) => d.pets ?? []);
    const shown = viewer.isOwn ? items : items.filter((l) => l.adoption_status === "available");
    return (
        <>
            {viewer.isOwn && (
                <div className="mb-3 flex flex-wrap gap-2">
                    <Link href="/create-listing" className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white">List a pet</Link>
                    <Link href="/my-listings" className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700">Manage listings</Link>
                    <Link href="/adoption-applicants" className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700">Adoption requests</Link>
                </div>
            )}
            {!loading && !error && shown.length === 0 ? (
                <Empty title="No pets listed" body={viewer.isOwn ? "Pets you list for adoption show up here." : `${profile.name} has no pets up for adoption right now.`} />
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {shown.map((l) => (
                        <Link key={l.pet_id} href={`/browse-pets/${l.pet_id}`} className="block overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-primary">
                            {l.main_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={l.main_image} alt={l.pet_name} className="aspect-square w-full object-cover" />
                            ) : (
                                <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
                                    <PawPrint size={32} />
                                </div>
                            )}
                            <div className="p-3">
                                <p className="truncate text-sm font-bold text-gray-900">{l.pet_name}</p>
                                <p className="truncate text-xs text-gray-500">{l.pet_breed || " "}</p>
                                {viewer.isOwn && l.adoption_status && l.adoption_status !== "available" && (
                                    <p className="mt-1 text-xs font-medium capitalize text-gray-500">{l.adoption_status}</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            <ListFooter loading={loading} error={error} cursor={null} more={() => {}} />
        </>
    );
}

function SavedTab() {
    const { items, cursor, loading, error, more } = useCursorList<any>("/api/v1/users/me/saved?limit=20", (d) => d.posts ?? []);
    if (!loading && !error && items.length === 0) return <Empty title="Nothing saved yet" body="Posts you save in the Paltuu app show up here." />;
    return (
        <>
            {items.length > 0 && (
                <div className={listBox}>
                    {items.map((p) => (
                        <Row
                            key={p.save_id}
                            postId={Number(p.post_id)}
                            text={p.content}
                            thumb={firstThumb(p.media)}
                            meta={
                                <>
                                    <Bookmark size={11} className="mr-1 inline" />
                                    {p.author_name || "Paltuu member"}
                                </>
                            }
                        />
                    ))}
                </div>
            )}
            <ListFooter loading={loading} error={error} cursor={cursor} more={more} />
        </>
    );
}

const ACTIVITY = [
    { key: "likes", label: "Likes", empty: "Posts you like show up here." },
    { key: "comments", label: "Comments", empty: "Your comments show up here." },
    { key: "tags", label: "Tags", empty: "Times you've been tagged show up here." },
    { key: "recently-deleted", label: "Recently deleted", empty: "Posts and comments you delete show up here for a while." },
] as const;

function ActivityList({ kind }: { kind: (typeof ACTIVITY)[number]["key"] }) {
    const { items, cursor, loading, error, more } = useCursorList<any>(`/api/v1/users/me/activity/${kind}?limit=20`, (d) => d.items ?? []);
    const config = ACTIVITY.find((a) => a.key === kind)!;
    if (!loading && !error && items.length === 0) return <Empty title={`No ${config.label.toLowerCase()}`} body={config.empty} />;
    return (
        <>
            {items.length > 0 && (
                <div className={listBox}>
                    {items.map((item, i) => (
                        <Row
                            key={item.like_id ?? item.comment_id ?? item.mention_id ?? item.archive_id ?? i}
                            postId={kind === "recently-deleted" ? undefined : Number(item.post_id)}
                            linkable={kind !== "recently-deleted"}
                            text={item.preview_text ?? item.post_preview_text}
                            thumb={item.thumbnail_url}
                            meta={
                                <>
                                    {kind === "likes" && <Heart size={11} className="mr-1 inline" />}
                                    {kind === "comments" && <MessageCircle size={11} className="mr-1 inline" />}
                                    {item.actor?.name || item.post_author?.name ? `${item.actor?.name || item.post_author?.name} · ` : ""}
                                    {ago(item.created_at)}
                                </>
                            }
                        />
                    ))}
                </div>
            )}
            <ListFooter loading={loading} error={error} cursor={cursor} more={more} />
        </>
    );
}

function ActivityTab() {
    const [kind, setKind] = useState<(typeof ACTIVITY)[number]["key"]>("likes");
    return (
        <>
            <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                {ACTIVITY.map((a) => (
                    <button
                        key={a.key}
                        type="button"
                        onClick={() => setKind(a.key)}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                            kind === a.key ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700"
                        }`}
                    >
                        {a.label}
                    </button>
                ))}
            </div>
            <ActivityList key={kind} kind={kind} />
        </>
    );
}

export default function ProfileTabs({ publicPosts }: { publicPosts: ReactNode }) {
    const { profile, viewer, tab, setTab } = useProfile();

    const tabs = [
        { key: "posts", label: "Posts" },
        { key: "pets", label: "Pets" },
        { key: "listings", label: "Listings" },
        ...(viewer.isOwn
            ? [
                  { key: "saved", label: "Saved" },
                  { key: "activity", label: "Activity" },
                  { key: "account", label: "Account" },
              ]
            : []),
    ];
    // A link to someone else's ?tab=account just shows their posts.
    const active = tabs.some((t) => t.key === tab) ? tab : "posts";
    const tabBar = useRef<HTMLElement>(null);

    // On phones the row scrolls sideways, so keep the open tab in view.
    useEffect(() => {
        tabBar.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: "center", block: "nearest" });
    }, [active]);

    if (viewer.locked) {
        const blocked = viewer.blockedByMe || viewer.blockingMe;
        return (
            <Empty
                title={blocked ? "This profile isn't available" : "This account is private"}
                body={blocked ? undefined : `Follow ${profile.name} to see their posts and pets.`}
            >
                {!blocked && <Lock size={18} className="mx-auto mt-3 text-gray-400" aria-hidden />}
            </Empty>
        );
    }

    // Private accounts have no cached public feed: followers and the owner get theirs from the API.
    const clientPosts = viewer.posts.filter((p) => !(p.is_repost && !p.content));

    return (
        <div>
            <nav ref={tabBar} aria-label="Profile sections" className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 px-4 sm:mx-0 sm:px-0">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        aria-current={active === t.key ? "page" : undefined}
                        className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                            active === t.key ? "border-primary text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </nav>

            {active === "posts" &&
                (profile.isPrivate ? (
                    clientPosts.length === 0 ? (
                        <Empty title="No posts yet" />
                    ) : (
                        <div className={listBox}>
                            {clientPosts.map((p) => (
                                <Row key={p.post_id} text={p.content} thumb={firstThumb(p.media)} meta={ago(p.created_at)} linkable={false} />
                            ))}
                        </div>
                    )
                ) : (
                    publicPosts
                ))}
            {active === "pets" && <PetsTab />}
            {active === "listings" && <ListingsTab />}
            {active === "saved" && <SavedTab />}
            {active === "activity" && <ActivityTab />}
            {active === "account" && <AccountPanel />}
        </div>
    );
}
