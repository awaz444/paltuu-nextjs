import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/users/[id]/followers
 * List all users following [id]
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
        const queryParams: any[] = [targetId, limit, ...(cursor ? [cursor] : [])];

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
            JOIN users u ON u.user_id = f.follower_id
            WHERE f.following_id = $1
            ${cursorClause}
            ORDER BY f.created_at DESC
            LIMIT $2
        `, [targetId, limit, ...(cursor ? [cursor] : [])]);

        const followers = result.rows;
        const nextCursor = followers.length === limit
            ? followers[followers.length - 1].followed_at
            : null;

        return NextResponse.json({
            followers,
            next_cursor: nextCursor,
            has_more: nextCursor !== null,
        });

    } catch (error) {
        console.error("V1 Social Followers GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/social/users/[id]/followers?followerId=123
 * Force-remove a follower from your list (only for the profile owner)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const currentUserIdRaw = await getUserIdFromRequest(req);
        if (!currentUserIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const currentUserId = parseInt(String(currentUserIdRaw), 10);
        
        const targetId = parseInt(params.id, 10); // The user whose followers list is being modified
        const { searchParams } = new URL(req.url);
        const followerId = parseInt(searchParams.get("followerId") || "0", 10);

        // Security check: You can only remove followers from your own profile
        if (currentUserId !== targetId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!followerId) {
            return NextResponse.json({ error: "followerId is required" }, { status: 400 });
        }

        await db.query('BEGIN');
        try {
            const res = await db.query(
                "DELETE FROM social_follows WHERE follower_id = $1 AND following_id = $2",
                [followerId, currentUserId]
            );

            if (res.rowCount === 0) {
                await db.query('ROLLBACK');
                return NextResponse.json({ error: "Follower relationship not found" }, { status: 404 });
            }

            // Decrement counts
            await db.query(
                "UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = $1",
                [currentUserId]
            );
            await db.query(
                "UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE user_id = $1",
                [followerId]
            );

            await db.query('COMMIT');
            return NextResponse.json({ removed: true });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Followers DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
