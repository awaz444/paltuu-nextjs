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
        const currentUserId = await getUserIdFromRequest(req);
        const targetId = params.id;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(100, parseInt(searchParams.get("limit") || "30", 10));
        const cursor = searchParams.get("cursor");

        const cursorClause = cursor ? "AND f.created_at < $3" : "";

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
                ) AS is_followed_by_me
            FROM social_follows f
            JOIN users u ON u.user_id = f.following_id
            WHERE f.follower_id = $1
            ${cursorClause}
            ORDER BY f.created_at DESC
            LIMIT $2
        `, [targetId, limit, ...(cursor ? [cursor] : [])]);

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
