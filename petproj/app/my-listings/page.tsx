"use client";

// My Listings (PALTU-141). Everything an owner needs on one page:
//   - "Waiting on you": every pending application across all listings, with
//     Approve / Decline right there, plus listings that need a check-in.
//   - Each listing card lists its own applicants, with the same buttons.
// Approve asks first (it marks the pet adopted and declines everyone else);
// Decline is one click. The full answers open in ApplicationReviewModal.
//
// Links: ?application=ID opens that application (notifications use this),
// ?pet=ID scrolls to that listing with its applicants open (emails use this,
// through the /adoption-applicants redirect).

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { Plus, Pencil, MoreHorizontal, MapPin, ChevronDown, ChevronRight, Inbox, PawPrint, Link2, ExternalLink, Users } from "lucide-react";
import type { Pet } from "@/components/MyListingGrid";
import { setListingAvailability } from "@/components/MyListingGrid";
import EditListingModal from "@/components/account/EditListingModal";
import ApplicationReviewModal, { appStatus, FitBadge, type OwnerApplication } from "@/components/account/ApplicationReviewModal";
import {
    AccountPage,
    SectionHeading,
    FilterTabs,
    Pill,
    LISTING_PILL,
    APPLICATION_PILL,
    EmptyState,
    Spinner,
    SignInPrompt,
    Avatar,
    ConfirmDialog,
    btn,
    cardClass,
} from "@/components/account/ui";
import { AppDispatch } from "@/app/store/store";
import { fetchAdoptionPets } from "@/app/store/slices/adoptionPetsSlice";
import { fetchFosterPets } from "@/app/store/slices/fosterPetsSlice";
import { useAuth } from "@/context/AuthContext";
import { authUrl } from "@/lib/authRedirect";
import { formatAge } from "@/utils/formatAge";
import { getListingStatus, ListingStatus, listingKindLabel, formatFee, formatShortDate } from "@/utils/listingDisplay";

type Tab = "all" | ListingStatus;
type SortKey = "newest" | "applications" | "name";

const ADOPTER_CHECKLIST = [
    ["A stable home", "A settled living situation that suits the pet."],
    ["Everyone on board", "The whole household agrees to the adoption."],
    ["Experience or research", "Has kept pets before or has done the reading."],
    ["Can cover costs", "Food, vet visits and supplies are affordable."],
    ["Regular vet care", "Will keep up with check-ups and vaccinations."],
    ["Time to give", "Has time each day to care for the pet."],
];

const petPhoto = (pet: Pet) => pet.primary_image || pet.image_url || "/dog-placeholder.png";
const STATUS_ORDER: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
const byStatusThenDate = (a: OwnerApplication, b: OwnerApplication) =>
    (STATUS_ORDER[appStatus(a)] ?? 3) - (STATUS_ORDER[appStatus(b)] ?? 3) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

