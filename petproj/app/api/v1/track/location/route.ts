import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { placeFor } from "@/lib/analytics/geography";
import { signedInUserId } from "@/lib/analytics/requestUser";

/**
 * @swagger
 * /api/v1/track/location:
 *   post:
 *     summary: Record where a visitor is, after they share their browser location
 *     description: Public beacon used by lib/analytics/track.ts reportLocation(). Body is { lat, lng, source, visitor_id?, session_id? }, source one of arrival (asked on landing), clinics, pet_care. The server works out country, province, city and (in Karachi) district and area, and stores only those names, never the coordinates. One row per session. Always 204. (PALTU-192)
 *     tags: [v1 Analytics]
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCES = ["arrival", "clinics", "pet_care"] as const;
const uuid = (v: unknown) => (typeof v === "string" && UUID_RE.test(v) ? v : null);

export async function POST(req: NextRequest) {
    const done = new NextResponse(null, { status: 204 });
    try {
        const limited = await rateLimit(req, LIMITS.TRACK_EVENTS);
        if (limited) return done;

        const body = await req.json().catch(() => null);
        const source = SOURCES.find((s) => s === body?.source);
        const place = placeFor(Number(body?.lat), Number(body?.lng));
        if (!source || !place) return done;

        const visitorId = uuid(body?.visitor_id);
        const sessionId = uuid(body?.session_id);
        // One row per session: the same visitor sharing again on the next page isn't news.
        if (sessionId) {
            const { rowCount } = await db.query("SELECT 1 FROM visitor_locations WHERE session_id = $1 LIMIT 1", [sessionId]);
            if (rowCount) return done;
        }

        await db.query(
            `INSERT INTO visitor_locations (visitor_id, session_id, user_id, source, country, province, city, district, area)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [visitorId, sessionId, await signedInUserId(req), source, place.country, place.province, place.city, place.district, place.area],
        );
    } catch (error) {
        console.error("V1 Track Location POST Error:", error);
    }
    return done;
}
