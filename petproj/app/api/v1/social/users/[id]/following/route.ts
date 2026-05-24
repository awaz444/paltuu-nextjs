import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/users/[id]/following
 * List all users that [id] follows
 * ?cursor=timestamp&limit=20
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const currentUserIdRaw = await getUserIdFromRequest(req);
        const currentUserId = currentUserIdRaw ? parseInt(String(currentUserIdRaw), 10) : 0;
        const targetId = params.id;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(100, parseInt(searchParams.get("limit") || "30", 10));
        const cursor = searchParams.get("cursor");

        const cursorClause = cursor ? "AND f.created_at < $4" : "";
        const queryParams: any[] = [currentUserId, targetId, limit, ...(cursor ? [cursor] : [])];

        const result = await db.query(`
            SELECT 
                u.user_id,
                u.name,
                u.profile_image_url,
                u.social_username,
                u.bio,
                u.follower_count,
                u.following_count,
                f.created_at AS followed_at,
                EXISTS(
                    SELECT 1 FROM social_follows cf
                    WHERE cf.follower_id = $1 AND cf.following_id = u.user_id
                ) AS is_followed_by_me,
                EXISTS(
                    SELECT 1 FROM user_blocks b
                    WHERE b.blocker_id = $1 AND b.blocked_id = u.user_id
                ) AS is_blocked_by_me,
                EXISTS(
                    SELECT 1 FROM user_blocks b
                    WHERE b.blocker_id = u.user_id AND b.blocked_id = $1
                ) AS is_blocking_me
            FROM social_follows f
            JOIN users u ON u.user_id = f.following_id
            WHERE f.follower_id = $2
            ${cursorClause}
            ORDER BY f.created_at DESC
            LIMIT $3
        `, queryParams);

        const following = result.rows;
        const nextCursor = following.length === limit
            ? following[following.length - 1].followed_at
            : null;

        return NextResponse.json({
            following,
            next_cursor: nextCursor,
            has_more: nextCursor !== null,
        });

    } catch (error) {
        console.error("V1 Social Following GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
