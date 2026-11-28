import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { karachiArea } from "@/lib/analytics/geography";
import { signedInUserId } from "@/lib/analytics/requestUser";

/**
 * @swagger
 * /api/v1/track/area:
 *   post:
 *     summary: Record which Karachi area a visitor is in, after they share their location
 *     description: Public beacon used by lib/analytics/track.ts reportArea(). Body is { lat, lng, visitor_id?, session_id? }. Only the area and district names are stored, never the coordinates; points outside Karachi are ignored. Always 204. (PALTU-192)
 *     tags: [v1 Analytics]
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = (v: unknown) => (typeof v === "string" && UUID_RE.test(v) ? v : null);

export async function POST(req: NextRequest) {
    const done = new NextResponse(null, { status: 204 });
    try {
        const limited = await rateLimit(req, LIMITS.TRACK_EVENTS);
        if (limited) return done;

        const body = await req.json().catch(() => null);
        const found = karachiArea(Number(body?.lat), Number(body?.lng));
        if (!found) return done;

        const visitorId = uuid(body?.visitor_id);
        const sessionId = uuid(body?.session_id);
        // One row per session is enough: the same visitor tapping twice isn't news.
        if (sessionId) {
            const { rowCount } = await db.query("SELECT 1 FROM visitor_areas WHERE session_id = $1 LIMIT 1", [sessionId]);
            if (rowCount) return done;
        }

        await db.query(
            `INSERT INTO visitor_areas (visitor_id, session_id, user_id, city, district, area)
             VALUES ($1, $2, $3, 'Karachi', $4, $5)`,
            [visitorId, sessionId, await signedInUserId(req), found.district, found.area],
        );
    } catch (error) {
        console.error("V1 Track Area POST Error:", error);
    }
    return done;
}