function MyListings() {
    const { user, isAuthenticated, isHydrating } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const searchParams = useSearchParams();

    const [listings, setListings] = useState<Pet[] | null>(null);
    const [applications, setApplications] = useState<OwnerApplication[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [tab, setTab] = useState<Tab>("all");
    const [sort, setSort] = useState<SortKey>("newest");
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    const [reviewing, setReviewing] = useState<{ id: number; list: number[] } | null>(null);
    const [confirmApprove, setConfirmApprove] = useState<OwnerApplication | null>(null);
    const [deciding, setDeciding] = useState<number | null>(null);
    const [busyPet, setBusyPet] = useState<number | null>(null);
    const [editing, setEditing] = useState<Pet | null>(null);
    const [deleting, setDeleting] = useState<Pet | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const deepLinked = useRef(false);

    // ── Load ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isHydrating || !isAuthenticated || !user?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const [lRes, aRes] = await Promise.all([
                    fetch("/api/v1/profile/listings", { credentials: "include" }),
                    fetch("/api/v1/applications/my-pets", { credentials: "include" }),
                ]);
                if (!lRes.ok) throw new Error("Couldn't load your listings. Please try again.");
                const lData = await lRes.json();
                const aData = aRes.ok ? await aRes.json() : [];
                if (cancelled) return;
                setListings(lData.listings || []);
                setApplications(Array.isArray(aData) ? aData : []);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load your listings. Please try again.");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isHydrating, isAuthenticated, user?.id]);

    // ── Derived ─────────────────────────────────────────────────────────────
    const appsByPet = useMemo(() => {
        const m = new Map<number, OwnerApplication[]>();
        applications.forEach((a) => m.set(a.pet_id, [...(m.get(a.pet_id) ?? []), a]));
        m.forEach((list) => list.sort(byStatusThenDate));
        return m;
    }, [applications]);

    const petById = useMemo(() => new Map((listings ?? []).map((p) => [p.pet_id, p])), [listings]);
    const withStatus = useMemo(() => (listings ?? []).map((pet) => ({ pet, status: getListingStatus(pet) })), [listings]);

    const counts = useMemo(() => {
        const c: Record<Tab, number> = { all: withStatus.length, live: 0, review: 0, paused: 0, adopted: 0 };
        withStatus.forEach(({ status }) => (c[status] += 1));
        return c;
    }, [withStatus]);

    /** Pending applications on listings that are still open, oldest first: first come, first served. */
    const queue = useMemo(
        () =>
            applications
                .filter((a) => appStatus(a) === "pending")
                .filter((a) => {
                    const p = petById.get(a.pet_id);
                    return p && getListingStatus(p) !== "adopted";
                })
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        [applications, petById],
    );

    const checkIns = useMemo(
        () =>
            withStatus.filter(
                ({ pet, status }) => (status === "live" && pet.adoption_status === "available" && !!pet.availability_check_sent_at) || (status === "paused" && pet.approved),
            ),
        [withStatus],
    );

    const visible = useMemo(() => {
        const list = withStatus.filter(({ status }) => tab === "all" || status === tab).map(({ pet }) => pet);
        const appCount = (p: Pet) => appsByPet.get(p.pet_id)?.length ?? p.application_count ?? 0;
        if (sort === "applications") list.sort((a, b) => appCount(b) - appCount(a));
        else if (sort === "name") list.sort((a, b) => a.pet_name.localeCompare(b.pet_name));
        else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return list;
    }, [withStatus, tab, sort, appsByPet]);

    // ── Deep links ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!listings || deepLinked.current) return;
        deepLinked.current = true;
        const appId = Number(searchParams.get("application"));
        const petId = Number(searchParams.get("pet") || searchParams.get("pet_id"));
        const app = appId ? applications.find((a) => a.adoption_id === appId) : undefined;
        const targetPet = app?.pet_id ?? (petId || null);
        if (targetPet && petById.has(targetPet)) {
            setExpanded((e) => ({ ...e, [targetPet]: true }));
            requestAnimationFrame(() => document.getElementById(`listing-${targetPet}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
        if (app) setReviewing({ id: app.adoption_id, list: (appsByPet.get(app.pet_id) ?? []).map((a) => a.adoption_id) });
    }, [listings, applications, appsByPet, petById, searchParams]);

    // ── Actions ─────────────────────────────────────────────────────────────
    const updatePet = useCallback((petId: number, patch: Partial<Pet>) => {
        setListings((prev) => (prev ? prev.map((p) => (p.pet_id === petId ? { ...p, ...patch } : p)) : prev));
    }, []);

    const decide = async (app: OwnerApplication, status: "approved" | "rejected") => {
        setDeciding(app.adoption_id);
        try {
            const res = await fetch("/api/v1/applications/status", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ application_id: app.adoption_id, type: "adoption", status }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Couldn't update the application. Please try again.");
            }
            setApplications((prev) =>
                prev.map((a) =>
                    a.adoption_id === app.adoption_id
                        ? { ...a, status }
                        : status === "approved" && a.pet_id === app.pet_id
                          ? { ...a, status: "rejected" }
                          : a,
                ),
            );
            const pending = (appsByPet.get(app.pet_id) ?? []).filter((a) => appStatus(a) === "pending" && a.adoption_id !== app.adoption_id).length;
            // Keep the applicant list open after a decision so the result stays in view.
            setExpanded((e) => ({ ...e, [app.pet_id]: true }));
            if (status === "approved") {
                updatePet(app.pet_id, { adoption_status: "adopted", pending_application_count: 0 });
                dispatch(fetchAdoptionPets({}));
                toast.success(`Approved ${app.adopter_name}. ${app.pet_name} is now marked as adopted.`);
                setReviewing(null);
            } else {
                updatePet(app.pet_id, { pending_application_count: pending });
                toast.success(`Declined ${app.adopter_name}`);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Network error. Please try again.");
        } finally {
            setDeciding(null);
            setConfirmApprove(null);
        }
    };

    const setAvailability = async (pet: Pet, available: boolean) => {
        setBusyPet(pet.pet_id);
        try {
            updatePet(pet.pet_id, await setListingAvailability(pet.pet_id, available));
            toast.success(available ? `${pet.pet_name} is back near the top of the adoption page` : `Marked ${pet.pet_name} as adopted`);
            dispatch(fetchAdoptionPets({}));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Network error. Please try again.");
        } finally {
            setBusyPet(null);
        }
    };

    const deleteListing = async () => {
        if (!deleting) return;
        setDeleteBusy(true);
        try {
            const res = await fetch(`/api/v1/pets/${deleting.pet_id}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || data?.message || "Couldn't delete the listing.");
            }
            setListings((prev) => (prev ? prev.filter((p) => p.pet_id !== deleting.pet_id) : prev));
            setApplications((prev) => prev.filter((a) => a.pet_id !== deleting.pet_id));
            dispatch(fetchAdoptionPets({}));
            dispatch(fetchFosterPets());
            toast.success("Listing deleted");
            setDeleting(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Network error. Please try again.");
        } finally {
            setDeleteBusy(false);
        }
    };

    const openReview = (app: OwnerApplication, list: OwnerApplication[]) => setReviewing({ id: app.adoption_id, list: list.map((a) => a.adoption_id) });

    // ── Render ──────────────────────────────────────────────────────────────
    if (!isHydrating && (!isAuthenticated || !user)) {
        return <SignInPrompt message="Sign in to see your listings and the people who applied." next={authUrl("/my-listings")} />;
    }

    const pendingTotal = queue.length;
    const subtitle =
        pendingTotal > 0
            ? `${pendingTotal} ${pendingTotal === 1 ? "person is" : "people are"} waiting to hear back from you.`
            : "Review applications and keep your listings up to date.";

    const reviewApp = reviewing ? applications.find((a) => a.adoption_id === reviewing.id) ?? null : null;
    const reviewPet = reviewApp ? petById.get(reviewApp.pet_id) : undefined;
    const reviewIndex = reviewing && reviewApp ? reviewing.list.indexOf(reviewApp.adoption_id) : -1;
    const stepReview = (delta: number) =>
        reviewing &&
        setReviewing({ ...reviewing, id: reviewing.list[(reviewIndex + delta + reviewing.list.length) % reviewing.list.length] });
    const otherPendingFor = (app: OwnerApplication) =>
        (appsByPet.get(app.pet_id) ?? []).filter((a) => appStatus(a) === "pending" && a.adoption_id !== app.adoption_id).length;

    return (
        <AccountPage
            title="My listings"
            subtitle={listings ? subtitle : undefined}
            badges={{ "/my-listings": pendingTotal }}
            actions={
                <Link href="/create-listing" className={btn.primary}>
                    <Plus size={18} aria-hidden="true" />
                    New listing
                </Link>
            }>
            {error ? (
                <EmptyState title="Something went wrong" body={error} action={<button onClick={() => window.location.reload()} className={btn.primary}>Try again</button>} />
            ) : !listings ? (
                <Spinner label="Loading your listings" />
            ) : listings.length === 0 ? (
                <EmptyState
                    icon={<PawPrint size={22} />}
                    title="No listings yet"
                    body="List a pet that needs a home. Everyone who applies shows up here, and you choose who adopts."
                    action={
                        <Link href="/create-listing" className={btn.primary}>
                            <Plus size={18} aria-hidden="true" />
                            List a pet
                        </Link>
                    }
                />
            ) : (
                <div className="space-y-10">
                    {/* Overview */}
                    <dl className="grid grid-cols-4 gap-2 sm:gap-3">
                        {[
                            { label: "Live", short: "Live", value: counts.live, note: "Visible on Paltuu" },
                            { label: "Waiting on you", short: "To review", value: pendingTotal, note: pendingTotal ? "Applications to review" : "Nothing to review", accent: pendingTotal > 0 },
                            { label: "In review", short: "In review", value: counts.review, note: counts.review ? "Being checked by Paltuu" : "Nothing waiting on us" },
                            { label: "Homes found", short: "Adopted", value: counts.adopted, note: counts.adopted === 1 ? "Pet rehomed" : "Pets rehomed" },
                        ].map((s) => (
                            <div key={s.label} className={`${cardClass} px-2 py-3 text-center sm:p-4 sm:text-left`}>
                                <dd className={`text-xl font-semibold tabular-nums sm:text-2xl ${s.accent ? "text-primary" : "text-gray-900"}`}>{s.value}</dd>
                                <dt className="mt-0.5 truncate text-[11px] text-gray-500 sm:order-first sm:mt-0 sm:text-xs">
                                    <span className="sm:hidden">{s.short}</span>
                                    <span className="hidden sm:inline">{s.label}</span>
                                </dt>
                                <dd className="mt-0.5 hidden text-xs text-gray-500 sm:block">{s.note}</dd>
                            </div>
                        ))}
                    </dl>

                    {/* Waiting on you */}
                    {(queue.length > 0 || checkIns.length > 0) && (
                        <section aria-labelledby="waiting-title">
                            <SectionHeading
                                id="waiting-title"
                                title="Waiting on you"
                                subtitle={queue.length > 0 ? "Oldest first. Approving someone marks the pet adopted and declines the rest." : "Quick check-ins on your listings."}
                            />
                            <ul className={`${cardClass} divide-y divide-gray-100`}>
                                {queue.map((app) => {
                                    const pet = petById.get(app.pet_id);
                                    const busy = deciding === app.adoption_id;
                                    return (
                                        <li key={app.adoption_id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap">
                                            <button type="button" onClick={() => openReview(app, queue)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                                <Avatar src={app.adopter_image} name={app.adopter_name} size={44} />
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-semibold text-gray-900">{app.adopter_name}</span>
                                                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                                                        <span>
                                                            For <span className="font-medium text-gray-700">{app.pet_name}</span>
                                                        </span>
                                                        <span className="whitespace-nowrap">· {formatShortDate(app.created_at)}</span>
                                                        {app.city_name && <span className="whitespace-nowrap">· {app.city_name}</span>}
                                                        <FitBadge app={app} pet={pet} separator />
                                                    </span>
                                                </span>
                                                <ChevronRight size={18} className="ml-auto shrink-0 text-gray-400 sm:hidden" aria-hidden="true" />
                                            </button>
                                            <div className="flex w-full gap-2 sm:w-auto">
                                                <button type="button" onClick={() => openReview(app, queue)} className={`${btn.ghost} hidden md:inline-flex`}>
                                                    View answers
                                                </button>
                                                <button type="button" disabled={busy} onClick={() => decide(app, "rejected")} className={`${btn.smSecondary} flex-1 sm:flex-none`}>
                                                    Decline
                                                </button>
                                                <button type="button" disabled={busy} onClick={() => setConfirmApprove(app)} className={`${btn.smPrimary} flex-1 sm:flex-none`}>
                                                    Approve
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                                {checkIns.map(({ pet, status }) => {
                                    const busy = busyPet === pet.pet_id;
                                    const paused = status === "paused";
                                    return (
                                        <li key={`check-${pet.pet_id}`} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap">
                                            <img src={petPhoto(pet)} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-gray-100 object-cover" />
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                                                    {paused ? `${pet.pet_name} is paused` : `Is ${pet.pet_name} still looking for a home?`}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {paused ? "Hidden from the adoption page until you relist." : "Confirming keeps the listing near the top of the adoption page."}
                                                </p>
                                            </div>
                                            <div className="flex w-full gap-2 sm:w-auto">
                                                <button type="button" disabled={busy} onClick={() => setAvailability(pet, false)} className={`${btn.smSecondary} flex-1 sm:flex-none`}>
                                                    Adopted
                                                </button>
                                                <button type="button" disabled={busy} onClick={() => setAvailability(pet, true)} className={`${btn.smPrimary} flex-1 sm:flex-none`}>
                                                    {paused ? "Relist" : "Still available"}
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}

                    {/* Listings */}
                    <section aria-labelledby="listings-title">
                        <SectionHeading id="listings-title" title="Your listings" subtitle="Each listing shows everyone who applied for it." />
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <FilterTabs<Tab>
                                label="Filter listings"
                                value={tab}
                                onChange={setTab}
                                tabs={[
                                    { key: "all", label: "All", count: counts.all },
                                    { key: "live", label: "Live", count: counts.live },
                                    { key: "review", label: "In review", count: counts.review },
                                    { key: "paused", label: "Paused", count: counts.paused },
                                    { key: "adopted", label: "Adopted", count: counts.adopted },
                                ]}
                            />
                            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                                Sort
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as SortKey)}
                                    className="h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none">
                                    <option value="newest">Newest first</option>
                                    <option value="applications">Most applications</option>
                                    <option value="name">Name</option>
                                </select>
                            </label>
                        </div>

                        {visible.length === 0 ? (
                            <EmptyState title="Nothing here" body="No listings match this filter." />
                        ) : (
                            <div className="space-y-4">
                                {visible.map((pet) => (
                                    <ListingCard
                                        key={pet.pet_id}
                                        pet={pet}
                                        apps={appsByPet.get(pet.pet_id) ?? []}
                                        open={expanded[pet.pet_id] ?? (appsByPet.get(pet.pet_id) ?? []).some((a) => appStatus(a) === "pending")}
                                        onToggle={(v) => setExpanded((e) => ({ ...e, [pet.pet_id]: v }))}
                                        deciding={deciding}
                                        busy={busyPet === pet.pet_id}
                                        onReview={openReview}
                                        onApprove={setConfirmApprove}
                                        onDecline={(a) => decide(a, "rejected")}
                                        onEdit={() => setEditing(pet)}
                                        onDelete={() => setDeleting(pet)}
                                        onAvailability={(available) => setAvailability(pet, available)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Guidance */}
                    <section aria-labelledby="checklist-title" className={`${cardClass} p-5`}>
                        <SectionHeading id="checklist-title" title="Choosing the right adopter" subtitle="What to look for in every application." />
                        <ol className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                            {ADOPTER_CHECKLIST.map(([title, body], i) => (
                                <li key={title} className="flex gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-semibold text-primary">{i + 1}</span>
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-900">{title}</span>
                                        <span className="block text-sm text-gray-600">{body}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>
            )}

            <ApplicationReviewModal
                app={reviewApp}
                pet={reviewPet}
                petName={reviewApp?.pet_name ?? ""}
                otherPending={reviewApp ? otherPendingFor(reviewApp) : 0}
                position={reviewing && reviewing.list.length > 1 && reviewIndex >= 0 ? `${reviewIndex + 1} of ${reviewing.list.length}` : undefined}
                onPrev={() => stepReview(-1)}
                onNext={() => stepReview(1)}
                onClose={() => setReviewing(null)}
                onApprove={setConfirmApprove}
                onDecline={(a) => decide(a, "rejected")}
                busy={deciding !== null}
                canDecide={!!reviewPet && getListingStatus(reviewPet) !== "adopted"}
            />

            <ConfirmDialog
                open={!!confirmApprove}
                title={confirmApprove ? `Approve ${confirmApprove.adopter_name}?` : ""}
                body={
                    confirmApprove && (
                        <>
                            {confirmApprove.pet_name} will be marked as adopted
                            {otherPendingFor(confirmApprove) > 0
                                ? ` and the other ${otherPendingFor(confirmApprove)} pending ${otherPendingFor(confirmApprove) === 1 ? "application" : "applications"} will be declined`
                                : ""}
                            . Everyone who applied is notified.
                        </>
                    )
                }
                confirmLabel="Approve"
                busyLabel="Approving…"
                busy={deciding !== null}
                onConfirm={() => confirmApprove && decide(confirmApprove, "approved")}
                onCancel={() => setConfirmApprove(null)}
            />

            <ConfirmDialog
                open={!!deleting}
                title="Delete this listing?"
                body={deleting ? `${deleting.pet_name} and all its applications are removed. This can't be undone.` : ""}
                confirmLabel="Delete"
                busyLabel="Deleting…"
                tone="danger"
                busy={deleteBusy}
                onConfirm={deleteListing}
                onCancel={() => setDeleting(null)}
            />

            <EditListingModal
                pet={editing}
                onClose={() => setEditing(null)}
                onSaved={(petId, patch) => {
                    updatePet(petId, patch);
                    dispatch(fetchAdoptionPets({}));
                }}
            />
        </AccountPage>
    );
}

// ── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({
    pet,
    apps,
    open,
    onToggle,
    deciding,
    busy,
    onReview,
    onApprove,
    onDecline,
    onEdit,
    onDelete,
    onAvailability,
}: {
    pet: Pet;
    apps: OwnerApplication[];
    open: boolean;
    onToggle: (open: boolean) => void;
    deciding: number | null;
    busy: boolean;
    onReview: (app: OwnerApplication, list: OwnerApplication[]) => void;
    onApprove: (app: OwnerApplication) => void;
    onDecline: (app: OwnerApplication) => void;
    onEdit: () => void;
    onDelete: () => void;
    onAvailability: (available: boolean) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
        const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", esc);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", esc);
        };
    }, [menuOpen]);

    const status = getListingStatus(pet);
    const pill = pet.adoption_status === "fostered" ? { tone: "primary" as const, label: "Fostered" } : LISTING_PILL[status];
    const isFoster = pet.listing_type === "foster";
    const pending = apps.filter((a) => appStatus(a) === "pending").length;
    const total = isFoster ? pet.application_count ?? 0 : apps.length;
    const canMarkAdopted = !!pet.approved && (status === "live" || status === "paused");
    const adopted = status === "adopted";
    const meta = [pet.pet_breed || "Mixed breed", pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : null, formatAge(pet.age_months)]
        .filter(Boolean)
        .join(" · ");
    const place = [pet.area, pet.city].filter(Boolean).join(", ");
    const publicUrl = `/browse-pets/${pet.pet_id}`;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`);
            toast.success("Link copied. Share it to find a home faster.");
        } catch {
            toast.error("Couldn't copy the link");
        }
    };

    const menuItem = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50";

    return (
        <article id={`listing-${pet.pet_id}`} className={`${cardClass} scroll-mt-24 overflow-hidden`}>
            {/* Listing summary */}
            <div className="flex gap-4 p-4">
                <Link href={publicUrl} className="shrink-0">
                    <img
                        src={petPhoto(pet)}
                        alt={pet.pet_name}
                        onError={(e) => ((e.target as HTMLImageElement).src = "/dog-placeholder.png")}
                        className={`h-24 w-24 rounded-lg bg-gray-100 object-cover sm:h-28 sm:w-28 ${adopted ? "opacity-80 grayscale" : ""}`}
                    />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Pill tone={pill.tone}>{pill.label}</Pill>
                                <span className="text-xs text-gray-500">{listingKindLabel(pet.listing_type, pet.pet_type)}</span>
                            </div>
                            <h3 className="mt-1.5 line-clamp-2 break-words text-base font-semibold leading-snug text-gray-900 sm:text-lg">{pet.pet_name}</h3>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <button type="button" onClick={onEdit} className={`${btn.ghost} hidden sm:inline-flex`}>
                                <Pencil size={15} aria-hidden="true" />
                                Edit
                            </button>
                            <div ref={menuRef} className="relative">
                                <button
                                    type="button"
                                    aria-label={`More actions for ${pet.pet_name}`}
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                    onClick={() => setMenuOpen((v) => !v)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
                                    <MoreHorizontal size={18} />
                                </button>
                                {menuOpen && (
                                    <div role="menu" className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                                        <button role="menuitem" type="button" className={`${menuItem} sm:hidden`} onClick={() => (setMenuOpen(false), onEdit())}>
                                            <Pencil size={15} /> Edit listing
                                        </button>
                                        {status === "live" && (
                                            <>
                                                <Link role="menuitem" href={publicUrl} className={menuItem} onClick={() => setMenuOpen(false)}>
                                                    <ExternalLink size={15} /> View public page
                                                </Link>
                                                <button role="menuitem" type="button" className={menuItem} onClick={() => (setMenuOpen(false), copyLink())}>
                                                    <Link2 size={15} /> Copy link
                                                </button>
                                            </>
                                        )}
                                        {canMarkAdopted && (
                                            <button role="menuitem" type="button" disabled={busy} className={menuItem} onClick={() => (setMenuOpen(false), onAvailability(false))}>
                                                <PawPrint size={15} /> Mark as adopted
                                            </button>
                                        )}
                                        {status === "paused" && (
                                            <button role="menuitem" type="button" disabled={busy} className={menuItem} onClick={() => (setMenuOpen(false), onAvailability(true))}>
                                                <PawPrint size={15} /> Relist
                                            </button>
                                        )}
                                        <div className="my-1 h-px bg-gray-100" />
                                        <button role="menuitem" type="button" className={`${menuItem} text-red-600 hover:bg-red-50`} onClick={() => (setMenuOpen(false), onDelete())}>
                                            Delete listing
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">{meta}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        {place && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                                <MapPin size={13} className="shrink-0 text-primary" aria-hidden="true" />
                                <span className="truncate">{place}</span>
                            </span>
                        )}
                        {pet.created_at && <span>Listed {formatShortDate(pet.created_at)}</span>}
                        <span>{formatFee(pet.price)}</span>
                    </p>
                </div>
            </div>

            {/* Applications */}
            <div className="border-t border-gray-100">
                {isFoster ? (
                    <Link
                        href={`/foster-applicants?pet_id=${pet.pet_id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                        <span className="inline-flex items-center gap-2">
                            <Users size={16} className="text-primary" aria-hidden="true" />
                            {total > 0 ? `${total} foster ${total === 1 ? "application" : "applications"}` : "Foster applications"}
                        </span>
                        <span className="text-primary">Review →</span>
                    </Link>
                ) : apps.length === 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-2">
                            <Inbox size={16} aria-hidden="true" />
                            {status === "review" ? "Applications open once the Paltuu team approves this listing." : "No applications yet."}
                        </span>
                        {status === "live" && (
                            <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                                <Link2 size={14} aria-hidden="true" />
                                Copy link to share
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => onToggle(!open)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50">
                            <span className="flex min-w-0 items-center gap-2.5">
                                <span className="flex shrink-0 -space-x-2" aria-hidden="true">
                                    {apps.slice(0, 3).map((a) => (
                                        <span key={a.adoption_id} className="rounded-full ring-2 ring-white">
                                            <Avatar src={a.adopter_image} name={a.adopter_name} size={26} />
                                        </span>
                                    ))}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {apps.length} {apps.length === 1 ? "application" : "applications"}
                                </span>
                                {pending > 0 && !adopted && <Pill tone="primary">{pending} new</Pill>}
                            </span>
                            <ChevronDown size={18} className={`shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                        {open && (
                            <ul className="divide-y divide-gray-100 border-t border-gray-100 bg-gray-50/60">
                                {apps.map((app) => {
                                    const s = appStatus(app);
                                    const ap = APPLICATION_PILL[s] ?? APPLICATION_PILL.pending;
                                    const rowBusy = deciding === app.adoption_id;
                                    return (
                                        <li key={app.adoption_id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                                            <button type="button" onClick={() => onReview(app, apps)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                                <Avatar src={app.adopter_image} name={app.adopter_name} size={36} />
                                                <span className="min-w-0">
                                                    <span className="flex items-center gap-2">
                                                        <span className="truncate text-sm font-semibold text-gray-900 hover:text-primary">{app.adopter_name}</span>
                                                        <Pill tone={ap.tone}>{ap.label}</Pill>
                                                    </span>
                                                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                                                        <span>{formatShortDate(app.created_at)}</span>
                                                        {app.city_name && <span className="whitespace-nowrap">· {app.city_name}</span>}
                                                        <FitBadge app={app} pet={pet} separator />
                                                    </span>
                                                </span>
                                                <ChevronRight size={18} className="ml-auto shrink-0 text-gray-400 sm:hidden" aria-hidden="true" />
                                            </button>
                                            <div className={`w-full gap-2 sm:flex sm:w-auto ${s === "pending" && !adopted ? "flex" : "hidden"}`}>
                                                <button type="button" onClick={() => onReview(app, apps)} className={`${btn.ghost} hidden sm:inline-flex`}>
                                                    View answers
                                                </button>
                                                {s === "pending" && !adopted && (
                                                    <>
                                                        <button type="button" disabled={rowBusy} onClick={() => onDecline(app)} className={`${btn.smSecondary} flex-1 sm:flex-none`}>
                                                            Decline
                                                        </button>
                                                        <button type="button" disabled={rowBusy} onClick={() => onApprove(app)} className={`${btn.smPrimary} flex-1 sm:flex-none`}>
                                                            Approve
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </article>
    );
}

export default function MyListingsPage() {
    return (
        <Suspense fallback={<Spinner label="Loading your listings" />}>
            <MyListings />
        </Suspense>
    );
}
