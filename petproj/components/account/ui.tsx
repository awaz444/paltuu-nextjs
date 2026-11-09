"use client";

// Shared building blocks for the signed-in pages (My Listings, My Applications,
// Notifications, Create Listing) and the pet page modals (PALTU-141).
//
// They copy the approved look of Browse Pets and the pet page: a gray-50 page,
// a max-w-6xl container, white rounded-xl cards with a gray-200 border, small
// gray labels, h-11 rounded-lg buttons and bg-primary for the theme colour.
// No heavy black type, no hardcoded maroon (ApplyThemeColor recolours primary).

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

// ── Class strings ────────────────────────────────────────────────────────────

export const cardClass = "rounded-xl border border-gray-200 bg-white";

const btnBase =
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const btn = {
    primary: `${btnBase} h-11 bg-primary px-4 text-white hover:opacity-90`,
    outline: `${btnBase} h-11 border border-primary px-4 text-primary hover:bg-primary-soft`,
    secondary: `${btnBase} h-11 border border-gray-300 bg-white px-4 text-gray-800 hover:border-primary hover:text-primary`,
    danger: `${btnBase} h-11 bg-red-600 px-4 text-white hover:bg-red-700`,
    ghost: `${btnBase} h-9 px-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900`,
    /** Smaller buttons for rows inside a card. */
    smPrimary: `${btnBase} h-9 bg-primary px-3.5 text-white hover:opacity-90`,
    smSecondary: `${btnBase} h-9 border border-gray-300 bg-white px-3.5 text-gray-800 hover:border-primary hover:text-primary`,
};

export const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-tint";
export const inputErrorClass = "border-red-400 focus:border-red-500 focus:ring-red-100";

// ── Layout ───────────────────────────────────────────────────────────────────

const ACCOUNT_LINKS = [
    { href: "/my-listings", label: "My listings", short: "Listings" },
    { href: "/my-applications", label: "My applications", short: "Applications" },
    { href: "/notifications", label: "Notifications", short: "Notifications" },
];

