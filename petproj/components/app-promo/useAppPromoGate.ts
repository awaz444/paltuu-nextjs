"use client";

import { useCallback, useEffect, useState } from "react";
import type { PromoScope } from "@/lib/appPromo";

const PREFIX = "paltuu_app_promo_";

/** Written by components/CookieConsent.tsx. Null until the visitor answers. */
const CONSENT_KEY = "paltuu_cookie_consent";

const CONSENT_POLL_MS = 500;
/** Give up waiting for an answer after this long, so no timer runs forever. */
const CONSENT_WAIT_MS = 60_000;

const store = (scope: PromoScope): Storage | null => {
    try {
        return scope === "session" ? window.sessionStorage : window.localStorage;
    } catch {
        // Private mode, or storage blocked by the browser.
        return null;
    }
};

/**
 * Whether the cookie bar has been answered.
 *
 * CookieConsent is fixed to the bottom of the viewport at z-[9997] — above
 * every promo here — so while it is up it covers the bottom of a centred
 * modal, including the "continue on the website" button. Promos that would
 * collide with it wait their turn. Blocked storage counts as answered: we
 * cannot tell, and suppressing the promo forever is the worse failure.
 */
export function hasAnsweredCookieConsent(): boolean {
    try {
        return localStorage.getItem(CONSENT_KEY) !== null;
    } catch {
        return true;
    }
}

/**
 * Decides whether one app promo should be on screen, and remembers when it is
 * closed.
 *
 * `open` is false on the server and on the first client render, so the promo
 * never appears in the SSR'd HTML — this keeps browse-pets and the landing page
 * hydration-safe, and keeps the promo out of what Google indexes.
 *
 * Storage is deliberately allowed to fail: if it is blocked we still show the
 * promo, we just cannot remember that it was closed. Better than hiding it.
 *
 * `delayMs` gives the page a moment to paint first. Popups use it so the promo
 * does not land on top of a half-rendered form.
 *
 * `waitForCookieConsent` is for the popups (see hasAnsweredCookieConsent). It
 * polls rather than listening, because the `storage` event does not fire in the
 * tab that wrote the value — which is exactly the tab we care about.
 */
export function useAppPromoGate(
    key: string,
    scope: PromoScope,
    {
        delayMs = 0,
        enabled = true,
        waitForCookieConsent = false,
    }: { delayMs?: number; enabled?: boolean; waitForCookieConsent?: boolean } = {}
) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        if (store(scope)?.getItem(PREFIX + key)) return;

        let showTimer: ReturnType<typeof setTimeout>;
        let pollTimer: ReturnType<typeof setInterval>;
        let giveUpTimer: ReturnType<typeof setTimeout>;

        const show = () => {
            if (delayMs <= 0) {
                setOpen(true);
                return;
            }
            showTimer = setTimeout(() => setOpen(true), delayMs);
        };

        if (!waitForCookieConsent || hasAnsweredCookieConsent()) {
            show();
        } else {
            pollTimer = setInterval(() => {
                if (!hasAnsweredCookieConsent()) return;
                clearInterval(pollTimer);
                clearTimeout(giveUpTimer);
                show();
            }, CONSENT_POLL_MS);
            giveUpTimer = setTimeout(() => clearInterval(pollTimer), CONSENT_WAIT_MS);
        }

        return () => {
            clearTimeout(showTimer);
            clearInterval(pollTimer);
            clearTimeout(giveUpTimer);
        };
    }, [key, scope, delayMs, enabled, waitForCookieConsent]);

    const close = useCallback(() => {
        try {
            store(scope)?.setItem(PREFIX + key, "1");
        } catch {
            /* Non-fatal: the promo simply comes back. */
        }
        setOpen(false);
    }, [key, scope]);

    return { open, close };
}
