"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { Plus, ArrowRight } from "lucide-react";
import MyListingGrid, { Pet, setListingAvailability } from "@/components/MyListingGrid";
import { AppDispatch } from "@/app/store/store";
import { fetchAdoptionPets } from "@/app/store/slices/adoptionPetsSlice";
import { useAuth } from "@/context/AuthContext";
import { getListingStatus, ListingStatus, formatShortDate } from "@/utils/listingDisplay";
import "./styles.css";

const ADOPTER_CHECKLIST = [
    { title: "A stable home", description: "A settled living situation that suits the pet." },
    { title: "Everyone on board", description: "The whole household agrees to the adoption." },
    { title: "Experience or research", description: "Has kept pets before or has done the reading." },
    { title: "Can cover costs", description: "Food, vet visits and supplies are affordable." },
    { title: "Regular vet care", description: "Will keep up with check-ups and vaccinations." },
    { title: "Time to give", description: "Has time each day to care for the pet." },
];

type Tab = "all" | ListingStatus;
type SortKey = "newest" | "applications" | "name";

const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "review", label: "In review" },
    { key: "paused", label: "Paused" },
    { key: "adopted", label: "Adopted" },
];

const applicantsHref = (pet: Pet) =>
    pet.listing_type === "foster" ? `/foster-applicants?pet_id=${pet.pet_id}` : `/adoption-applicants?pet_id=${pet.pet_id}`;

const petPhoto = (pet: Pet) => pet.primary_image || pet.image_url || "/dog-placeholder.png";

type AttentionItem =
    | { kind: "applications"; pet: Pet; count: number }
    | { kind: "check-in"; pet: Pet }
    | { kind: "paused"; pet: Pet }
    | { kind: "review"; pet: Pet };

const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center px-4">{children}</div>
);

