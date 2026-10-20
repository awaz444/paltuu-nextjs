"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type AdTier = 1 | 2 | 3 | 4;

export type AdFormat =
    | "banner"
    | "native-card"
    | "sidebar"
    | "strip"
    | "notification-row"
    | "sponsor-block"
    | "inline-tile";

export interface BrandAdSlotProps {
    tier: AdTier;
    format: AdFormat;
    /** Short name of the slot ("Home hero", "Browse grid card #8"). */
    placement: string;
    /** Target creative size, e.g. "1200×250" or "300×600". */
    size: string;
    /** Short line on who/what this slot suits ("Food brand", "Vet clinic", "Insurance"). */
    pitch?: string;
    className?: string;
    /**
     * Default: visible. Can be dismissed in-session (not persisted) so a demo
     * reload always shows every slot.
     */
    dismissible?: boolean;
}

const TIER_META: Record<AdTier, { label: string; chipClass: string; ringClass: string }> = {
    1: {
        label: "TIER 1 · PREMIUM",
        chipClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        ringClass: "border-emerald-300",
    },
    2: {
        label: "TIER 2 · CONTEXTUAL",
        chipClass: "bg-sky-100 text-sky-800 border-sky-300",
        ringClass: "border-sky-300",
    },
    3: {
        label: "TIER 3 · HIGH-INTENT",
        chipClass: "bg-amber-100 text-amber-800 border-amber-300",
        ringClass: "border-amber-300",
    },
    4: {
        label: "TIER 4 · INTERSTITIAL",
        chipClass: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
        ringClass: "border-fuchsia-300",
    },
};

const FORMAT_HEIGHT: Record<AdFormat, string> = {
    banner: "min-h-[160px] sm:min-h-[200px]",
    "native-card": "min-h-[280px]",
    sidebar: "min-h-[520px]",
    strip: "min-h-[56px] sm:min-h-[72px]",
    "notification-row": "min-h-[88px]",
    "sponsor-block": "min-h-[220px]",
    "inline-tile": "min-h-[180px]",
};

/**
 * Placeholder brand ad slot used on the Vercel preview URL so advertisers can
 * see where their creative would appear. Not meant to ship to production —
 * when a real creative is sold, the slot is replaced by the regular
 * AppPromoImageBanner / AppPromoImageModal pointing at the brand's artwork.
 */
export default function BrandAdSlot({
    tier,
    format,
    placement,
    size,
    pitch,
    className = "",
    dismissible = true,
}: BrandAdSlotProps) {
    const [open, setOpen] = useState(true);
    if (!open) return null;

    const meta = TIER_META[tier];
    const height = FORMAT_HEIGHT[format];

    return (
        <div
            role="complementary"
            aria-label={`Brand ad slot preview — ${placement}`}
            className={`relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-gray-50 px-5 py-6 text-center ${meta.ringClass} ${height} ${className}`}
        >
            {dismissible && (
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Dismiss ad slot"
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-gray-400 shadow-sm hover:bg-white hover:text-gray-700"
                >
                    <X size={14} />
                </button>
            )}

            <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.chipClass}`}
            >
                {meta.label}
            </span>

            <div className="flex flex-col items-center gap-1">
                <div className="text-base font-semibold uppercase tracking-widest text-gray-700 sm:text-lg">
                    Your brand here
                </div>
                <div className="text-sm font-medium text-gray-600">{placement}</div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500">
                <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono">
                    {format}
                </span>
                <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono">
                    {size}
                </span>
                {pitch && (
                    <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5">
                        fits: {pitch}
                    </span>
                )}
            </div>
        </div>
    );
}
