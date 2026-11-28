"use client";

import { useEffect } from "react";
import { locationSentThisSession, reportLocation } from "@/lib/analytics/track";

/**
 * Asks for the browser's location once, on a visitor's first visit to
 * paltuu.pk, so the admin traffic dashboard can show which cities, provinces
 * and Karachi areas visitors come from (PALTU-192). lib/analytics/geography.ts
 * turns the point into place names on our server; coordinates are never stored.
 *
 * - Asked once per browser. If they say no, we never ask again (and the browser
 *   wouldn't show the prompt anyway).
 * - If they already allowed location (earlier visit, or "Use my location"),
 *   no prompt shows: we just send it once per session.
 * - Not on paltuu.org, sign-in, checkout or admin / panel pages.
 */

const ASKED_KEY = "paltuu_loc_asked";
const DELAY_MS = 2500;
const SKIP_PREFIXES = [
    "/auth", "/sign-up", "/forgot-password", "/reset-password", "/checkout", "/order-confirmed",
    "/admin", "/api-docs", "/pwa-debug",
];

function skipPath(path: string): boolean {
    return /-panel(\/|$)/.test(path) || /^\/admin-/.test(path)
        || SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export default function ArrivalLocation() {
    useEffect(() => {
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
        if (/(^|\.)paltuu\.org$/i.test(window.location.hostname)) return;
        if (window.self !== window.top || skipPath(window.location.pathname)) return;
        if (locationSentThisSession()) return;

        const locate = () =>
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => reportLocation(coords.latitude, coords.longitude, "arrival"),
                () => {},
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 30 * 60 * 1000 },
            );

        const timer = setTimeout(async () => {
            let state: PermissionState | null = null;
            try {
                state = (await navigator.permissions.query({ name: "geolocation" })).state;
            } catch { /* Permissions API missing (older Safari): fall back to "asked before?" */ }
            if (state === "denied") return;
            if (state === "granted") return locate();

            try {
                if (localStorage.getItem(ASKED_KEY)) return;
                localStorage.setItem(ASKED_KEY, new Date().toISOString());
            } catch {
                return; // can't remember that we asked, so don't risk asking on every page
            }
            locate();
        }, DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