const UserListingsPage = () => {
    const { user, isAuthenticated } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const [listings, setListings] = useState<Pet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("all");
    const [sort, setSort] = useState<SortKey>("newest");
    const [busyPet, setBusyPet] = useState<number | null>(null);
    const lastFetchedUserId = useRef<string | null>(null);
    const isFetching = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) { setIsLoading(false); return; }
        if (isFetching.current || lastFetchedUserId.current === user.id) { setIsLoading(false); return; }

        const fetchData = async () => {
            try {
                isFetching.current = true;
                setIsLoading(true);
                const res = await fetch("/api/v1/profile/listings", { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } });
                if (!res.ok) throw new Error("Failed to fetch listings");
                const data = await res.json();
                setListings(data.listings || []);
                lastFetchedUserId.current = user.id!;
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setIsLoading(false);
                isFetching.current = false;
            }
        };
        fetchData();
    }, [user?.id, isAuthenticated]);

    const updatePet = (petId: number, patch: Partial<Pet>) =>
        setListings((prev) => prev.map((p) => (p.pet_id === petId ? { ...p, ...patch } : p)));

    const handleAvailability = async (pet: Pet, available: boolean) => {
        setBusyPet(pet.pet_id);
        try {
            const data = await setListingAvailability(pet.pet_id, available);
            updatePet(pet.pet_id, data);
            toast.success(available ? `${pet.pet_name} is back at the top of the adoption page` : `Marked ${pet.pet_name} as adopted 🎉`);
            dispatch(fetchAdoptionPets({}));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Network error. Please try again.");
        } finally {
            setBusyPet(null);
        }
    };

    const withStatus = useMemo(() => listings.map((pet) => ({ pet, status: getListingStatus(pet) })), [listings]);

    const counts = useMemo(() => {
        const c: Record<Tab, number> = { all: withStatus.length, live: 0, review: 0, paused: 0, adopted: 0 };
        withStatus.forEach(({ status }) => { c[status] += 1; });
        return c;
    }, [withStatus]);

    const openListings = withStatus.filter(({ status }) => status !== "adopted");
    const newApplications = openListings.reduce((n, { pet }) => n + (pet.pending_application_count ?? 0), 0);
    const listingsWithNew = openListings.filter(({ pet }) => (pet.pending_application_count ?? 0) > 0).length;

    const attention: AttentionItem[] = useMemo(() => {
        const items: AttentionItem[] = [];
        withStatus.forEach(({ pet, status }) => {
            const pending = pet.pending_application_count ?? 0;
            if (pending > 0 && status !== "adopted") items.push({ kind: "applications", pet, count: pending });
        });
        withStatus.forEach(({ pet, status }) => {
            if (status === "live" && pet.adoption_status === "available" && pet.availability_check_sent_at) items.push({ kind: "check-in", pet });
        });
        withStatus.forEach(({ pet, status }) => { if (status === "paused" && pet.approved) items.push({ kind: "paused", pet }); });
        withStatus.forEach(({ pet, status }) => { if (status === "review") items.push({ kind: "review", pet }); });
        return items;
    }, [withStatus]);

    const visible = useMemo(() => {
        const filtered = withStatus.filter(({ status }) => tab === "all" || status === tab).map(({ pet }) => pet);
        const sorted = [...filtered];
        if (sort === "applications") sorted.sort((a, b) => (b.application_count ?? 0) - (a.application_count ?? 0));
        else if (sort === "name") sorted.sort((a, b) => a.pet_name.localeCompare(b.pet_name));
        else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return sorted;
    }, [withStatus, tab, sort]);

    if (!isAuthenticated || !user) {
        return (
            <PageShell>
                <div className="bg-white border border-[#E6E4DF] rounded-2xl p-10 text-center max-w-sm w-full">
                    <p className="text-[#52525B] mb-5 text-sm">Please log in to view your listings.</p>
                    <Link href="/auth" className="bg-primary text-white px-6 min-h-[46px] rounded-xl font-semibold text-sm inline-flex items-center">Sign in</Link>
                </div>
            </PageShell>
        );
    }

    if (isLoading) {
        return (
            <PageShell>
                <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading listings" />
            </PageShell>
        );
    }

    if (error) {
        return (
            <PageShell>
                <div className="bg-white border border-[#E6E4DF] rounded-2xl p-10 text-center max-w-sm w-full">
                    <p className="text-[#B91C1C] text-sm mb-5">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 min-h-[46px] rounded-xl font-semibold text-sm">Retry</button>
                </div>
            </PageShell>
        );
    }

    const firstName = user.name?.split(" ")[0];
    const stats = [
        { label: "Live listings", value: counts.live, note: "Visible on Paltuu" },
        { label: "In review", value: counts.review, note: counts.review > 0 ? "Being checked by the Paltuu team" : "Nothing waiting on us" },
        {
            label: "New applications",
            value: newApplications,
            note: newApplications > 0 ? `Across ${listingsWithNew} ${listingsWithNew === 1 ? "listing" : "listings"}` : "None waiting on you",
        },
        { label: "Homes found", value: counts.adopted, note: counts.adopted === 1 ? "Pet you have rehomed" : "Pets you have rehomed" },
    ];

    return (
        <main className="min-h-screen bg-[#F5F4F1] text-[#18181B]">
            {/* Header: light title area with a primary-colour stats strip */}
            <section aria-label="Overview" className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 lg:pt-12 flex flex-col gap-7">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="flex flex-col gap-2.5 max-w-2xl">
                        <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[#6B6B73]">
                            {firstName ? `Hi, ${firstName}` : "Your account"}
                        </p>
                        <h1 className="text-[32px] lg:text-[44px] leading-[1.1] font-semibold tracking-[-0.025em]">My listings</h1>
                        <p className="text-[15px] leading-relaxed text-[#52525B]">
                            {newApplications > 0
                                ? `${newApplications} ${newApplications === 1 ? "person is" : "people are"} waiting to hear back from you. Review applications and keep your listings up to date.`
                                : "Keep your listings up to date so the right adopters find them."}
                        </p>
                    </div>
                    <Link
                        href="/create-listing"
                        className="inline-flex items-center gap-2 min-h-[46px] px-[22px] rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                        <Plus size={18} aria-hidden="true" />
                        New listing
                    </Link>
                </div>

                <dl className="grid grid-cols-2 lg:grid-cols-4 bg-primary text-white rounded-[18px] overflow-hidden">
                    {stats.map((s, i) => (
                        <div key={s.label} className={`px-5 sm:px-6 py-5 flex flex-col gap-1.5 border-white/15 ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                            <dt className="text-[13px] font-medium text-white/75">{s.label}</dt>
                            <dd className="text-[28px] lg:text-[32px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{s.value}</dd>
                            <dd className="text-xs text-white/70">{s.note}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-24 flex flex-col gap-12">
                {listings.length === 0 ? (
                    <div className="bg-white border border-[#E6E4DF] rounded-[18px] px-6 py-16 text-center flex flex-col items-center gap-2">
                        <h2 className="text-lg font-semibold">No listings yet</h2>
                        <p className="text-[#6B6B73] text-sm mb-4 max-w-sm">List a pet that needs a home and review the people who apply, all from here.</p>
                        <Link href="/create-listing" className="bg-primary text-white px-6 min-h-[46px] rounded-xl font-semibold text-sm inline-flex items-center gap-2">
                            <Plus size={18} aria-hidden="true" />
                            Create your first listing
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Needs your attention: only shown when something does */}
                        {attention.length > 0 && (
                            <section aria-labelledby="attention-title" className="bg-white border border-[#E6E4DF] rounded-[18px]">
                                <header className="px-6 py-[18px] flex items-center gap-2.5 border-b border-[#EEECE8]">
                                    <h2 id="attention-title" className="text-[17px] font-semibold">Needs your attention</h2>
                                    <span className="min-w-[24px] h-6 px-2 rounded-full bg-[#18181B] text-white text-xs font-semibold inline-flex items-center justify-center tabular-nums">
                                        {attention.length}
                                    </span>
                                </header>
                                <ul>
                                    {attention.map((item) => {
                                        const { pet } = item;
                                        const busy = busyPet === pet.pet_id;
                                        return (
                                            <li key={`${item.kind}-${pet.pet_id}`} className="px-6 py-4 flex flex-wrap items-center gap-4 border-b border-[#F0EEEA] last:border-b-0">
                                                <img src={petPhoto(pet)} alt="" className="w-[52px] h-[52px] rounded-xl object-cover shrink-0 bg-[#ECE8E1]" />
                                                <div className="flex-1 basis-[220px] min-w-0 flex flex-col gap-0.5">
                                                    {item.kind === "applications" && (
                                                        <>
                                                            <p className="text-[15px] font-semibold">
                                                                {item.count} new {item.count === 1 ? "application" : "applications"} for {pet.pet_name}
                                                            </p>
                                                            <p className="text-[13px] text-[#6B6B73] truncate">
                                                                {pet.recent_applicant_names?.[0] ? `Most recent from ${pet.recent_applicant_names[0]}` : "Waiting for your review"}
                                                            </p>
                                                        </>
                                                    )}
                                                    {item.kind === "check-in" && (
                                                        <>
                                                            <p className="text-[15px] font-semibold">Is {pet.pet_name} still looking for a home?</p>
                                                            <p className="text-[13px] text-[#6B6B73]">Listed {formatShortDate(pet.created_at)} · confirm to keep it near the top</p>
                                                        </>
                                                    )}
                                                    {item.kind === "paused" && (
                                                        <>
                                                            <p className="text-[15px] font-semibold">{pet.pet_name} is paused</p>
                                                            <p className="text-[13px] text-[#6B6B73]">Hidden from the adoption page until you relist</p>
                                                        </>
                                                    )}
                                                    {item.kind === "review" && (
                                                        <>
                                                            <p className="text-[15px] font-semibold">{pet.pet_name} is being reviewed</p>
                                                            <p className="text-[13px] text-[#6B6B73]">The Paltuu team checks every new listing</p>
                                                        </>
                                                    )}
                                                </div>
                                                {item.kind === "applications" && (
                                                    <Link href={applicantsHref(pet)} className="inline-flex items-center gap-1.5 min-h-[42px] px-[18px] rounded-[10px] bg-primary text-white text-[13px] font-semibold">
                                                        Review
                                                        <ArrowRight size={15} aria-hidden="true" />
                                                    </Link>
                                                )}
                                                {item.kind === "check-in" && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAvailability(pet, false)}
                                                            disabled={busy}
                                                            className="min-h-[42px] px-4 rounded-[10px] border border-[#D9D6D0] bg-white text-[13px] font-semibold hover:border-[#A1A1AA] transition-colors disabled:opacity-60"
                                                        >
                                                            Adopted
                                                        </button>
                                                        <button
                                                            onClick={() => handleAvailability(pet, true)}
                                                            disabled={busy}
                                                            className="min-h-[42px] px-4 rounded-[10px] bg-[#18181B] text-white text-[13px] font-semibold disabled:opacity-60"
                                                        >
                                                            Still available
                                                        </button>
                                                    </div>
                                                )}
                                                {item.kind === "paused" && (
                                                    <button
                                                        onClick={() => handleAvailability(pet, true)}
                                                        disabled={busy}
                                                        className="min-h-[42px] px-[18px] rounded-[10px] border border-[#D9D6D0] bg-white text-[13px] font-semibold hover:border-[#A1A1AA] transition-colors disabled:opacity-60"
                                                    >
                                                        Relist
                                                    </button>
                                                )}
                                                {item.kind === "review" && (
                                                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3F3F46]">
                                                        <span className="w-[7px] h-[7px] rounded-full bg-[#B45309]" />
                                                        In review
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        )}

                        {/* All listings */}
                        <section aria-labelledby="all-listings-title" className="flex flex-col gap-6">
                            <h2 id="all-listings-title" className="text-2xl font-semibold tracking-[-0.015em]">All listings</h2>
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E0DB]">
                                <div role="tablist" aria-label="Filter listings" className="flex flex-wrap gap-x-7">
                                    {TABS.map((t) => {
                                        const active = tab === t.key;
                                        return (
                                            <button
                                                key={t.key}
                                                type="button"
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() => setTab(t.key)}
                                                className={`-mb-px border-b-2 pt-3 pb-3.5 min-h-[44px] text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                                                    active ? "border-[#18181B] text-[#18181B]" : "border-transparent text-[#6B6B73] hover:text-[#18181B]"
                                                }`}
                                            >
                                                {t.label}
                                                <span
                                                    className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center tabular-nums ${
                                                        active ? "bg-[#18181B] text-white" : "bg-[#E9E7E3] text-[#52525B]"
                                                    }`}
                                                >
                                                    {counts[t.key]}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <label className="inline-flex items-center gap-2 text-[13px] text-[#6B6B73] pb-2">
                                    Sort by
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value as SortKey)}
                                        className="text-[13px] font-semibold text-[#18181B] bg-white border border-[#E2E0DB] rounded-[10px] px-3 min-h-[38px] focus:outline-none focus:border-[#A1A1AA]"
                                    >
                                        <option value="newest">Newest first</option>
                                        <option value="applications">Most applications</option>
                                        <option value="name">Name</option>
                                    </select>
                                </label>
                            </div>

                            {visible.length === 0 ? (
                                <div className="bg-white border border-[#E6E4DF] rounded-[18px] px-6 py-14 text-center">
                                    <p className="text-base font-semibold">Nothing here</p>
                                    <p className="text-sm text-[#6B6B73] mt-1">No listings match this filter.</p>
                                </div>
                            ) : (
                                <MyListingGrid
                                    pets={visible}
                                    showCreateButton={false}
                                    inlineCheckIn={false}
                                    onPetUpdated={updatePet}
                                    onPetDeleted={(petId) => setListings((prev) => prev.filter((p) => p.pet_id !== petId))}
                                />
                            )}
                        </section>

                        {/* Adopter checklist */}
                        <section aria-labelledby="checklist-title" className="border-t border-[#E2E0DB] pt-10 flex flex-col gap-6">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 id="checklist-title" className="text-lg font-semibold">Choosing the right adopter</h2>
                                    <p className="text-[13px] text-[#6B6B73] mt-1">What to look for in every application.</p>
                                </div>
                            </div>
                            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-5">
                                {ADOPTER_CHECKLIST.map((item, i) => (
                                    <li key={item.title} className="flex gap-3.5">
                                        <span className="w-[22px] shrink-0 pt-0.5 text-xs font-semibold text-[#6B6B73] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold">{item.title}</span>
                                            <span className="text-[13px] leading-normal text-[#6B6B73]">{item.description}</span>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                            <details className="group max-w-xl">
                                <summary className="cursor-pointer list-none min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold">
                                    Why these checks matter
                                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <ul className="mt-1 pl-4 space-y-1.5 text-[13px] leading-relaxed text-[#52525B] list-disc">
                                    <li>Pets end up in safe, loving and permanent homes.</li>
                                    <li>Fewer pets get returned or rehomed a second time.</li>
                                    <li>Each pet is matched with someone who can care for them.</li>
                                    <li>Adopters understand the responsibility before they commit.</li>
                                </ul>
                            </details>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
};

export default UserListingsPage;
