"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useAppPromoGate } from "./useAppPromoGate";
import type { PromoScope } from "@/lib/appPromo";

export interface AppPromoImageSpec {
    /** Storage key — see useAppPromoGate. */
    key: string;
    scope: PromoScope;
    /** Where the whole banner links to. There is no separate per-badge link:
     *  this is one flat image, so it is one click target. */
    href: string;
    /** Accessible name for the link — the image has no visible alt text of its own. */
    alt: string;
    /** Design canvas for the < 640px state. `width` doubles as the max-width
     *  cap: below 640px the image is never displayed wider than this, it only
     *  ever scales down for narrower phones. */
    mobile: { src: string; width: number; height: number };
    /** Design canvas for the >= 640px state, same rule. */
    desktop: { src: string; width: number; height: number };
}

/**
 * A flat, dismissible, single-image banner — the whole box is one artwork and
 * one link. No text or buttons are laid over it.
 *
 * Exactly two assets are needed, ever, regardless of viewport width:
 *
 *   - mobile.src is shown below 640px, capped at mobile.width. A visitor on a
 *     360px phone sees it scaled down proportionally; nothing between 0 and
 *     640px needs its own asset.
 *   - desktop.src is shown from 640px up, capped at desktop.width. A visitor
 *     on a 2560px monitor sees the same fixed-size image centered, with the
 *     surrounding section background filling the rest — same pattern the
 *     adoption-form modal already uses for its own max-width.
 *
 * The two `width`/`height` pairs fix each image's aspect ratio. Export the
 * real artwork at those exact pixel dimensions (or an exact multiple, for a
 * sharper @2x/@3x file) and the layout is guaranteed to match — no cropping,
 * no stretching, no per-breakpoint redesign.
 */
export default function AppPromoImageBanner({
    promo,
    className = "",
    wrapperClassName,
}: {
    promo: AppPromoImageSpec;
    className?: string;
    /**
     * The page-level band around the banner (background/outer padding), same
     * idea as AppDownloadBanner had: the component renders it, not the
     * caller, so dismissing the banner removes the padding too instead of
     * leaving a bare strip of empty background behind.
     */
    wrapperClassName?: string;
}) {
    const { open, close } = useAppPromoGate(promo.key, promo.scope);

    if (!open) return null;

    const card = (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={close}
                aria-label="Dismiss app promotion"
                className="absolute right-2 top-2 z-10 rounded-full bg-white/85 p-1.5 text-gray-500 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-gray-800"
            >
                <X size={16} />
            </button>

            <Link href={promo.href} aria-label={promo.alt} className="block overflow-hidden rounded-2xl">
                <img
                    src={promo.mobile.src}
                    alt={promo.alt}
                    width={promo.mobile.width}
                    height={promo.mobile.height}
                    className="mx-auto block h-auto w-full sm:hidden"
                    style={{ maxWidth: promo.mobile.width }}
                    loading="lazy"
                    decoding="async"
                />
                <img
                    src={promo.desktop.src}
                    alt={promo.alt}
                    width={promo.desktop.width}
                    height={promo.desktop.height}
                    className="mx-auto hidden h-auto w-full sm:block"
                    style={{ maxWidth: promo.desktop.width }}
                    loading="lazy"
                    decoding="async"
                />
            </Link>
        </div>
    );

    return wrapperClassName ? <div className={wrapperClassName}>{card}</div> : card;
}
