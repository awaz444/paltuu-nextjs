"use client";

/**
 * PostHog in the browser (PALTU-21). Mounted once in the root layout, next to
 * AnalyticsTracker, which keeps recording into page_events as before.
 *
 * - Pageviews on every client-side navigation (defaults: history_change).
 * - Adds PostHog session headers to our own API calls, so the server-side
 *   events in lib/analytics/serverEvents.ts join this visitor's session.
 * - app_download_click on any App Store / Google Play link (same detection
 *   as AnalyticsTracker's CTA clicks).
 * - cta_click on every element with data-cta (the same buttons AnalyticsTracker
 *   records), so funnels can use Apply, Contact and clinic call/WhatsApp.
 * - A `channel` property on every event (AI assistant, search, social...),
 *   fixed from the first page of the visit. ChatGPT sends no referrer, only
 *   utm_source=chatgpt.com, so it would otherwise count as direct.
 *
 * Autocapture and session recording are off: adoption forms hold addresses
 * and phone numbers, and we only need the named events above.
 */

import { useEffect } from "react";
import posthog from "posthog-js";
import { ctaLabel, inferCta, pageTypeFor, trafficChannel } from "@/lib/analytics/events";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export default function PostHogTracker() {
    useEffect(() => {
        if (!POSTHOG_KEY || posthog.__loaded) return;

        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            defaults: "2025-05-24",
            person_profiles: "identified_only",
            autocapture: false,
            disable_session_recording: true,
            tracing_headers: [window.location.hostname],
        });

        // Once per visit: later pages have this site as their referrer.
        let channelSet = false;
        try {
            channelSet = sessionStorage.getItem("ph_channel") === "1";
            sessionStorage.setItem("ph_channel", "1");
        } catch {}
        if (!channelSet) {
            const params = new URLSearchParams(window.location.search);
            let referrerHost: string | null = null;
            try {
                referrerHost = document.referrer ? new URL(document.referrer).hostname : null;
            } catch {}
            if (referrerHost === window.location.hostname) referrerHost = null;
            posthog.register_for_session({
                channel: trafficChannel(referrerHost, params.get("utm_source"), params.get("utm_medium")),
            });
        }

        const onClick = (e: MouseEvent) => {
            const el = e.target instanceof Element ? e.target : null;
            const href = (el?.closest("a[href]") as HTMLAnchorElement | null)?.getAttribute("href");
            const cta = el?.closest("[data-cta]")?.getAttribute("data-cta") ?? (href ? inferCta(href) : null);
            if (!cta) return;
            const path = window.location.pathname;
            posthog.capture("cta_click", { cta, label: ctaLabel(cta), page_type: pageTypeFor(path), path });
            if (cta === "app_store_ios" || cta === "app_store_android") {
                posthog.capture("app_download_click", {
                    store: cta === "app_store_ios" ? "ios" : "android",
                    path: window.location.pathname,
                });
            }
        };

        document.addEventListener("click", onClick, true);
        return () => document.removeEventListener("click", onClick, true);
    }, []);

    return null;
}
