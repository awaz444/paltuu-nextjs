import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/users/me/blocked
 * Get list of users blocked by the current user
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);
        
        const { searchParams } = new URL(req.url);
        const limit   = Math.min(50, parseInt(searchParams.get("limit")  || "20", 10));
        const cursorStr = searchParams.get("cursor");
        let offset = 0;
        
        if (cursorStr) {
            try {
                const decoded = JSON.parse(Buffer.from(cursorStr, 'base64').toString('ascii'));
                offset = parseInt(decoded.offset, 10) || 0;
            } catch (e) {
                // ignore invalid cursor
            }
        }

        const query = `
            SELECT 
                u.user_id,
                u.username,
                u.name as display_name,
                u.profile_image_url as avatar_url,
                b.created_at as blocked_at
            FROM user_blocks b
            JOIN users u ON u.user_id = b.blocked_id
            WHERE b.blocker_id = $1
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, [userId, limit, offset]);

        const nextOffset = offset + limit;
        const nextCursor = result.rows.length === limit 
            ? Buffer.from(JSON.stringify({ offset: nextOffset })).toString('base64')
            : null;

        return NextResponse.json({
            blocked_users: result.rows,
            next_cursor: nextCursor
        });

    } catch (error) {
        console.error("Blocked Users GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
