import { db, createClient } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitFollow, emitNotification } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";
import { assertNotBlocked } from "@/lib/moderation";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/follow/[id]
 * Toggle follow:
 *  - not following + public target  -> follow immediately (status='accepted')
 *  - not following + private target -> create a pending follow request
 *  - already following/pending      -> remove it (unfollow, or cancel the pending request)
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
            "SELECT user_id, is_private FROM users WHERE user_id = $1",
            [followingId]
        );
        if (targetUser.rowCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const isTargetPrivate = targetUser.rows[0].is_private === true;

        await assertNotBlocked(followerId, followingId);

        const existing = await db.query(
            "SELECT follow_id, status FROM social_follows WHERE follower_id = $1 AND following_id = $2",
            [followerId, followingId]
        );

        const client = createClient();
        await client.connect();
        await client.query('BEGIN');

        try {
            if ((existing.rowCount ?? 0) > 0) {
                // Unfollow (was accepted) or cancel a pending request (was pending) —
                // either way it's just removing my own row; counts only need touching
                // if it was a real, accepted follow.
                const wasAccepted = existing.rows[0].status === 'accepted';

                await client.query(
                    "DELETE FROM social_follows WHERE follower_id = $1 AND following_id = $2",
                    [followerId, followingId]
                );

                if (wasAccepted) {
                    await client.query(
                        "UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE user_id = $1",
                        [followerId]
                    );
                    await client.query(
                        "UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = $1",
                        [followingId]
                    );
                }
                await client.query('COMMIT');

                return NextResponse.json({ following: false, status: null });

            } else if (isTargetPrivate) {
                // Private account — request only, no follow/count change until accepted
                await client.query(
                    "INSERT INTO social_follows (follower_id, following_id, status) VALUES ($1, $2, 'pending')",
                    [followerId, followingId]
                );

                const followerRes = await client.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [followerId]);
                const follower = followerRes.rows[0];
                SocialNotifications.onFollowRequested(
                    followingId,
                    followerId,
                    follower?.name || 'User',
                    follower?.profile_image_url
                ).catch(() => {});

                await client.query('COMMIT');

                emitNotification(followingId, { type: 'social_follow_request', actor_id: followerId }).catch(() => {});

                return NextResponse.json({ following: false, status: 'pending' });

            } else {
                // Public account — follow immediately
                await client.query(
                    "INSERT INTO social_follows (follower_id, following_id, status) VALUES ($1, $2, 'accepted')",
                    [followerId, followingId]
                );
                await client.query(
                    "UPDATE users SET following_count = following_count + 1 WHERE user_id = $1",
                    [followerId]
                );
                await client.query(
                    "UPDATE users SET follower_count = follower_count + 1 WHERE user_id = $1",
                    [followingId]
                );

                // Send FCM push notification
                const followerRes = await client.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [followerId]);
                const follower = followerRes.rows[0];
                SocialNotifications.onNewFollower(
                    followingId,
                    followerId,
                    follower?.name || 'User',
                    follower?.profile_image_url
                ).catch(() => {});

                await client.query('COMMIT');

                // Real-time: push follow event and notification (fire and forget)
                emitFollow(followingId, { follower_id: followerId }).catch(() => {});
                emitNotification(followingId, { type: 'social_follow', actor_id: followerId }).catch(() => {});

                return NextResponse.json({ following: true, status: 'accepted' });
            }
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            await client.end();
        }

    } catch (error: any) {
        if (error.message === 'BLOCKED') {
            return NextResponse.json({ error: "BLOCKED" }, { status: 403 });
        }
        console.error("V1 Social Follow POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * GET /api/v1/social/follow/[id]
 * Check if current user follows [id] — status is 'accepted' | 'pending' | null
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const followerId = await getUserIdFromRequest(req);
        if (!followerId) return NextResponse.json({ following: false, status: null });

        const followingId = params.id;

        const result = await db.query(
            "SELECT status FROM social_follows WHERE follower_id = $1 AND following_id = $2",
            [followerId, followingId]
        );

        const status = result.rows[0]?.status ?? null;
        return NextResponse.json({ following: status === 'accepted', status });

    } catch (error) {
        console.error("V1 Social Follow GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
