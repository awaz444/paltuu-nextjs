import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/follow-requests
 * List pending follow requests sent TO the logged-in user, newest first.
 * ?cursor=timestamp&limit=20
 */
export async function GET(req: NextRequest) {
    try {
        const limited = await rateLimit(req, LIMITS.FEED, undefined, { blocking: false });
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = searchParams.get("cursor");

        const cursorClause = cursor ? "AND f.created_at < $3" : "";
        const queryParams: any[] = [userId, limit, ...(cursor ? [cursor] : [])];

        const [requestsRes, countRes] = await Promise.all([
            db.query(
                `SELECT
                    f.follow_id,
                    f.created_at AS requested_at,
                    u.user_id,
                    u.name,
                    u.profile_image_url,
                    u.social_username,
                    u.verified,
                    u.founding_club
                 FROM social_follows f
                 JOIN users u ON u.user_id = f.follower_id
                 WHERE f.following_id = $1 AND f.status = 'pending'
                 ${cursorClause}
                 ORDER BY f.created_at DESC
                 LIMIT $2`,
                queryParams
            ),
            db.query(
                `SELECT COUNT(*)::int AS total FROM social_follows WHERE following_id = $1 AND status = 'pending'`,
                [userId]
            ),
        ]);

        const requests = requestsRes.rows;
        const nextCursor = requests.length === limit
            ? requests[requests.length - 1].requested_at
            : null;

        return NextResponse.json({
            requests,
            total: countRes.rows[0]?.total ?? 0,
            next_cursor: nextCursor,
            has_more: nextCursor !== null,
        });

    } catch (error) {
        console.error("V1 Follow Requests GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
