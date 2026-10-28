import Link from "next/link";

/** Floating mobile button style, shared with the browse pets page so both look the same. */
export const MOBILE_BUTTON =
    "rounded-xl border-2 border-primary bg-white px-4 py-2 text-xs font-semibold text-primary shadow-lg transition-transform duration-300 hover:scale-105";

/**
 * Two floating buttons on mobile, styled like the Adopt page's floating
 * buttons: Adopt on the left, Get App on the right. Shown on Home, forum and
 * post pages so Adopt stays one tap away from the feed.
 */
export default function MobileActions() {
    return (
        <>
            <div aria-hidden className="h-14 md:hidden" />
            <Link href="/browse-pets" className={`fixed bottom-4 left-4 z-40 md:hidden ${MOBILE_BUTTON}`}>
                Adopt
            </Link>
            <Link href="/app" className={`fixed bottom-4 right-4 z-40 md:hidden ${MOBILE_BUTTON}`}>
                Get App
            </Link>
        </>
    );
}
