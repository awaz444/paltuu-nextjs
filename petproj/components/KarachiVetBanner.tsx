"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { House, X } from "lucide-react";
import { VETS_AT_HOME } from "@/lib/homeContent";

const DISMISSED_KEY = "paltuu_vets_at_home_banner_dismissed";
const CONSENT_KEY = "paltuu_cookie_consent";
const SHOW_DELAY_MS = 1500;

/**
 * Promotes Vets at Home to visitors Vercel places in Karachi, since the service
 * only runs there. Built on the same slide-up pattern as CookieConsent.
 *
 * Two things are load-bearing here:
 *
 *  - It stays hidden until the cookie banner has been answered. Both are fixed
 *    to the bottom of the viewport, and two stacked sheets on a phone is a mess.
 *    It sits one z-index below CookieConsent for the same reason.
 *  - localStorage is checked before the geo request, so a visitor who has
 *    dismissed it never costs us a round trip.
 */
export default function KarachiVetBanner() {
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;

        try {
            if (localStorage.getItem(DISMISSED_KEY)) return;
            // Wait for the cookie banner to be resolved before competing for the
            // same corner of the screen.
            if (localStorage.getItem(CONSENT_KEY) === null) return;
        } catch {
            // Storage blocked (private mode, blocked cookies) — skip the promo
            // rather than showing something we can't let the visitor dismiss.
            return;
        }

        fetch("/api/v1/geo")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled || !data?.isKarachi) return;
                timer = setTimeout(() => {
                    if (!cancelled) setVisible(true);
                }, SHOW_DELAY_MS);
            })
            .catch(() => {
                /* No geo, no banner. */
            });

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, []);

    const dismiss = () => {
        try {
            localStorage.setItem(DISMISSED_KEY, "1");
        } catch {
            /* Non-fatal: it just reappears next visit. */
        }
        setVisible(false);
    };

    if (!mounted) return null;

    return (
        <div
            className={`fixed inset-x-0 bottom-0 z-[9996] transition-transform duration-500 ease-in-out ${
                visible ? "translate-y-0" : "translate-y-full pointer-events-none"
            }`}
            role="dialog"
            aria-live="polite"
            aria-label={`Vets at Home in ${VETS_AT_HOME.city}`}
            aria-hidden={!visible}
        >
            <div className="mx-auto max-w-5xl p-4 sm:p-6">
                <div className="relative flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:flex-row sm:items-center sm:gap-6 sm:p-6">
                    <button
                        onClick={dismiss}
                        aria-label="Dismiss"
                        className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600 sm:hidden"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-start gap-3 sm:items-center">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: "var(--light-color)" }}
                        >
                            <House size={20} style={{ color: "var(--primary-color)" }} />
                        </div>
                        <p className="text-sm text-gray-600 sm:text-base">
                            <span className="font-semibold text-gray-900">
                                Vets at Home is live in {VETS_AT_HOME.city}.
                            </span>{" "}
                            Paltuu&apos;s own veterinary doctors come to you — check-ups,
                            vaccinations and grooming, at your door.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 sm:ml-auto">
                        <button
                            onClick={dismiss}
                            className="hidden rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:block"
                        >
                            Not now
                        </button>
                        <Link
                            href={VETS_AT_HOME.deepLink}
                            onClick={dismiss}
                            className="flex-1 whitespace-nowrap rounded-full px-5 py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-90 sm:flex-none"
                            style={{ backgroundColor: "var(--primary-color)" }}
                        >
                            Book in the app
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