/** Links between the three account pages, so they read as one place. */
export function AccountNav({ badges }: { badges?: Partial<Record<string, number>> }) {
    const pathname = usePathname();
    return (
        <nav aria-label="Your account" className="-mb-px grid grid-cols-3 sm:flex sm:gap-6">
            {ACCOUNT_LINKS.map((l) => {
                const active = pathname === l.href;
                const badge = badges?.[l.href] ?? 0;
                return (
                    <Link
                        key={l.href}
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex min-w-0 items-center justify-center gap-1.5 border-b-2 pb-3 text-[13px] font-semibold transition-colors sm:justify-start sm:text-sm ${
                            active ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}>
                        <span className="truncate sm:hidden">{l.short}</span>
                        <span className="hidden sm:inline">{l.label}</span>
                        {badge > 0 && (
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white tabular-nums">
                                {badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

/**
 * Page frame for the account pages: white header band with title, subline,
 * actions and the account links, then the gray body.
 */
export function AccountPage({
    title,
    subtitle,
    actions,
    badges,
    children,
}: {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    badges?: Partial<Record<string, number>>;
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-gray-50">
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-6xl px-4 pt-6 md:px-8 md:pt-8">
                    <div className="flex flex-wrap items-end justify-between gap-3 pb-4 sm:gap-4 sm:pb-5">
                        <div className="min-w-0">
                            <h1 className="text-2xl font-semibold leading-tight text-gray-900 md:text-[28px]">{title}</h1>
                            {subtitle && <p className="mt-1.5 text-sm text-gray-600">{subtitle}</p>}
                        </div>
                        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                    </div>
                    <AccountNav badges={badges} />
                </div>
            </div>
            <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pt-8">{children}</div>
        </main>
    );
}

/** Section heading inside a page: semibold title with an optional subline and link. */
export function SectionHeading({
    title,
    subtitle,
    aside,
    id,
}: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    aside?: React.ReactNode;
    id?: string;
}) {
    return (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
                <h2 id={id} className="text-lg font-semibold text-gray-900 md:text-xl">
                    {title}
                </h2>
                {subtitle && <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>}
            </div>
            {aside}
        </div>
    );
}

// ── Small pieces ─────────────────────────────────────────────────────────────

export type PillTone = "primary" | "green" | "amber" | "gray" | "red";
const PILL_TONES: Record<PillTone, string> = {
    primary: "bg-primary-tint text-primary",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
    red: "bg-red-50 text-red-600",
};

/** Same shape as the "Available for Adoption" badge on the pet page. */
export function Pill({ tone = "gray", children, className = "" }: { tone?: PillTone; children: React.ReactNode; className?: string }) {
    return (
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${PILL_TONES[tone]} ${className}`}>
            {children}
        </span>
    );
}

/** Listing status → pill. */
export const LISTING_PILL: Record<string, { tone: PillTone; label: string }> = {
    live: { tone: "green", label: "Live" },
    review: { tone: "amber", label: "In review" },
    paused: { tone: "gray", label: "Paused" },
    adopted: { tone: "primary", label: "Adopted" },
};

/** Application status → pill. */
export const APPLICATION_PILL: Record<string, { tone: PillTone; label: string }> = {
    pending: { tone: "amber", label: "Pending" },
    approved: { tone: "green", label: "Approved" },
    rejected: { tone: "gray", label: "Declined" },
};

export interface FilterTab<K extends string> {
    key: K;
    label: string;
    count?: number;
}

/** Rounded filter chips, as on the profile page. */
export function FilterTabs<K extends string>({
    tabs,
    value,
    onChange,
    label,
}: {
    tabs: FilterTab<K>[];
    value: K;
    onChange: (key: K) => void;
    label: string;
}) {
    return (
        <div
            role="tablist"
            aria-label={label}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => {
                const active = t.key === value;
                return (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(t.key)}
                        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                            active
                                ? "border-primary bg-primary-tint text-primary"
                                : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary"
                        }`}>
                        {t.label}
                        {typeof t.count === "number" && (
                            <span className={`text-xs tabular-nums ${active ? "text-primary" : "text-gray-400"}`}>{t.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
    return (
        <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" role="status" aria-label={label} />
        </div>
    );
}

export function EmptyState({
    icon,
    title,
    body,
    action,
}: {
    icon?: React.ReactNode;
    title: string;
    body?: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className={`${cardClass} flex flex-col items-center px-6 py-14 text-center`}>
            {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary">{icon}</div>}
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {body && <p className="mt-1 max-w-sm text-sm text-gray-600">{body}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

/** Shown on account pages to signed-out visitors. */
export function SignInPrompt({ message, next }: { message: string; next: string }) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className={`${cardClass} w-full max-w-sm p-8 text-center`}>
                <p className="mb-5 text-sm text-gray-600">{message}</p>
                <Link href={next} className={btn.primary}>
                    Sign in
                </Link>
            </div>
        </main>
    );
}

/** Round photo or initials. */
export function Avatar({ src, name, size = 40 }: { src?: string | null; name?: string | null; size?: number }) {
    const [failed, setFailed] = React.useState(false);
    const initials =
        (name || "?")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((p) => p[0])
            .filter((_, i, a) => i === 0 || i === a.length - 1)
            .join("")
            .toUpperCase() || "?";
    const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
    if (src && !failed) {
        return <img src={src} alt="" onError={() => setFailed(true)} style={style} className="shrink-0 rounded-full bg-gray-100 object-cover" />;
    }
    return (
        <span style={style} aria-hidden="true" className="flex shrink-0 items-center justify-center rounded-full bg-primary-tint font-semibold text-primary">
            {initials}
        </span>
    );
}

// ── Dialogs ──────────────────────────────────────────────────────────────────

/**
 * One modal for the whole flow: a white rounded-2xl panel with a plain header,
 * scrolling body and an optional footer. Bottom sheet on phones.
 */
export function Modal({
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = "md",
    closeDisabled = false,
    scrollKey,
}: {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg";
    closeDisabled?: boolean;
    /** Changing this scrolls the body back to the top (e.g. the step of a form). */
    scrollKey?: string | number;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bodyRef.current?.scrollTo({ top: 0 });
    }, [scrollKey]);
    // Callers often pass inline handlers; keep the latest in refs so the effect
    // below runs only when the modal opens, and never pulls focus out of a field.
    const onCloseRef = useRef(onClose);
    const closeDisabledRef = useRef(closeDisabled);
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !closeDisabledRef.current) onCloseRef.current();
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panelRef.current?.focus();
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);

    if (!open) return null;
    const width = size === "sm" ? "sm:max-w-sm" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg";

    return (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !closeDisabled && onClose()} aria-hidden="true" />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:max-h-[88vh] sm:rounded-2xl ${width}`}>
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold leading-snug text-gray-900">{title}</h2>
                        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={closeDisabled}
                        aria-label="Close"
                        className="-mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900">
                        <X size={18} />
                    </button>
                </div>
                <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
                {footer && <div className="border-t border-gray-100 px-5 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>{footer}</div>}
            </div>
        </div>
    );
}

/** Yes/no question before something that can't be undone. */
export function ConfirmDialog({
    open,
    title,
    body,
    confirmLabel,
    busyLabel,
    tone = "primary",
    busy,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    body: React.ReactNode;
    confirmLabel: string;
    busyLabel?: string;
    tone?: "primary" | "danger";
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <Modal
            open={open}
            onClose={onCancel}
            title={title}
            size="sm"
            closeDisabled={busy}
            footer={
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={onCancel} disabled={busy} className={btn.secondary}>
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} disabled={busy} className={tone === "danger" ? btn.danger : btn.primary}>
                        {busy ? busyLabel || "Saving…" : confirmLabel}
                    </button>
                </div>
            }>
            <div className="text-sm leading-relaxed text-gray-600">{body}</div>
        </Modal>
    );
}

// ── Form fields ──────────────────────────────────────────────────────────────

export function Field({
    label,
    hint,
    error,
    required,
    children,
    htmlFor,
}: {
    label: React.ReactNode;
    hint?: React.ReactNode;
    error?: string | null;
    required?: boolean;
    children: React.ReactNode;
    htmlFor?: string;
}) {
    return (
        <div>
            <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-gray-600">
                {label}
                {required && <span className="text-primary"> *</span>}
            </label>
            {children}
            {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
    );
}

/** Two or more mutually exclusive options as buttons (sex, listing type). */
export function Segmented<V extends string>({
    options,
    value,
    onChange,
    label,
}: {
    options: { value: V; label: string }[];
    value: V;
    onChange: (v: V) => void;
    label: string;
}) {
    return (
        <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-2">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(o.value)}
                        className={`h-11 rounded-lg border px-3 text-sm font-medium transition-colors ${
                            active ? "border-primary bg-primary-soft text-primary" : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}>
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/** A toggleable chip, same look as the tags on the pet page. */
export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`rounded-md border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                selected ? "border-primary bg-primary-tint text-primary" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}>
            {children}
        </button>
    );
}

/** Checkbox row with a label and optional description. */
export function CheckRow({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: React.ReactNode;
    description?: React.ReactNode;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300">
            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">{label}</span>
                {description && <span className="mt-0.5 block text-xs text-gray-500">{description}</span>}
            </span>
        </label>
    );
}

/** Thin step indicator: "Step 2 of 3 · Your home" with a bar. */
export function StepBar({ step, total, label }: { step: number; total: number; label: string }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-900">{label}</span>
                <span className="text-gray-500 tabular-nums">
                    Step {step} of {total}
                </span>
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
                {Array.from({ length: total }).map((_, i) => (
                    <span key={i} className={`h-1 rounded-full ${i < step ? "bg-primary" : "bg-gray-200"}`} />
                ))}
            </div>
        </div>
    );
}
