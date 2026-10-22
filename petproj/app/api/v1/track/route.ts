import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import {
    EVENT_TYPES,
    SCROLL_MILESTONES,
    isTrackedPath,
    pageTypeFor,
    sanitizeTarget,
    type TrackEvent,
} from "@/lib/analytics/events";

/**
 * @swagger
 * /api/v1/track:
 *   post:
 *     summary: Record website traffic events (page views, time on page, scroll depth, CTA clicks, ad slot impressions/clicks)
 *     description: Public, fire-and-forget beacon endpoint used by components/analytics/AnalyticsTracker. Body is { events: TrackEvent[] } (max 20). Event spec in lib/analytics/README.md.
 *     tags: [v1 Analytics]
 */

const MAX_EVENTS = 20;
const MAX_DURATION_MS = 30 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_RE = /^[a-z0-9_:-]{1,100}$/i;
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch/i;

function deviceFor(ua: string): "mobile" | "tablet" | "desktop" {
    if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
    if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
    return "desktop";
}

function str(v: unknown, max: number): string | null {
    return typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;
}

function uuid(v: unknown): string | null {
    return typeof v === "string" && UUID_RE.test(v) ? v : null;
}

function referrerHost(referrer: unknown, ownHost: string | null): string | null {
    if (typeof referrer !== "string" || !referrer) return null;
    try {
        const host = new URL(referrer).hostname.replace(/^www\./, "");
        return host && host !== ownHost ? host.slice(0, 255) : null;
    } catch {
        return null;
    }
}

// Quiet version of utils/authServer's lookup: beacons fire on every page, so an
// expired cookie must not log an error each time — it just means "signed out".
async function signedInUserId(req: NextRequest): Promise<number | null> {
    let raw: unknown = null;
    try {
        const token = await getToken({
            req: req as any,
            secret: process.env.NEXTAUTH_SECRET!,
            secureCookie: req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
        });
        raw = token?.user_id ?? token?.id ?? token?.sub ?? null;
    } catch { /* not signed in via NextAuth */ }

    const cookie = req.cookies.get("token")?.value;
    if (!raw && cookie) {
        try {
            const decoded = jwt.verify(cookie, process.env.TOKEN_SECRET!) as { id?: unknown; user_id?: unknown };
            raw = decoded.id ?? decoded.user_id ?? null;
        } catch { /* expired or invalid — treat as signed out */ }
    }

    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Vercel's edge sets this from the visitor's IP; absent locally and on other hosts.
function cityFor(req: NextRequest): string | null {
    const raw = req.headers.get("x-vercel-ip-city");
    if (!raw) return null;
    try {
        return decodeURIComponent(raw).slice(0, 100);
    } catch {
        return null;
    }
}

const COLUMNS = [
    "event_type", "path", "page_type", "view_id", "cta", "ad_slot", "target", "referrer_host",
    "utm_source", "utm_medium", "utm_campaign", "scroll_depth", "duration_ms",
    "visitor_id", "session_id", "user_id", "city", "device",
];

export async function POST(req: NextRequest) {
    // Always 204: a beacon has no one to read an error, and a 4xx/5xx here
    // must never surface in the visitor's browser.
    const done = new NextResponse(null, { status: 204 });
    try {
        const ua = req.headers.get("user-agent") ?? "";
        if (!ua || BOT_RE.test(ua)) return done;

        const limited = await rateLimit(req, LIMITS.TRACK_EVENTS);
        if (limited) return done;

        const body = await req.json().catch(() => null);
        const events: Partial<TrackEvent>[] = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS) : [];
        if (events.length === 0) return done;

        const ownHost = (req.headers.get("host") ?? "").replace(/^www\./, "").split(":")[0] || null;
        const device = deviceFor(ua);
        const city = cityFor(req);
        const userId = await signedInUserId(req);

        const rows: unknown[][] = [];
        for (const e of events) {
            if (!e || !EVENT_TYPES.includes(e.type as any)) continue;
            const path = str(e.path, 500);
            if (!path || !path.startsWith("/") || !isTrackedPath(path)) continue;

            const cta = str(e.cta, 100);
            const adSlot = str(e.ad_slot, 100);
            const depth = Number(e.scroll_depth);
            const duration = Math.round(Number(e.duration_ms));
            if (e.type === "cta_click" && (!cta || !NAME_RE.test(cta))) continue;
            if ((e.type === "ad_impression" || e.type === "ad_click") && (!adSlot || !NAME_RE.test(adSlot))) continue;
            if (e.type === "scroll_depth" && !SCROLL_MILESTONES.includes(depth as any)) continue;
            if (e.type === "page_leave" && !(duration > 0 && duration <= MAX_DURATION_MS)) continue;

            rows.push([
                e.type,
                path,
                pageTypeFor(path),
                uuid(e.view_id),
                e.type === "cta_click" ? cta : null,
                adSlot,
                sanitizeTarget(e.target),
                e.type === "page_view" ? referrerHost(e.referrer, ownHost) : null,
                str(e.utm_source, 100),
                str(e.utm_medium, 100),
                str(e.utm_campaign, 100),
                e.type === "scroll_depth" ? depth : null,
                e.type === "page_leave" ? duration : null,
                uuid(e.visitor_id),
                uuid(e.session_id),
                userId,
                city,
                device,
            ]);
        }
        if (rows.length === 0) return done;

        const cols = COLUMNS.length;
        const placeholders = rows
            .map((_, i) => `(${Array.from({ length: cols }, (_, j) => `$${i * cols + j + 1}`).join(", ")})`)
            .join(", ");
        await db.query(`INSERT INTO page_events (${COLUMNS.join(", ")}) VALUES ${placeholders}`, rows.flat());
    } catch (error) {
        console.error("V1 Track POST Error:", error);
    }
    return done;
}
