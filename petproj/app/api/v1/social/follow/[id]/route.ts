import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitFollow, emitNotification } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/follow/[id]
 * Toggle follow — follows if not following, unfollows if already following
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const limited = await rateLimit(req, LIMITS.FOLLOW);
        if (limited) return limited;

        const followerIdRaw = await getUserIdFromRequest(req);
        if (!followerIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const followerId = parseInt(String(followerIdRaw), 10);
        const followingId = parseInt(params.id, 10);

        if (followerId === followingId) {
            return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
        }

        // Verify target user exists
        const targetUser = await db.query(
            "SELECT user_id FROM users WHERE user_id = $1",
            [followingId]
        );
        if (targetUser.rowCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const existing = await db.query(
            "SELECT follow_id FROM social_follows WHERE follower_id = $1 AND following_id = $2",
            [followerId, followingId]
        );

        await db.query('BEGIN');
        try {
            if ((existing.rowCount ?? 0) > 0) {
                // Unfollow
                await db.query(
                    "DELETE FROM social_follows WHERE follower_id = $1 AND following_id = $2",
                    [followerId, followingId]
                );
                await db.query(
                    "UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE user_id = $1",
                    [followerId]
                );
                await db.query(
                    "UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = $1",
                    [followingId]
                );
                await db.query('COMMIT');

                return NextResponse.json({ following: false });

            } else {
                // Follow
                await db.query(
                    "INSERT INTO social_follows (follower_id, following_id) VALUES ($1, $2)",
                    [followerId, followingId]
                );
                await db.query(
                    "UPDATE users SET following_count = following_count + 1 WHERE user_id = $1",
                    [followerId]
                );
                await db.query(
                    "UPDATE users SET follower_count = follower_count + 1 WHERE user_id = $1",
                    [followingId]
                );

                // Notification to the followed user
                await db.query(`
                    INSERT INTO notifications
                        (user_id, notification_content, notification_type, entity_type, entity_id)
                    VALUES ($1, $2, 'social_follow', 'user', $3)
                `, [
                    followingId,
                    `Someone started following you`,
                    followerId
                ]);

                // Send FCM push notification
                const followerRes = await db.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [followerId]);
                const follower = followerRes.rows[0];
                SocialNotifications.onNewFollower(
                    followingId,
                    followerId,
                    follower?.name || 'User',
                    follower?.profile_image_url
                ).catch(() => {});

                await db.query('COMMIT');

                // Real-time: push follow event and notification (fire and forget)
                emitFollow(followingId, { follower_id: followerId }).catch(() => {});
                emitNotification(followingId, { type: 'social_follow', actor_id: followerId }).catch(() => {});

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

/**
 * GET /api/v1/social/follow/[id]
 * Check if current user follows [id]
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const followerId = await getUserIdFromRequest(req);
        if (!followerId) return NextResponse.json({ following: false });

        const followingId = params.id;

        const result = await db.query(
            "SELECT follow_id FROM social_follows WHERE follower_id = $1 AND following_id = $2",
            [followerId, followingId]
        );

        return NextResponse.json({ following: (result.rowCount ?? 0) > 0 });

    } catch (error) {
        console.error("V1 Social Follow GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
