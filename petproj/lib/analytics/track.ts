/**
 * Client-side event queue for first-party traffic tracking.
 * Events are batched and sent with sendBeacon so tracking never blocks
 * navigation and survives the page being closed mid-flush.
 */

import { isTrackedPath, type EventType, type TrackEvent } from "./events";

const ENDPOINT = "/api/v1/track";
const CONSENT_KEY = "paltuu_cookie_consent";
const VISITOR_KEY = "paltuu_vid";
const SESSION_KEY = "paltuu_sid";
// Each flush is a billed Vercel request. AnalyticsTracker already flushes on
// visibilitychange/pagehide, so a long delay only batches more events per POST
// without losing any (PALTU-183).
const FLUSH_DELAY_MS = 15000;
const MAX_BATCH = 20;

let queue: TrackEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
// The page view currently on screen; every event is attributed to it.
let currentViewId: string | undefined;

export function newId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    // Older browsers: RFC 4122 v4 from Math.random — fine for an analytics id.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
}

export function setCurrentView(viewId: string) {
    currentViewId = viewId;
}

function getSessionId(): string | undefined {
    try {
        let id = sessionStorage.getItem(SESSION_KEY);
        if (!id) {
            id = newId();
            sessionStorage.setItem(SESSION_KEY, id);
        }
        return id;
    } catch {
        return undefined;
    }
}

// The persistent visitor id is what makes "unique visitors" countable, so it is
// only kept when the visitor hasn't rejected cookies. Rejected visitors are still
// counted in page views and clicks, just not as uniques across sessions.
function getVisitorId(): string | undefined {
    try {
        if (localStorage.getItem(CONSENT_KEY) === "rejected") {
            localStorage.removeItem(VISITOR_KEY);
            return undefined;
        }
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = newId();
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return undefined;
    }
}

export function flush() {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    if (queue.length === 0) return;

    const body = JSON.stringify({ events: queue.splice(0, MAX_BATCH) });
    const sent = typeof navigator.sendBeacon === "function"
        && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    if (!sent) {
        fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } })
            .catch(() => {});
    }
    if (queue.length > 0) flush();
}

export function trackEvent(
    type: EventType,
    fields: Omit<TrackEvent, "type" | "path" | "visitor_id" | "session_id"> & { path?: string } = {},
) {
    if (typeof window === "undefined") return;
    const path = fields.path ?? window.location.pathname;
    if (!isTrackedPath(path)) return;

    queue.push({
        view_id: currentViewId,
        ...fields,
        type,
        path,
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
    });

    if (queue.length >= MAX_BATCH) {
        flush();
    } else if (!flushTimer) {
        flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
    }
}

export type LocationSource = "arrival" | "clinics" | "pet_care";
const LOCATION_SENT_KEY = "paltuu_loc_sent";

/**
 * The visitor shared their browser location: tell the server, which works out
 * their city, province and Karachi area and keeps only those names, never the
 * coordinates (PALTU-192). Sent at most once per browser session.
 */
export function locationSentThisSession(): boolean {
    try {
        return !!sessionStorage.getItem(LOCATION_SENT_KEY);
    } catch {
        return false;
    }
}

export function reportLocation(lat: number, lng: number, source: LocationSource) {
    if (typeof window === "undefined" || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    try {
        if (sessionStorage.getItem(LOCATION_SENT_KEY)) return;
        sessionStorage.setItem(LOCATION_SENT_KEY, "1");
    } catch { /* storage blocked: the server still keeps one row per session */ }
    const body = JSON.stringify({ lat, lng, source, visitor_id: getVisitorId(), session_id: getSessionId() });
    fetch("/api/v1/track/location", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } })
        .catch(() => {});
}
