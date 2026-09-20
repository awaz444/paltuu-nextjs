"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import AppStoreBadges from "@/components/home/AppStoreBadges";
import type { AppPromoCopy } from "@/lib/appPromo";

/**
 * The popup form of the app pitch, for the two moments where a visitor has
 * just committed to something the app does better: starting an adoption
 * application, and creating a listing.
 *
 * It is a presentational component — whether it should be on screen, and
 * remembering that it was closed, is the caller's job (useAppPromoGate). That
 * split matters on the adopt flow, where closing this has to hand off to the
 * adoption form rather than just disappearing.
 *
 * Escape hatches, deliberately three of them: the X, the backdrop, and a
 * full-width "continue on the website" button. Nobody gets stuck behind this
 * on the way to adopting a pet.
 */
export default function AppDownloadModal({
    promo,
    open,
    onClose,
}: {
    promo: AppPromoCopy;
    open: boolean;
    onClose: () => void;
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-promo-title"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-50 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 rounded-2xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                <div className="overflow-y-auto p-7 pt-8">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-8 rounded-full bg-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {promo.eyebrow}
                        </span>
                    </div>

                    <h2
                        id="app-promo-title"
                        className="pr-8 text-2xl font-black leading-tight text-gray-900"
                    >
                        {promo.title}
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{promo.body}</p>

                    {promo.points && (
                        <ul className="mt-5 space-y-2.5">
                            {promo.points.map((point) => (
                                <li key={point} className="flex items-start gap-2.5">
                                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {point}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {promo.deepLink && (
                        <Link
                            href={promo.deepLink}
                            className="mt-6 block rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            {promo.deepLinkLabel ?? "Open in the app"}
                        </Link>
                    )}

                    <AppStoreBadges className="mt-6 justify-center" />
                </div>

                <div className="border-t border-gray-100 p-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                        {promo.dismissLabel}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
