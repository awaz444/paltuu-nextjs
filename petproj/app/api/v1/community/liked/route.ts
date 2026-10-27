import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/community/liked?ids=1,2,3
 * Which of these posts the signed-in viewer has liked. The forum pages are
 * cached for everyone, so the viewer's own like state is filled in client-side,
 * one request per page rather than one per post.
 */
export async function GET(req: NextRequest) {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ signedIn: false, liked: [] });

    const ids = (req.nextUrl.searchParams.get("ids") ?? "")
        .split(",")
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0)
        .slice(0, 100);
    if (ids.length === 0) return NextResponse.json({ signedIn: true, liked: [] });

    const res = await db.query(
        `SELECT post_id FROM social_likes WHERE user_id = $1 AND post_id = ANY($2::bigint[])`,
        [parseInt(String(userIdRaw), 10), ids]
    );
    return NextResponse.json(
        { signedIn: true, liked: res.rows.map((r: any) => Number(r.post_id)) },
        { headers: { "Cache-Control": "private, no-store" } }
    );
}
