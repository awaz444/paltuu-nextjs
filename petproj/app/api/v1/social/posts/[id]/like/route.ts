import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitLike } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";
import { assertNotBlocked } from "@/lib/moderation";
import { recordEngagementEvent } from "@/lib/interestScoring";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/posts/[id]/like
 * Toggle like — likes if not liked, unlikes if already liked
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const limited = await rateLimit(req, LIMITS.LIKE);
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const postId = params.id;

        // Get post author for notification
        const postInfo = await db.query(
            "SELECT user_id FROM social_posts WHERE post_id = $1 AND is_deleted = false",
            [postId]
        );
        if (postInfo.rowCount === 0) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        const postAuthorId = postInfo.rows[0].user_id;

        await assertNotBlocked(userId, postAuthorId);

        // Check if already liked
        const existing = await db.query(
            "SELECT like_id FROM social_likes WHERE post_id = $1 AND user_id = $2",
            [postId, userId]
        );

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            if ((existing.rowCount ?? 0) > 0) {
                // Unlike
                await client.query("DELETE FROM social_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
                await client.query("UPDATE social_posts SET like_count = GREATEST(0, like_count - 1) WHERE post_id = $1", [postId]);
                await client.query('COMMIT');

                const updated = await client.query("SELECT like_count FROM social_posts WHERE post_id = $1", [postId]);
                const likeCount = updated.rows[0]?.like_count ?? 0;
                // Fire-and-forget real-time event
                emitLike(postId, userId, likeCount, false);
                return NextResponse.json({ liked: false, like_count: likeCount });

            } else {
                // Like
                await client.query("INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2)", [postId, userId]);
                await client.query("UPDATE social_posts SET like_count = like_count + 1 WHERE post_id = $1", [postId]);

                await client.query('COMMIT');

                // Notify AFTER commit (fire-and-forget) — matches the comments route
                // and guarantees we never notify about a like that rolled back.
                if (postAuthorId !== userId) {
                    const [likerRes, postRes] = await Promise.all([
                        db.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [userId]),
                        db.query(`SELECT url FROM social_post_media WHERE post_id = $1 LIMIT 1`, [postId]),
                    ]);
                    const liker = likerRes.rows[0];
                    const postImage = postRes.rows[0]?.url;

                    SocialNotifications.onPostLiked(
                        postAuthorId,
                        userId,
                        parseInt(postId),
                        liker?.name || 'User',
                        liker?.profile_image_url,
                        postImage
                    ).catch(() => {}); // Non-blocking
                }

                const updated = await client.query("SELECT like_count FROM social_posts WHERE post_id = $1", [postId]);
                const likeCount = updated.rows[0]?.like_count ?? 0;
                // Fire-and-forget real-time events (like count + notification)
                emitLike(postId, userId, likeCount, true);
                // Fire-and-forget interest scoring (only on like, not unlike)
                recordEngagementEvent(userId, postId, 'like').catch(() => {});
                return NextResponse.json({ liked: true, like_count: likeCount });
            }
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        if (error.message === 'BLOCKED') {
            // 404, not 403 — don't confirm to the blocked user that the post exists
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        console.error("V1 Social Likes POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
