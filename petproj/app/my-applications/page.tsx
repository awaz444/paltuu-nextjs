"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { CheckCircle2, ChevronDown, Clock, Heart, Info, Search } from "lucide-react";
import { formatAge } from "@/utils/formatAge";
import { useAuth } from "@/context/AuthContext";
import { authUrl } from "@/lib/authRedirect";
import {
    APPLICATION_PILL,
    AccountPage,
    ConfirmDialog,
    EmptyState,
    FilterTabs,
    Pill,
    SignInPrompt,
    Spinner,
    btn,
    cardClass,
} from "@/components/account/ui";

type Status = "pending" | "approved" | "rejected";
type FilterKey = "all" | Status;

interface Application {
    application_type: "foster" | "adoption";
    application_id: string;
    pet_id: string;
    status: string | null;
    created_at: string;
    pet_name: string;
    breed: string | null;
    city_name: string | null;
    area: string | null;
    age_months: number | null;
    adoption_status: string | null;
    image_url: string | null;
    // The applicant's own answers (adoption)
    adopter_name?: string | null;
    adopter_address?: string | null;
    contact_number?: string | null;
    // The applicant's own answers (foster)
    fosterer_name?: string | null;
    fosterer_address?: string | null;
    foster_start_date?: string | null;
    foster_end_date?: string | null;
    fostering_experience?: string | null;
    time_at_home?: string | null;
    reason_for_fostering?: string | null;
    // Shared
    age_of_youngest_child?: string | number | null;
    other_pets_details?: string | null;
    other_pets_neutered?: boolean | null;
    has_secure_outdoor_area?: boolean | null;
    pet_sleep_location?: string | null;
    pet_left_alone?: string | null;
    additional_details?: string | null;
}

const normaliseStatus = (s: string | null | undefined): Status => {
    const v = (s || "pending").toLowerCase();
    return v === "approved" || v === "rejected" ? v : "pending";
};

const fmtDate = (value: string | null | undefined) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return format(d, d.getFullYear() === new Date().getFullYear() ? "d MMM" : "d MMM yyyy");
};

const hasText = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== "";

