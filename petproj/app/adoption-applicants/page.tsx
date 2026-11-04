"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight, Check, AlertCircle, Info, ExternalLink, Quote } from "lucide-react";
import { formatAge } from "@/utils/formatAge";
import {
    APPLICATION_STATUS_META,
    LISTING_STATUS_META,
    AVATAR_TONES,
    getListingStatus,
    getInitials,
    listingKindLabel,
    formatFee,
    formatShortDate,
} from "@/utils/listingDisplay";

interface Application {
    adoption_id: number;
    user_id: number;
    pet_name: string;
    pet_id: number;
    adopter_name: string;
    adopter_image: string | null;
    adopter_address: string;
    created_at: string;
    status: string;
    age_of_youngest_child: string | number | null;
    other_pets_details: string | null;
    other_pets_neutered: boolean | null;
    has_secure_outdoor_area: boolean | null;
    pet_sleep_location: string | null;
    pet_left_alone: string | null;
    additional_details: string | null;
    agree_to_terms: boolean;
}

interface PetOverview {
    pet_id: number;
    pet_name: string;
    pet_breed: string | null;
    pet_type: number | null;
    listing_type: string | null;
    sex: string | null;
    city: string;
    area: string;
    age_months: number;
    adoption_status: string;
    approved: boolean | null;
    price: string | null;
    created_at: string | null;
    vaccinated: boolean | null;
    neutered: boolean | null;
    min_age_of_children: number | null;
    can_live_with_dogs: boolean | null;
    can_live_with_cats: boolean | null;
    must_have_someone_home: boolean | null;
    images: { image_id: number; image_url: string }[];
}

type Verdict = "fits" | "check" | null;
interface FitRow { need: string; pet: string; them: string; verdict: Verdict }

const NO_PETS = /^\s*(no|none|nil|nothing|n\/?a)\b/i;
const DOG_WORDS = /\b(dog|dogs|puppy|puppies)\b/i;
const CAT_WORDS = /\b(cat|cats|kitten|kittens)\b/i;

/**
 * Compares an application with the pet's structured requirements. Children and
 * other pets get a verdict; "time left alone" is free text, so it is shown side
 * by side for the owner to judge.
 */
function assessFit(app: Application, pet: PetOverview | null): FitRow[] {
    const minAge = pet?.min_age_of_children ?? 0;
    const rawAge = app.age_of_youngest_child;
    const age = rawAge === null || rawAge === "" ? NaN : Number(rawAge);
    const children: FitRow = {
        need: "Children",
        pet: minAge > 0 ? `Fine with kids aged ${minAge}+` : "Fine with children of any age",
        them: Number.isFinite(age) ? `Youngest is ${age}` : "No children mentioned",
        verdict: !Number.isFinite(age) || age >= minAge ? "fits" : "check",
    };

    const dogsOk = !!pet?.can_live_with_dogs;
    const catsOk = !!pet?.can_live_with_cats;
    const text = (app.other_pets_details || "").trim();
    const none = !text || NO_PETS.test(text);
    const hasDog = !none && DOG_WORDS.test(text);
    const hasCat = !none && CAT_WORDS.test(text);
    const others: FitRow = {
        need: "Other pets",
        pet: dogsOk && catsOk ? "Good with dogs and cats"
            : catsOk ? "Good with cats only"
            : dogsOk ? "Good with dogs only"
            : "Not listed as good with other pets",
        them: none ? "No other pets" : text,
        verdict: none ? "fits"
            : (hasDog && !dogsOk) || (hasCat && !catsOk) ? "check"
            : hasDog || hasCat ? "fits"
            : null,
    };

    const company: FitRow = {
        need: "Company",
        pet: pet?.must_have_someone_home ? "Needs someone home most of the day" : "Fine alone for a few hours",
        them: app.pet_left_alone?.trim() || "Not stated",
        verdict: null,
    };

    return [children, others, company];
}

