import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/follow/[id]
 * Toggle follow status for a user
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const followerId = await getUserIdFromRequest(req);
        if (!followerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const followingId = params.id;

        if (String(followerId) === String(followingId)) {
            return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
        }

        // Check if already following
        const existing = await db.query(
            "SELECT follow_id FROM social_follows WHERE follower_id = $1 AND following_id = $2",
            [followerId, followingId]
        );

        await db.query('BEGIN');
        try {
            if ((existing.rowCount ?? 0) > 0) {
                // Unfollow
                await db.query("DELETE FROM social_follows WHERE follower_id = $1 AND following_id = $2", [followerId, followingId]);
                await db.query("UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE user_id = $1", [followerId]);
                await db.query("UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = $1", [followingId]);
                await db.query('COMMIT');
                return NextResponse.json({ following: false });
            } else {
                // Follow
                await db.query("INSERT INTO social_follows (follower_id, following_id) VALUES ($1, $2)", [followerId, followingId]);
                await db.query("UPDATE users SET following_count = following_count + 1 WHERE user_id = $1", [followerId]);
                await db.query("UPDATE users SET follower_count = follower_count + 1 WHERE user_id = $1", [followingId]);
                await db.query('COMMIT');
                return NextResponse.json({ following: true });
            }
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Follow POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