/** The applicant's submitted answers as label/value pairs, empty ones dropped. */
function answersFor(app: Application): { label: string; value: string; wide?: boolean }[] {
    const rows: { label: string; value: string; wide?: boolean }[] = [];
    const push = (label: string, value: unknown, wide = false) => {
        if (hasText(value)) rows.push({ label, value: String(value).trim(), wide });
    };
    const yesNo = (v: boolean | null | undefined) => (v === true ? "Yes" : v === false ? "No" : null);

    if (app.application_type === "foster") {
        push("Name", app.fosterer_name);
        push("Phone", app.contact_number);
        push("Address", app.fosterer_address, true);
        const start = fmtDate(app.foster_start_date);
        const end = fmtDate(app.foster_end_date);
        if (start || end) push("Foster dates", [start, end].filter(Boolean).join(" to "));
        push("Time at home", app.time_at_home);
        push("Fostering experience", app.fostering_experience, true);
        push("Why you want to foster", app.reason_for_fostering, true);
    } else {
        push("Name", app.adopter_name);
        push("Phone", app.contact_number);
        push("Address", app.adopter_address, true);
    }

    push("Youngest child", app.age_of_youngest_child);
    push("Where the pet will sleep", app.pet_sleep_location);
    push("Time left alone", app.pet_left_alone);
    push("Secure outdoor area", yesNo(app.has_secure_outdoor_area));
    push("Other pets", app.other_pets_details, true);
    if (hasText(app.other_pets_details)) push("Other pets neutered", yesNo(app.other_pets_neutered));
    push("Anything else", app.additional_details, true);
    return rows;
}

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<FilterKey>("all");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [withdrawTarget, setWithdrawTarget] = useState<Application | null>(null);
    const [withdrawing, setWithdrawing] = useState(false);

    const { user, isAuthenticated, isHydrating } = useAuth();
    const lastFetchedUserId = useRef<string | null>(null);
    const isFetching = useRef(false);

    const fetchApplications = useCallback(async () => {
        if (!isAuthenticated || !user) {
            if (!isHydrating) setLoading(false);
            return;
        }
        if (isFetching.current || lastFetchedUserId.current === user.id) return;

        try {
            isFetching.current = true;
            setLoading(true);
            setError(null);
            const res = await fetch("/api/v1/applications/my", {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                setError(res.status === 401 ? "Your session has expired. Please sign in again." : errorData.error || "We couldn't load your applications.");
                return;
            }
            const data = await res.json();
            const list: Application[] = data.applications || [];
            list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setApplications(list);
            lastFetchedUserId.current = user.id || null;
        } catch {
            setError("We couldn't load your applications.");
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [isAuthenticated, user, isHydrating]);

    useEffect(() => {
        if (!isHydrating) fetchApplications();
    }, [isAuthenticated, user, isHydrating, fetchApplications]);

    const retry = () => {
        lastFetchedUserId.current = null;
        fetchApplications();
    };

    const handleWithdraw = async () => {
        if (!withdrawTarget) return;
        const { application_id, application_type, pet_name } = withdrawTarget;
        setWithdrawing(true);
        try {
            const res = await fetch(
                `/api/v1/applications/my?application_id=${encodeURIComponent(application_id)}&type=${encodeURIComponent(application_type)}`,
                { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" } }
            );
            if (!res.ok) {
                const { error: errMsg } = await res.json().catch(() => ({ error: null }));
                toast.error(errMsg || "We couldn't withdraw your application.");
                return;
            }
            setApplications((prev) => prev.filter((a) => !(a.application_id === application_id && a.application_type === application_type)));
            toast.success(`Application for ${pet_name} withdrawn`);
            setWithdrawTarget(null);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setWithdrawing(false);
        }
    };

    const counts = useMemo(() => {
        const c = { pending: 0, approved: 0, rejected: 0 };
        applications.forEach((a) => {
            c[normaliseStatus(a.status)] += 1;
        });
        return c;
    }, [applications]);

    const visible = useMemo(
        () => (filter === "all" ? applications : applications.filter((a) => normaliseStatus(a.status) === filter)),
        [applications, filter]
    );

    if (isHydrating || (loading && isAuthenticated)) {
        return (
            <AccountPage title="My applications">
                <Spinner label="Loading your applications" />
            </AccountPage>
        );
    }

    if (!isAuthenticated || !user) {
        return <SignInPrompt message="Sign in to see the pets you've applied for." next={authUrl("/my-applications")} />;
    }

    const subtitleParts = [
        counts.pending > 0 && `${counts.pending} waiting on the owner`,
        counts.approved > 0 && `${counts.approved} approved`,
        counts.rejected > 0 && `${counts.rejected} declined`,
    ].filter(Boolean);
    const subtitle = subtitleParts.length > 0 ? subtitleParts.join(" · ") : "Pets you've applied to adopt or foster";

    return (
        <AccountPage title="My applications" subtitle={error ? undefined : subtitle}>
            {error ? (
                <EmptyState
                    icon={<Info size={22} />}
                    title="Couldn't load your applications"
                    body={error}
                    action={
                        <button type="button" onClick={retry} className={btn.secondary}>
                            Try again
                        </button>
                    }
                />
            ) : applications.length === 0 ? (
                <EmptyState
                    icon={<Heart size={22} />}
                    title="No applications yet"
                    body="When you apply to adopt or foster a pet, you can follow it here."
                    action={
                        <Link href="/browse-pets" className={btn.primary}>
                            Browse pets
                        </Link>
                    }
                />
            ) : (
                <>
                    <div className="mb-5">
                        <FilterTabs<FilterKey>
                            label="Filter applications"
                            value={filter}
                            onChange={setFilter}
                            tabs={[
                                { key: "all", label: "All", count: applications.length },
                                { key: "pending", label: "Pending", count: counts.pending },
                                { key: "approved", label: "Approved", count: counts.approved },
                                { key: "rejected", label: "Declined", count: counts.rejected },
                            ]}
                        />
                    </div>

                    {visible.length === 0 ? (
                        <EmptyState
                            title={`No ${filter === "rejected" ? "declined" : filter} applications`}
                            action={
                                <button type="button" onClick={() => setFilter("all")} className={btn.secondary}>
                                    Show all
                                </button>
                            }
                        />
                    ) : (
                        <ul className="space-y-3">
                            {visible.map((app) => {
                                const key = `${app.application_type}-${app.application_id}`;
                                return (
                                    <li key={key}>
                                        <ApplicationCard
                                            app={app}
                                            open={!!expanded[key]}
                                            onToggle={() => setExpanded((p) => ({ ...p, [key]: !p[key] }))}
                                            onWithdraw={() => setWithdrawTarget(app)}
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </>
            )}

            <ConfirmDialog
                open={!!withdrawTarget}
                title="Withdraw application?"
                body={`Withdraw your application for ${withdrawTarget?.pet_name ?? "this pet"}? The owner won't see it any more. This can't be undone.`}
                confirmLabel="Withdraw"
                busyLabel="Withdrawing…"
                tone="danger"
                busy={withdrawing}
                onConfirm={handleWithdraw}
                onCancel={() => !withdrawing && setWithdrawTarget(null)}
            />
        </AccountPage>
    );
}

function ApplicationCard({
    app,
    open,
    onToggle,
    onWithdraw,
}: {
    app: Application;
    open: boolean;
    onToggle: () => void;
    onWithdraw: () => void;
}) {
    const status = normaliseStatus(app.status);
    const pill = APPLICATION_PILL[status];
    const petHref = `/browse-pets/${app.pet_id}`;
    const answers = answersFor(app);
    const answersId = `answers-${app.application_type}-${app.application_id}`;
    const meta = [app.breed, app.age_months !== null && app.age_months !== undefined ? formatAge(app.age_months) : null, app.city_name]
        .filter(hasText)
        .join(" · ");
    const petAdopted = (app.adoption_status || "").toLowerCase() === "adopted";

    let nextStep: { icon: ReactNode; text: string; className: string };
    if (status === "approved") {
        nextStep = {
            icon: <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />,
            text: "The owner approved you. Contact them to arrange a meet-and-greet.",
            className: "bg-green-50 text-green-800",
        };
    } else if (status === "rejected") {
        nextStep = {
            icon: <Info size={16} className="mt-0.5 shrink-0 text-gray-500" />,
            text: petAdopted ? `The owner chose another home. ${app.pet_name} has found a family.` : "The owner chose another home.",
            className: "bg-gray-50 text-gray-700",
        };
    } else {
        nextStep = {
            icon: <Clock size={16} className="mt-0.5 shrink-0 text-amber-600" />,
            text: "Waiting for the owner to review your application.",
            className: "bg-amber-50/60 text-gray-700",
        };
    }

    return (
        <article className={`${cardClass} overflow-hidden`}>
            <div className="p-4 sm:p-5">
            <div className="flex gap-3 sm:gap-4">
                <Link href={petHref} className="shrink-0" aria-label={`View ${app.pet_name}`}>
                    <img
                        src={app.image_url || "/dog-placeholder.png"}
                        alt=""
                        className="h-16 w-16 rounded-lg bg-gray-100 object-cover sm:h-20 sm:w-20"
                        onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.src.endsWith("/dog-placeholder.png")) img.src = "/dog-placeholder.png";
                        }}
                    />
                </Link>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <Link href={petHref} className="line-clamp-2 break-words text-base font-semibold leading-snug text-gray-900 hover:text-primary">
                                {app.pet_name}
                            </Link>
                            {meta && <p className="mt-0.5 text-sm text-gray-600">{meta}</p>}
                        </div>
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        {app.application_type === "foster" ? "Foster" : "Adoption"} application · Applied {fmtDate(app.created_at)}
                    </p>
                </div>
            </div>

            <p className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${nextStep.className}`}>
                {nextStep.icon}
                <span>{nextStep.text}</span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                {status === "approved" && (
                    <Link href={petHref} className={btn.smPrimary}>
                        Contact owner
                    </Link>
                )}
                <Link href={petHref} className={btn.smSecondary}>
                    View pet
                </Link>
                {status === "rejected" && (
                    <Link href="/browse-pets" className={btn.smSecondary}>
                        <Search size={14} />
                        Find similar pets
                    </Link>
                )}
                {status === "pending" && (
                    <button
                        type="button"
                        onClick={onWithdraw}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
                        Withdraw
                    </button>
                )}
            </div>
            </div>

            {answers.length > 0 && (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    aria-controls={answersId}
                    className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:px-5">
                    Your answers
                    <ChevronDown size={18} className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
            )}

            {open && answers.length > 0 && (
                <dl id={answersId} className="grid grid-cols-1 gap-x-4 gap-y-3 border-t border-gray-100 bg-gray-50/60 px-4 py-4 sm:grid-cols-2 sm:px-5">
                    {answers.map((a) => (
                        <div key={a.label} className={`min-w-0 ${a.wide ? "sm:col-span-2" : ""}`}>
                            <dt className="text-xs text-gray-500">{a.label}</dt>
                            <dd className="whitespace-pre-line break-words text-sm font-medium text-gray-900">{a.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </article>
    );
}
