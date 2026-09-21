"use client";

import Link from "next/link";
import { X } from "lucide-react";
import AppStoreBadges from "@/components/home/AppStoreBadges";
import { useAppPromoGate } from "./useAppPromoGate";
import type { AppPromoCopy } from "@/lib/appPromo";

/** Breakpoint at which the banner goes from stacked to a single row. */
const ROW_CLASSES = {
    lg: {
        rail: "lg:inset-y-0 lg:right-auto lg:h-auto lg:w-1",
        closeMobile: "lg:hidden",
        closeRow: "lg:block",
        body: "lg:flex-row lg:items-center lg:gap-6 lg:pl-7 lg:pt-5",
        title: "lg:pr-0",
        ctas: "lg:justify-end lg:flex-nowrap",
    },
    xl: {
        rail: "xl:inset-y-0 xl:right-auto xl:h-auto xl:w-1",
        closeMobile: "xl:hidden",
        closeRow: "xl:block",
        body: "xl:flex-row xl:items-center xl:gap-6 xl:pl-7 xl:pt-5",
        title: "xl:pr-0",
        ctas: "xl:justify-end xl:flex-nowrap",
    },
} as const;

/**
 * An inline, dismissible strip promoting the app. It sits in the page flow —
 * nothing is overlaid and nothing is pushed off screen, so it can go above a
 * listing grid without covering the listings.
 *
 * Responsive shape, and why:
 *
 *   < 640px  One column, heading only — the body copy is hidden because on a
 *            phone the heading is the whole pitch and anything more pushes the
 *            first pet card below the fold. Badges sit at h-9 on their own row.
 *   ≥ 640px  Still one column, but the body copy comes back. Stacking is
 *            deliberate here: side by side, the CTA column (up to four items —
 *            a deep-link button, two store badges and the close button) eats
 *            half the width and wraps the heading into four or five lines.
 *   ≥ 1024px Two columns at last, copy left and CTA right on one unwrapped row.
 *
 * The close button is absolutely positioned top-right while the banner is
 * stacked and folds into the CTA row at lg, so it never overlaps the badges.
 *
 * `wrapperClassName` is the page-level band around the card (background and
 * outer padding). The component renders it rather than the caller so that
 * dismissing the banner removes the padding too — otherwise the landing page
 * is left with a bare gray stripe between two sections.
 */
export default function AppDownloadBanner({
    promo,
    className = "",
    wrapperClassName,
    rowFrom = "lg",
}: {
    promo: AppPromoCopy;
    className?: string;
    wrapperClassName?: string;
    /**
     * Viewport width at which the banner becomes a single row. Pass "xl" where
     * the banner sits in a column narrower than the page — on browse-pets it
     * shares the row with the filter sidebar, so at 1024–1279px it is only
     * ~640px wide and a row layout wraps the heading.
     */
    rowFrom?: keyof typeof ROW_CLASSES;
}) {
    const r = ROW_CLASSES[rowFrom];
    const { open, close } = useAppPromoGate(promo.key, promo.scope);

    if (!open) return null;

    const card = (
        <aside
            className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
            aria-label={promo.title}
        >
            {/* Brand rail. Vertical from sm up, horizontal on phones where a
                4px column next to wrapped text reads as a rendering glitch. */}
            <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1 bg-primary ${r.rail}`}
            />

            <button
                type="button"
                onClick={close}
                aria-label="Dismiss app promotion"
                className={`absolute right-2 top-3 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 ${r.closeMobile}`}
            >
                <X size={16} />
            </button>

            <div className={`flex flex-col gap-4 p-4 pt-5 sm:p-5 sm:pt-6 ${r.body}`}>
                <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {promo.eyebrow}
                    </p>
                    <h2 className={`pr-8 text-base font-extrabold leading-snug text-gray-900 sm:text-lg ${r.title}`}>
                        {promo.title}
                    </h2>
                    <p className="mt-1.5 hidden text-sm leading-relaxed text-gray-600 sm:block">
                        {promo.body}
                    </p>
                </div>

                <div className={`flex shrink-0 flex-wrap items-center gap-3 ${r.ctas}`}>
                    {promo.deepLink && (
                        <Link
                            href={promo.deepLink}
                            className="whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            {promo.deepLinkLabel ?? "Open in the app"}
                        </Link>
                    )}

                    <AppStoreBadges imgClassName="h-9 w-auto sm:h-10" />

                    <button
                        type="button"
                        onClick={close}
                        aria-label="Dismiss app promotion"
                        className={`hidden rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 ${r.closeRow}`}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );

    return wrapperClassName ? <div className={wrapperClassName}>{card}</div> : card;
}
