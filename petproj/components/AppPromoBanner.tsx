"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { APP_LINKS, VETS_AT_HOME } from "@/lib/homeContent";

const DISMISSED_KEY = "paltuu_app_promo_dismissed";
const CONSENT_KEY = "paltuu_cookie_consent";
const SHOW_DELAY_MS = 1500;

/**
 * One dismissible banner promoting the app, with a Karachi-specific message.
 *
 * Karachi visitors get Vets at Home, because it only runs there and it is the
 * most concrete reason to install. Everyone else gets the community pitch.
 * There is deliberately one banner rather than two: CookieConsent already owns
 * the bottom of the viewport, and stacking a third sheet on a phone is a mess.
 *
 * Two things are load-bearing:
 *  - It stays hidden until cookie consent is answered, and sits one z-index
 *    below CookieConsent.
 *  - localStorage is checked before the geo request, so a visitor who has
 *    dismissed it never costs a round trip.
 */
export default function AppPromoBanner() {
    const [visible, setVisible] = useState(false);
    const [isKarachi, setIsKarachi] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;

        try {
            if (localStorage.getItem(DISMISSED_KEY)) return;
            if (localStorage.getItem(CONSENT_KEY) === null) return;
        } catch {
            // Storage blocked (private mode). Skip rather than showing something
            // the visitor cannot permanently dismiss.
            return;
        }

        const show = (karachi: boolean) => {
            timer = setTimeout(() => {
                if (cancelled) return;
                setIsKarachi(karachi);
                setVisible(true);
            }, SHOW_DELAY_MS);
        };

        fetch("/api/v1/geo")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!cancelled) show(Boolean(data?.isKarachi));
            })
            .catch(() => {
                // Geo is a nicety. Fall back to the generic app pitch.
                if (!cancelled) show(false);
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
            /* Non-fatal: it reappears next visit. */
        }
        setVisible(false);
    };

    const copy = isKarachi
        ? {
              lead: `Vets at Home is live in ${VETS_AT_HOME.city}.`,
              body: "Paltuu's own veterinary doctors come to you for check-ups, vaccinations and grooming.",
              cta: "Book in the app",
              href: VETS_AT_HOME.deepLink,
          }
        : {
              lead: "Get the Paltuu app.",
              body: "Give your pets their own profiles, post and tag them, and join the pet community in Pakistan.",
              cta: "Download free",
              href: APP_LINKS.android,
          };

    if (!mounted) return null;

    return (
        <div
            className={`fixed inset-x-0 bottom-0 z-[9996] transition-transform duration-500 ease-in-out ${
                visible ? "translate-y-0" : "translate-y-full pointer-events-none"
            }`}
            role="dialog"
            aria-live="polite"
            aria-label="Paltuu app"
            aria-hidden={!visible}
        >
            <div className="mx-auto max-w-4xl p-4">
                <div className="relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                    <button
                        onClick={dismiss}
                        aria-label="Dismiss"
                        className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600 sm:hidden"
                    >
                        <X size={18} />
                    </button>

                    <p className="pr-6 text-sm text-gray-600 sm:pr-0">
                        <span className="font-semibold text-gray-900">{copy.lead}</span>{" "}
                        {copy.body}
                    </p>

                    <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                        <button
                            onClick={dismiss}
                            className="hidden rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:block"
                        >
                            Not now
                        </button>
                        <Link
                            href={copy.href}
                            onClick={dismiss}
                            className="flex-1 whitespace-nowrap rounded-full px-5 py-2 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:flex-none"
                            style={{ backgroundColor: "var(--primary-color)" }}
                        >
                            {copy.cta}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
