import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitCommentLike } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";
import { assertNotBlocked } from "@/lib/moderation";
import { recordEngagementEvent } from "@/lib/interestScoring";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/comments/[id]/like
 * Toggle like on a comment/reply — likes if not liked, unlikes if already liked
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const limited = await rateLimit(req, LIMITS.LIKE);
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const commentId = params.id;

        const commentInfo = await db.query(
            "SELECT comment_id, post_id, user_id FROM social_comments WHERE comment_id = $1 AND is_deleted = false",
            [commentId]
        );
        if (commentInfo.rowCount === 0) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }
        const { post_id: postId, user_id: commentAuthorId } = commentInfo.rows[0];

        await assertNotBlocked(userId, commentAuthorId);

        const existing = await db.query(
            "SELECT like_id FROM social_comment_likes WHERE comment_id = $1 AND user_id = $2",
            [commentId, userId]
        );

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            if ((existing.rowCount ?? 0) > 0) {
                // Unlike
                await client.query("DELETE FROM social_comment_likes WHERE comment_id = $1 AND user_id = $2", [commentId, userId]);
                await client.query("UPDATE social_comments SET like_count = GREATEST(0, like_count - 1) WHERE comment_id = $1", [commentId]);
                await client.query('COMMIT');

                const updated = await client.query("SELECT like_count FROM social_comments WHERE comment_id = $1", [commentId]);
                const likeCount = updated.rows[0]?.like_count ?? 0;
                emitCommentLike(postId, commentId, userId, likeCount, false);
                return NextResponse.json({ liked: false, like_count: likeCount });

            } else {
                // Like
                await client.query("INSERT INTO social_comment_likes (comment_id, user_id) VALUES ($1, $2)", [commentId, userId]);
                await client.query("UPDATE social_comments SET like_count = like_count + 1 WHERE comment_id = $1", [commentId]);

                await client.query('COMMIT');

                // Notify AFTER commit (fire-and-forget) — matches the comments route
                // and guarantees we never notify about a like that rolled back.
                if (commentAuthorId !== userId) {
                    const [likerRes, postRes] = await Promise.all([
                        db.query(`SELECT name FROM users WHERE user_id = $1`, [userId]),
                        db.query(`SELECT url FROM social_post_media WHERE post_id = $1 LIMIT 1`, [postId]),
                    ]);
                    const liker = likerRes.rows[0];
                    const postImage = postRes.rows[0]?.url;

                    SocialNotifications.onCommentLiked(
                        commentAuthorId,
                        userId,
                        postId,
                        liker?.name || 'User',
                        postImage
                    ).catch(() => {});
                }

                const updated = await client.query("SELECT like_count FROM social_comments WHERE comment_id = $1", [commentId]);
                const likeCount = updated.rows[0]?.like_count ?? 0;
                emitCommentLike(postId, commentId, userId, likeCount, true);
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
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }
        console.error("V1 Social Comment Like POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
