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
const FLUSH_DELAY_MS = 2000;
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