const yesNo = (v: boolean | null | undefined) => (v === null || v === undefined ? "Not stated" : v ? "Yes" : "No");

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const Avatar = ({ app, index, size }: { app: Application; index: number; size: "sm" | "lg" }) => {
    const [failed, setFailed] = useState(false);
    const dim = size === "lg" ? "w-16 h-16 text-[19px]" : "w-11 h-11 text-[13px]";
    if (app.adopter_image && !failed) {
        return <img src={app.adopter_image} alt="" onError={() => setFailed(true)} className={`${dim} rounded-full object-cover shrink-0`} />;
    }
    return (
        <span className={`${dim} rounded-full shrink-0 flex items-center justify-center font-bold text-[#3F3F46]`} style={{ background: AVATAR_TONES[index % AVATAR_TONES.length] }} aria-hidden="true">
            {getInitials(app.adopter_name)}
        </span>
    );
};

const StatusDot = ({ status }: { status: string }) => {
    const meta = APPLICATION_STATUS_META[status] ?? { label: status, dot: "#A1A1AA" };
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3F3F46] shrink-0">
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: meta.dot }} />
            {meta.label}
        </span>
    );
};

type Tab = "all" | "pending" | "approved" | "rejected";
const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Declined" },
];

const AdoptionApplications = () => {
    const searchParams = useSearchParams();
    const petId = searchParams.get("pet_id");
    const [applications, setApplications] = useState<Application[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pet, setPet] = useState<PetOverview | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [tab, setTab] = useState<Tab>("all");
    const [confirmApprove, setConfirmApprove] = useState(false);
    const [saving, setSaving] = useState(false);
    const detailRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!petId) return;

        const fetchApplications = async () => {
            try {
                const response = await fetch(`/api/v1/applications/adoption?pet_id=${petId}`);
                if (response.ok) {
                    const data = await response.json();
                    const list: Application[] = Array.isArray(data) ? data : [data];
                    setApplications(list);
                    const firstPending = list.find((a) => a.status?.toLowerCase() === "pending");
                    setSelectedId((firstPending ?? list[0])?.adoption_id ?? null);
                } else if (response.status === 404) {
                    setApplications([]);
                } else {
                    const errorData = await response.json().catch(() => null);
                    setError(errorData?.error || "Failed to load applications. Please try again.");
                }
            } catch (err) {
                console.error("Error fetching applications:", err);
                setError("Failed to load applications. Please try again.");
            }
        };

        const fetchPet = async () => {
            try {
                const response = await fetch(`/api/v1/pets/${petId}`);
                if (response.ok) setPet(await response.json());
            } catch (err) {
                console.error("Error fetching pet overview:", err);
            }
        };

        fetchApplications();
        fetchPet();
    }, [petId]);

    useEffect(() => {
        if (!confirmApprove) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setConfirmApprove(false); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [confirmApprove]);

    const apps = useMemo(() => applications ?? [], [applications]);
    const statusOf = (a: Application) => a.status?.toLowerCase() || "pending";
    const counts = useMemo(() => {
        const c: Record<Tab, number> = { all: apps.length, pending: 0, approved: 0, rejected: 0 };
        apps.forEach((a) => { const s = statusOf(a) as Tab; if (s in c) c[s] += 1; });
        return c;
    }, [apps]);
    const shown = tab === "all" ? apps : apps.filter((a) => statusOf(a) === tab);
    const selectedIndex = Math.max(0, apps.findIndex((a) => a.adoption_id === selectedId));
    const current = apps[selectedIndex] ?? null;
    const petName = pet?.pet_name || apps[0]?.pet_name || "this pet";

    const select = (id: number) => {
        setSelectedId(id);
        if (window.matchMedia("(max-width: 1023px)").matches) {
            requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
    };
    const step = (delta: number) => {
        if (apps.length === 0) return;
        setSelectedId(apps[(selectedIndex + delta + apps.length) % apps.length].adoption_id);
    };

    const updateStatus = async (adoptionId: number, status: "approved" | "rejected") => {
        setSaving(true);
        try {
            const response = await fetch(`/api/v1/applications/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ application_id: adoptionId, type: "adoption", status }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                toast.error(errorData?.error || "Couldn't update the application. Please try again.");
                return;
            }
            setApplications((prev) =>
                prev
                    ? prev.map((app) =>
                          app.adoption_id === adoptionId
                              ? { ...app, status }
                              : status === "approved" ? { ...app, status: "rejected" } : app
                      )
                    : prev
            );
            if (status === "approved") {
                // The server marks the pet adopted and declines everyone else.
                setPet((p) => (p ? { ...p, adoption_status: "adopted" } : p));
                toast.success(`Approved. ${petName} is now marked as adopted.`);
            } else {
                toast.success("Application declined.");
            }
        } catch (err) {
            console.error("Error updating application:", err);
            toast.error("Network error. Please try again.");
        } finally {
            setSaving(false);
            setConfirmApprove(false);
        }
    };

    if (!petId) {
        return (
            <div className="min-h-[60vh] bg-[#F5F4F1] flex items-center justify-center px-4">
                <div className="bg-white border border-[#E6E4DF] rounded-2xl p-10 text-center max-w-sm w-full">
                    <p className="text-sm text-[#52525B] mb-5">This link is missing a pet. Open applications from your listings.</p>
                    <Link href="/my-listings" className="bg-primary text-white px-6 min-h-[46px] rounded-xl font-semibold text-sm inline-flex items-center">My listings</Link>
                </div>
            </div>
        );
    }

    const listingStatus = pet ? getListingStatus(pet) : null;
    const photo = pet?.images?.[0]?.image_url || "/dog-placeholder.png";
    const traits = pet
        ? ([
              pet.vaccinated && "Vaccinated",
              pet.neutered && "Neutered",
              (pet.min_age_of_children ?? 0) > 0 && `Kids ${pet.min_age_of_children}+`,
              pet.can_live_with_dogs && "Good with dogs",
              pet.can_live_with_cats && "Good with cats",
              `${formatFee(pet.price)}${formatFee(pet.price) === "Free" ? " adoption" : ""}`,
          ].filter(Boolean) as string[])
        : [];
    const meta = pet
        ? [pet.pet_breed || "Mixed breed", pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : null, formatAge(pet.age_months), [pet.city, pet.area].filter(Boolean).join(", ")]
              .filter(Boolean)
              .join(" · ")
        : "";

    const fit = current ? assessFit(current, pet) : [];
    const assessed = fit.filter((f) => f.verdict !== null);
    const fitsCount = assessed.filter((f) => f.verdict === "fits").length;
    const currentStatus = current ? statusOf(current) : "pending";
    const firstName = current?.adopter_name?.split(" ")[0] || "this applicant";
    const otherPending = apps.filter((a) => statusOf(a) === "pending" && a.adoption_id !== current?.adoption_id).length;

    return (
        <main className="min-h-screen bg-[#F5F4F1] text-[#18181B]">
            {/* Header: light pet summary with a primary-colour stats strip */}
            <section aria-label="Listing overview" className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 flex flex-col gap-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-[#6B6B73]">
                    <Link href="/my-listings" className="inline-flex items-center gap-1.5 min-h-[44px] hover:text-[#18181B] transition-colors">
                        <ChevronLeft size={16} aria-hidden="true" />
                        My listings
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-[#18181B] font-semibold truncate">{petName}</span>
                    <span aria-hidden="true">/</span>
                    <span>Applications</span>
                </nav>

                <div className="flex flex-wrap items-center gap-7">
                    <img
                        src={photo}
                        alt={petName}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/dog-placeholder.png"; }}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shrink-0 bg-[#ECE8E1]"
                    />
                    <div className="flex-1 basis-[320px] min-w-0 flex flex-col gap-2.5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[#6B6B73]">
                                {pet ? listingKindLabel(pet.listing_type, pet.pet_type) : "Adoption"}
                            </span>
                            {listingStatus && (
                                <span className="inline-flex items-center gap-1.5 bg-white border border-[#E6E4DF] text-[#18181B] rounded-full pl-2.5 pr-3 py-1 text-xs font-semibold">
                                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: LISTING_STATUS_META[listingStatus].dot }} />
                                    {LISTING_STATUS_META[listingStatus].label}
                                </span>
                            )}
                        </div>
                        <h1 className="text-[32px] lg:text-[44px] leading-[1.05] font-semibold tracking-[-0.025em] truncate">{petName}</h1>
                        {meta && <p className="text-[15px] text-[#52525B]">{meta}</p>}
                        {traits.length > 0 && (
                            <ul className="mt-1 flex flex-wrap gap-1.5">
                                {traits.map((t) => (
                                    <li key={t} className="text-xs font-medium text-[#3F3F46] bg-white border border-[#E6E4DF] rounded-full px-2.5 py-1">{t}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="flex gap-2.5 flex-wrap">
                        {listingStatus === "live" && (
                            <Link
                                href={`/browse-pets/${petId}`}
                                className="inline-flex items-center gap-2 min-h-[44px] px-[18px] rounded-xl bg-white border border-[#D9D6D0] text-sm font-semibold hover:border-[#A1A1AA] transition-colors"
                            >
                                <ExternalLink size={16} aria-hidden="true" />
                                Public page
                            </Link>
                        )}
                        <Link
                            href="/my-listings"
                            className="inline-flex items-center gap-2 min-h-[44px] px-[18px] rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            Manage listings
                        </Link>
                    </div>
                </div>

                <dl className="grid grid-cols-2 lg:grid-cols-4 bg-primary text-white rounded-[18px] overflow-hidden">
                    {[
                        { label: "Applications", value: applications ? apps.length : "–" },
                        { label: "Awaiting review", value: applications ? counts.pending : "–" },
                        { label: "Listed", value: pet?.created_at ? formatShortDate(pet.created_at) : "–" },
                        { label: "Photos", value: pet?.images?.length ?? "–" },
                    ].map((s, i) => (
                        <div key={s.label} className={`px-5 sm:px-6 py-5 flex flex-col gap-1.5 border-white/15 ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                            <dt className="text-[13px] text-white/75">{s.label}</dt>
                            <dd className="text-[26px] leading-tight font-semibold tracking-[-0.02em] tabular-nums">{s.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-24">
                {error ? (
                    <div className="bg-white border border-[#E6E4DF] rounded-[18px] px-6 py-14 text-center">
                        <p className="text-[#B91C1C] text-sm">{error}</p>
                    </div>
                ) : !applications ? (
                    <div className="flex justify-center items-center min-h-[40vh]">
                        <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading applications" />
                    </div>
                ) : apps.length === 0 ? (
                    <div className="bg-white border border-[#E6E4DF] rounded-[18px] px-6 py-20 text-center flex flex-col items-center gap-2">
                        <h2 className="text-lg font-semibold">No applications yet</h2>
                        <p className="text-sm text-[#6B6B73] max-w-sm">When someone applies to adopt {petName}, you&apos;ll be able to review their answers here.</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* Applicant list */}
                        <section aria-label="Applicants" className="w-full lg:w-[380px] lg:shrink-0 flex flex-col gap-4">
                            <div role="tablist" aria-label="Filter applications" className="flex flex-wrap gap-x-[22px] border-b border-[#E2E0DB]">
                                {TABS.map((t) => {
                                    const active = tab === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setTab(t.key)}
                                            className={`-mb-px border-b-2 pt-2.5 pb-3 min-h-[44px] text-sm font-semibold inline-flex items-center gap-[7px] transition-colors ${
                                                active ? "border-[#18181B] text-[#18181B]" : "border-transparent text-[#6B6B73] hover:text-[#18181B]"
                                            }`}
                                        >
                                            {t.label}
                                            <span className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center tabular-nums ${active ? "bg-[#18181B] text-white" : "bg-[#E9E7E3] text-[#52525B]"}`}>
                                                {counts[t.key]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <ul className="bg-white border border-[#E6E4DF] rounded-[18px] overflow-hidden">
                                {shown.length === 0 && (
                                    <li className="px-5 py-10 text-center text-sm text-[#6B6B73]">No applications in this view.</li>
                                )}
                                {shown.map((app) => {
                                    const index = apps.indexOf(app);
                                    const isCurrent = app.adoption_id === current?.adoption_id;
                                    const rows = assessFit(app, pet).filter((f) => f.verdict !== null);
                                    const ok = rows.filter((f) => f.verdict === "fits").length;
                                    return (
                                        <li key={app.adoption_id} className="border-b border-[#EEECE8] last:border-b-0">
                                            <button
                                                type="button"
                                                onClick={() => select(app.adoption_id)}
                                                aria-current={isCurrent ? "true" : undefined}
                                                className={`w-full text-left px-[18px] py-4 flex items-start gap-3.5 transition-colors ${isCurrent ? "bg-[#F4F3EF]" : "bg-white hover:bg-[#FAFAF8]"}`}
                                            >
                                                <Avatar app={app} index={index} size="sm" />
                                                <span className="flex-1 min-w-0 flex flex-col gap-1">
                                                    <span className="flex items-center justify-between gap-2.5">
                                                        <span className="text-[15px] font-semibold truncate">{app.adopter_name}</span>
                                                        <StatusDot status={statusOf(app)} />
                                                    </span>
                                                    <span className="text-[13px] text-[#6B6B73] truncate">
                                                        {formatShortDate(app.created_at)}{app.adopter_address ? ` · ${app.adopter_address}` : ""}
                                                    </span>
                                                    {rows.length > 0 && (
                                                        <span className="flex items-center gap-2 mt-1">
                                                            <span className="inline-flex gap-[3px]" aria-hidden="true">
                                                                {rows.map((r, i) => (
                                                                    <span key={i} className={`w-3.5 h-1 rounded-sm ${r.verdict === "fits" ? "bg-[#18181B]" : "bg-[#E2E0DB]"}`} />
                                                                ))}
                                                            </span>
                                                            <span className="text-xs font-medium text-[#52525B]">{ok} of {rows.length} fit</span>
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>

                        {/* Application detail */}
                        {current && (
                            <article ref={detailRef} aria-label="Application details" className="w-full flex-1 min-w-0 bg-white border border-[#E6E4DF] rounded-[18px] flex flex-col scroll-mt-4">
                                <div className="pl-5 sm:pl-8 pr-3 py-2.5 flex items-center justify-between gap-3 border-b border-[#EEECE8]">
                                    <span className="text-[13px] font-medium text-[#6B6B73] tabular-nums">
                                        Application {selectedIndex + 1} of {apps.length}
                                    </span>
                                    <div className="flex gap-1">
                                        <button type="button" aria-label="Previous application" onClick={() => step(-1)} className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[#3F3F46] hover:bg-[#F2F1EE] transition-colors">
                                            <ChevronLeft size={18} aria-hidden="true" />
                                        </button>
                                        <button type="button" aria-label="Next application" onClick={() => step(1)} className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[#3F3F46] hover:bg-[#F2F1EE] transition-colors">
                                            <ChevronRight size={18} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>

                                <header className="px-5 sm:px-8 py-7 flex flex-wrap items-center gap-5">
                                    <Avatar app={current} index={selectedIndex} size="lg" />
                                    <div className="flex-1 basis-[240px] min-w-0 flex flex-col gap-1.5">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">{current.adopter_name}</h2>
                                            <span className="border border-[#E6E4DF] rounded-full pl-2.5 pr-3 py-1">
                                                <StatusDot status={currentStatus} />
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#6B6B73]">Applied {formatDateTime(current.created_at)}</p>
                                    </div>
                                    {currentStatus === "pending" && (
                                        <div className="flex gap-2.5 flex-wrap">
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => updateStatus(current.adoption_id, "rejected")}
                                                className="min-h-[46px] px-5 rounded-xl border border-[#D9D6D0] bg-white text-sm font-semibold hover:border-[#A1A1AA] transition-colors disabled:opacity-60"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => setConfirmApprove(true)}
                                                className="min-h-[46px] px-6 rounded-xl bg-primary text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                                            >
                                                <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                                                Approve
                                            </button>
                                        </div>
                                    )}
                                </header>

                                <div className="mx-5 sm:mx-8 px-4 py-3.5 border border-[#E6E4DF] rounded-xl bg-[#FAFAF8] flex gap-3 items-start">
                                    <Info size={18} className="shrink-0 mt-px text-[#52525B]" aria-hidden="true" />
                                    <p className="text-[13px] leading-relaxed text-[#3F3F46]">
                                        {currentStatus === "approved"
                                            ? `You approved ${firstName}. Next, get in touch to arrange a meet-and-greet with ${petName}.`
                                            : currentStatus === "rejected"
                                            ? "This application was declined."
                                            : `Approving ${firstName} marks ${petName} as adopted${otherPending > 0 ? ` and declines the other ${otherPending} pending ${otherPending === 1 ? "application" : "applications"}` : ""}.`}
                                    </p>
                                </div>

                                <div className="px-5 sm:px-8 pt-2 pb-8 flex flex-col">
                                    {/* Fit with the pet's needs */}
                                    <section className="py-6 flex flex-col gap-3.5">
                                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                            <h3 className="text-base font-semibold">How {firstName} fits {petName}&apos;s needs</h3>
                                            {assessed.length > 0 && (
                                                <span className="text-[13px] font-semibold text-[#52525B]">{fitsCount} of {assessed.length} fit</span>
                                            )}
                                        </div>
                                        <div className="border border-[#E6E4DF] rounded-[14px] overflow-hidden">
                                            <div className="hidden sm:grid grid-cols-[0.8fr_1.2fr_1.2fr_88px] gap-4 px-[18px] py-2.5 bg-[#FAFAF8] border-b border-[#EEECE8] text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B6B73]">
                                                <span>Need</span>
                                                <span className="truncate">{petName}</span>
                                                <span className="truncate">{firstName}</span>
                                                <span className="text-right">Fit</span>
                                            </div>
                                            {fit.map((row) => (
                                                <div key={row.need} className="grid grid-cols-[1fr_auto] sm:grid-cols-[0.8fr_1.2fr_1.2fr_88px] gap-x-4 gap-y-1 px-[18px] py-3.5 border-b border-[#F0EEEA] last:border-b-0 items-center text-sm">
                                                    <span className="font-semibold">{row.need}</span>
                                                    <span className="sm:hidden justify-self-end"><VerdictTag verdict={row.verdict} /></span>
                                                    <span className="text-[#52525B] col-span-2 sm:col-span-1"><span className="sm:hidden text-[#6B6B73]">{petName}: </span>{row.pet}</span>
                                                    <span className="font-medium col-span-2 sm:col-span-1 break-words"><span className="sm:hidden font-normal text-[#6B6B73]">{firstName}: </span>{row.them}</span>
                                                    <span className="hidden sm:flex justify-end"><VerdictTag verdict={row.verdict} /></span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {[
                                        {
                                            title: "Household",
                                            fields: [
                                                { label: "Youngest child", value: current.age_of_youngest_child === null || current.age_of_youngest_child === "" ? "No children mentioned" : String(current.age_of_youngest_child) },
                                                { label: "Other pets at home", value: current.other_pets_details || "None" },
                                                { label: "Other pets neutered", value: yesNo(current.other_pets_neutered) },
                                            ],
                                        },
                                        {
                                            title: "Home",
                                            fields: [
                                                { label: "Address", value: current.adopter_address || "Not provided" },
                                                { label: "Secure outdoor area", value: yesNo(current.has_secure_outdoor_area) },
                                                { label: "Where the pet will sleep", value: current.pet_sleep_location || "Not provided" },
                                                { label: "Time left alone", value: current.pet_left_alone || "Not provided" },
                                            ],
                                        },
                                    ].map((section) => (
                                        <section key={section.title} className="py-6 border-t border-[#EEECE8] flex flex-col gap-[18px]">
                                            <h3 className="text-xs font-semibold tracking-[0.08em] uppercase text-[#6B6B73]">{section.title}</h3>
                                            <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-5">
                                                {section.fields.map((f) => (
                                                    <div key={f.label} className="flex flex-col gap-1">
                                                        <dt className="text-[13px] text-[#6B6B73]">{f.label}</dt>
                                                        <dd className="text-[15px] font-medium leading-snug break-words">{f.value}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </section>
                                    ))}

                                    <section className="py-6 border-t border-[#EEECE8] flex flex-col gap-4">
                                        <h3 className="text-xs font-semibold tracking-[0.08em] uppercase text-[#6B6B73]">In their words</h3>
                                        <figure className="flex gap-4">
                                            <Quote size={26} className="shrink-0 text-[#D9D6D0] fill-[#D9D6D0]" aria-hidden="true" />
                                            <blockquote className={`text-[17px] sm:text-lg leading-[1.65] font-medium whitespace-pre-line ${current.additional_details ? "text-[#27272A]" : "text-[#6B6B73]"}`}>
                                                {current.additional_details || "No additional details shared."}
                                            </blockquote>
                                        </figure>
                                    </section>

                                    <section className="pt-6 border-t border-[#EEECE8] flex flex-col gap-4">
                                        <h3 className="text-xs font-semibold tracking-[0.08em] uppercase text-[#6B6B73]">Timeline</h3>
                                        <ol className="flex flex-col">
                                            {[
                                                { title: "Application submitted", when: formatDateTime(current.created_at), dot: "bg-[#18181B]" },
                                                ...(current.agree_to_terms ? [{ title: "Agreed to the Paltuu adoption terms", when: "At submission", dot: "bg-[#18181B]" }] : []),
                                                currentStatus === "approved"
                                                    ? { title: "Approved", when: `${petName} is marked as adopted`, dot: "bg-[#15803D]" }
                                                    : currentStatus === "rejected"
                                                    ? { title: "Declined", when: "Closed", dot: "bg-[#A1A1AA]" }
                                                    : { title: "Waiting on your decision", when: `Pending since ${formatShortDate(current.created_at)}`, dot: "bg-white border-2 border-primary" },
                                            ].map((ev, i, arr) => (
                                                <li key={ev.title} className="flex gap-3.5">
                                                    <span className="flex flex-col items-center w-3 shrink-0">
                                                        <span className={`w-2.5 h-2.5 rounded-full mt-[5px] ${ev.dot}`} />
                                                        {i < arr.length - 1 && <span className="flex-1 w-px bg-[#E6E4DF]" />}
                                                    </span>
                                                    <span className="pb-[18px] flex flex-col gap-0.5">
                                                        <span className="text-sm font-semibold">{ev.title}</span>
                                                        <span className="text-[13px] text-[#6B6B73]">{ev.when}</span>
                                                    </span>
                                                </li>
                                            ))}
                                        </ol>
                                    </section>
                                </div>
                            </article>
                        )}
                    </div>
                )}
            </div>

            {/* Approve confirmation */}
            {confirmApprove && current && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !saving && setConfirmApprove(false)}>
                    <div role="dialog" aria-modal="true" aria-labelledby="approve-title" className="bg-white border border-[#E6E4DF] rounded-2xl p-7 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 id="approve-title" className="text-lg font-semibold mb-2">Approve {current.adopter_name}?</h3>
                        <p className="text-sm leading-relaxed text-[#52525B] mb-6">
                            {petName} will be marked as adopted
                            {otherPending > 0 ? ` and the other ${otherPending} pending ${otherPending === 1 ? "application" : "applications"} will be declined` : ""}.
                            Everyone who applied is notified.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmApprove(false)}
                                disabled={saving}
                                className="flex-1 min-h-[46px] border border-[#D9D6D0] rounded-xl text-sm font-semibold hover:border-[#A1A1AA] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => updateStatus(current.adoption_id, "approved")}
                                disabled={saving}
                                className="flex-1 min-h-[46px] bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                            >
                                {saving ? "Approving..." : "Approve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

const VerdictTag = ({ verdict }: { verdict: Verdict }) => {
    if (verdict === "fits") {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534]">
                <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                Fits
            </span>
        );
    }
    if (verdict === "check") {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#92400E]">
                <AlertCircle size={14} strokeWidth={2.2} aria-hidden="true" />
                Check
            </span>
        );
    }
    return <span className="text-xs font-semibold text-[#6B6B73]">Your call</span>;
};

const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F4F1]">
        <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading applications" />
    </div>
);

const AdoptionApplicants = () => (
    <Suspense fallback={<LoadingFallback />}>
        <AdoptionApplications />
    </Suspense>
);

export default AdoptionApplicants;
