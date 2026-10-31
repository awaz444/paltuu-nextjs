"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type AdFormat =
    | "banner"
    | "native-card"
    | "sidebar"
    | "strip"
    | "notification-row"
    | "sponsor-block"
    | "inline-tile";

export interface BrandAdSlotProps {
    /** Monthly price for this slot, in PKR. */
    price: number;
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
 * see where their creative would appear. When a real creative is sold, replace
 * the slot with a flat image + link pointing at the brand's artwork.
 */
export default function BrandAdSlot({
    price,
    format,
    placement,
    size,
    pitch,
    className = "",
    dismissible = true,
}: BrandAdSlotProps) {
    const [open, setOpen] = useState(true);
    if (!open) return null;

    const height = FORMAT_HEIGHT[format];

    return (
        <div
            role="complementary"
            aria-label={`Brand ad slot preview — ${placement}`}
            className={`relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-gray-50 px-5 py-6 text-center border-[#A03048]/40 ${height} ${className}`}
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
                className="inline-flex items-center gap-1 rounded-full border border-[#A03048]/30 bg-[#A03048]/10 px-3 py-1 text-xs font-semibold text-[#A03048]"
            >
                PKR {price.toLocaleString("en-US")} / month
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
