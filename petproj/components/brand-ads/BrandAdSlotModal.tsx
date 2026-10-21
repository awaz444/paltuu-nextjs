"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import BrandAdSlot, { type AdTier } from "./BrandAdSlot";

export interface BrandAdSlotModalProps {
    tier: AdTier;
    placement: string;
    size: string;
    pitch?: string;
    /** Session-only key so the demo always surfaces it on a fresh tab. */
    sessionKey: string;
    /** Delay in ms before the modal appears, so the page gets to paint first. */
    delayMs?: number;
    /** Optional label for the "continue" button. */
    continueLabel?: string;
}

const STORAGE_PREFIX = "paltuu_brand_ad_modal_";

/**
 * Interstitial variant of BrandAdSlot: a once-per-session modal preview for
 * the Vercel demo. Dismissible three ways (X, backdrop, Continue), never
 * blocks the page under it.
 */
export default function BrandAdSlotModal({
    tier,
    placement,
    size,
    pitch,
    sessionKey,
    delayMs = 400,
    continueLabel = "Continue to page",
}: BrandAdSlotModalProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            if (window.sessionStorage.getItem(STORAGE_PREFIX + sessionKey)) return;
        } catch {
            /* storage blocked; still show. */
        }
        const t = setTimeout(() => setOpen(true), delayMs);
        return () => clearTimeout(t);
    }, [sessionKey, delayMs]);

    if (!open) return null;

    const close = () => {
        try {
            window.sessionStorage.setItem(STORAGE_PREFIX + sessionKey, "1");
        } catch {
            /* non-fatal */
        }
        setOpen(false);
    };

    return (
        <div
            className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 px-4"
            onClick={close}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="absolute right-3 top-3 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                >
                    <X size={16} />
                </button>

                <BrandAdSlot
                    tier={tier}
                    format="banner"
                    placement={placement}
                    size={size}
                    pitch={pitch}
                    dismissible={false}
                    className="min-h-[320px]"
                />

                <button
                    type="button"
                    onClick={close}
                    className="mt-4 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                    {continueLabel}
                </button>
            </div>
        </div>
    );
}
