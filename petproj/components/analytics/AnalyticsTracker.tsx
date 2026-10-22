"use client";

/**
 * Records page views, time on page, scroll depth and CTA clicks into
 * page_events (see lib/analytics/README.md). Mounted once in the root layout.
 *
 * Page views: one per pathname change (filter/query changes on the same page
 * are not new views). Each view gets a view_id that its other events carry.
 *
 * Time on page: visible time only, sent as page_leave slices whenever the tab
 * is hidden or the visitor navigates away; the dashboard sums them per view.
 *
 * CTA clicks: tag any element with data-cta="<name>" and clicks on it (or its
 * children) are recorded under that name. App store, WhatsApp, tel: and mailto:
 * links are recorded automatically even without a tag. Clicks inside an
 * <AdSlot> are additionally recorded as ad_click for that slot.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { flush, newId, setCurrentView, trackEvent } from "@/lib/analytics/track";
import { inferCta, pageTypeFor, SCROLL_MILESTONES, SCROLL_PAGE_TYPES } from "@/lib/analytics/events";

// A tab left open and visible overnight isn't 8 hours of reading.
const MAX_SLICE_MS = 30 * 60 * 1000;

interface View {
    id: string;
    path: string;
    visibleSince: number | null;
    milestones: Set<number>;
}

// Report the visible time accumulated since the view's last slice.
function sendLeave(v: View | null) {
    if (!v || v.visibleSince === null) return;
    const ms = Math.min(Date.now() - v.visibleSince, MAX_SLICE_MS);
    v.visibleSince = null;
    if (ms >= 500) trackEvent("page_leave", { path: v.path, view_id: v.id, duration_ms: ms });
}

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const view = useRef<View | null>(null);
    const isFirstView = useRef(true);

    useEffect(() => {

        const onVisibility = () => {
            if (document.visibilityState === "hidden") {
                sendLeave(view.current);
                flush();
            } else if (view.current) {
                view.current.visibleSince = Date.now();
            }
        };

        const onPageHide = () => {
            sendLeave(view.current);
            flush();
        };

        let scrollScheduled = false;
        const onScroll = () => {
            if (scrollScheduled) return;
            scrollScheduled = true;
            requestAnimationFrame(() => {
                scrollScheduled = false;
                const v = view.current;
                if (!v || !SCROLL_PAGE_TYPES.has(pageTypeFor(v.path))) return;
                const doc = document.documentElement;
                const scrollable = doc.scrollHeight - window.innerHeight;
                if (scrollable <= 0) return;
                const pct = Math.min(100, ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100);
                for (const m of SCROLL_MILESTONES) {
                    // 100% is "reached the bottom"; allow a few px of rounding slack.
                    const reached = m === 100 ? window.scrollY >= scrollable - 4 : pct >= m;
                    if (reached && !v.milestones.has(m)) {
                        v.milestones.add(m);
                        trackEvent("scroll_depth", { path: v.path, view_id: v.id, scroll_depth: m });
                    }
                }
            });
        };

        const onClick = (e: MouseEvent) => {
            const el = e.target instanceof Element ? e.target : null;
            if (!el) return;

            const anchor = el.closest("a[href]") as HTMLAnchorElement | null;
            const href = anchor?.getAttribute("href") ?? undefined;

            const adEl = el.closest("[data-ad-slot]");
            if (adEl) {
                trackEvent("ad_click", { ad_slot: adEl.getAttribute("data-ad-slot")!, target: href });
            }

            const cta = el.closest("[data-cta]")?.getAttribute("data-cta") ?? (href ? inferCta(href) : null);
            if (cta) {
                trackEvent("cta_click", { cta, target: href });
            }
        };

        document.addEventListener("click", onClick, true);
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            document.removeEventListener("click", onClick, true);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    useEffect(() => {
        if (!pathname || pathname === view.current?.path) return;

        // Close out the previous page before starting the new one.
        sendLeave(view.current);

        const id = newId();
        view.current = {
            id,
            path: pathname,
            visibleSince: document.visibilityState === "visible" ? Date.now() : null,
            milestones: new Set(),
        };
        setCurrentView(id);

        const params = new URLSearchParams(window.location.search);
        trackEvent("page_view", {
            path: pathname,
            view_id: id,
            // Only the landing page of a visit has a meaningful external referrer;
            // later client-side navigations would just report our own previous page.
            referrer: isFirstView.current ? document.referrer || undefined : undefined,
            utm_source: params.get("utm_source") ?? undefined,
            utm_medium: params.get("utm_medium") ?? undefined,
            utm_campaign: params.get("utm_campaign") ?? undefined,
        });
        isFirstView.current = false;
    }, [pathname]);

    return null;
}
