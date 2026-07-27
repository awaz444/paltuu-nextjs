import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/follow-requests/count
 * Cheap count-only endpoint for the notifications bar badge.
 */
export async function GET(req: NextRequest) {
    try {
        const limited = await rateLimit(req, LIMITS.FEED, undefined, { blocking: false });
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const result = await db.query(
            `SELECT COUNT(*)::int AS total FROM social_follows WHERE following_id = $1 AND status = 'pending'`,
            [userId]
        );

        return NextResponse.json({ total: result.rows[0]?.total ?? 0 });

    } catch (error) {
        console.error("V1 Follow Requests Count GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
