"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

export interface AppPromoImageModalSpec {
    href: string;
    alt: string;
    /** One square asset, used at both widths below — see the component doc. */
    image: { src: string; width: number; height: number };
    dismissLabel: string;
}

/**
 * The popup form of the flat-image promo, for the adopt and create-listing
 * interstitials.
 *
 * Only one image is needed, not two. The modal's own width already only ever
 * takes two values — capped at 380px on phones, 448px from the sm breakpoint
 * up (an 18% difference) — so one square asset scaling between those two
 * widths looks identical to a human eye. A dedicated "mobile" composition
 * would be solving a problem that doesn't exist here; it does for the inline
 * banners (AppPromoImageBanner), where mobile and desktop differ by more than
 * 2x and call for genuinely different compositions.
 *
 * Everything around the image is our chrome, not the designer's: the
 * backdrop, the rounded card, the X (floated on top of the artwork, not part
 * of it), and the "continue on the website" footer. The image is the only
 * thing that needs a redesign if the pitch changes.
 */
export default function AppPromoImageModal({
    promo,
    open,
    onClose,
}: {
    promo: AppPromoImageModalSpec;
    open: boolean;
    onClose: () => void;
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={promo.alt}
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
                className="relative flex w-full max-w-[380px] flex-col overflow-hidden rounded-[2rem] border border-gray-50 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] sm:max-w-[448px]"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 z-10 rounded-full bg-white/85 p-2 text-gray-500 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-gray-900"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                <Link href={promo.href} aria-label={promo.alt} onClick={onClose}>
                    <img
                        src={promo.image.src}
                        alt={promo.alt}
                        width={promo.image.width}
                        height={promo.image.height}
                        className="block h-auto w-full"
                    />
                </Link>

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
