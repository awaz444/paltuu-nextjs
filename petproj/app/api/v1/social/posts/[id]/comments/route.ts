import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitComment, emitNotification } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";
import { assertNotBlocked, checkIsBlocked } from "@/lib/moderation";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts/[id]/comments
 * Paginated comments with nested replies
 * ?cursor=timestamp&limit=20
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        const userId = userIdRaw ? parseInt(String(userIdRaw), 10) : 0;

        const postId = params.id;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = searchParams.get("cursor");

        const cursorClause = cursor ? `AND c.created_at > $4` : "";
        const queryParams: any[] = [postId, userId, limit, ...(cursor ? [cursor] : [])];

        const result = await db.query(`
            SELECT
                c.*,
                u.name              AS author_name,
                u.profile_image_url AS author_image,
                u.social_username,
                false               AS is_blocked_by_me,
                false               AS is_blocking_me
            FROM social_comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.post_id = $1 AND c.is_deleted = false
            AND NOT EXISTS (
                SELECT 1 FROM user_blocks b 
                WHERE (b.blocker_id = $2 AND b.blocked_id = c.user_id)
                   OR (b.blocker_id = c.user_id AND b.blocked_id = $2)
            )
            ${cursorClause}
            ORDER BY c.root_comment_id NULLS FIRST, c.created_at ASC
            LIMIT $3
        `, queryParams);

        const comments = result.rows;
        const nextCursor = comments.length === limit
            ? comments[comments.length - 1].created_at
            : null;

        return NextResponse.json({
            comments,
            next_cursor: nextCursor,
            has_more: nextCursor !== null,
        });

    } catch (error) {
        console.error("V1 Social Comments GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/social/posts/[id]/comments
 * Add a comment or reply to a post
 * Body: { content: string, parent_comment_id?: number }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const limited = await rateLimit(req, LIMITS.COMMENT);
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const postId = params.id;
        const body = await req.json();
        const { content, parent_comment_id } = body;

        if (!content?.trim()) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }

        // Get post for notification
        const postInfo = await db.query(
            "SELECT user_id FROM social_posts WHERE post_id = $1 AND is_deleted = false",
            [postId]
        );
        if (postInfo.rowCount === 0) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        const postAuthorId = postInfo.rows[0].user_id;

        await assertNotBlocked(userId, postAuthorId);

        let depth = 0;
        let root_comment_id = null;
        let parentAuthorId: number | null = null;

        // Check out a dedicated client so BEGIN/INSERT/COMMIT all run on ONE connection
        const client = await db.connect();
        let comment: any;
        try {
            await client.query('BEGIN');

            // Find depth + root if reply
            if (parent_comment_id) {
                const parent = await client.query(
                    "SELECT depth, root_comment_id, comment_id, user_id FROM social_comments WHERE comment_id = $1",
                    [parent_comment_id]
                );
                if ((parent.rowCount ?? 0) > 0) {
                    depth = (parent.rows[0].depth || 0) + 1;
                    root_comment_id = parent.rows[0].root_comment_id || parent.rows[0].comment_id;
                    parentAuthorId = parent.rows[0].user_id;
                    // Block check for parent comment author
                    const blocked = await checkIsBlocked(userId, parentAuthorId as number);
                    if (blocked) {
                        await client.query('ROLLBACK');
                        client.release();
                        return NextResponse.json({ error: "BLOCKED" }, { status: 403 });
                    }
                }
            }

            const result = await client.query(`
                INSERT INTO social_comments
                    (post_id, user_id, parent_comment_id, root_comment_id, content, depth)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [postId, userId, parent_comment_id || null, root_comment_id, content.trim(), depth]);

            comment = result.rows[0];

            // Increment comment count on post
            await client.query(
                "UPDATE social_posts SET comment_count = comment_count + 1 WHERE post_id = $1",
                [postId]
            );

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            client.release();
            throw e;
        }
        client.release();

        // Fetch notification metadata AFTER the transaction (pool queries, non-blocking)
        const commenterRes = await db.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [userId]);
        const commenter = commenterRes.rows[0];
        const postImageRes = await db.query(`SELECT (SELECT url FROM social_post_media WHERE post_id = $1 LIMIT 1) as image_url`, [postId]);
        const postImage = postImageRes.rows[0]?.image_url;

        // Notification: post author (if commenting on someone else's post)
        if (postAuthorId !== userId) {
            SocialNotifications.onPostCommented(
                postAuthorId,
                userId,
                parseInt(postId),
                commenter?.name || 'User',
                content.trim(),
                postImage
            ).catch(() => {});
        }

        // Notification: parent comment author (if replying to someone else's comment)
        if (parentAuthorId && parentAuthorId !== userId && parentAuthorId !== postAuthorId) {
            SocialNotifications.onCommentReplied(
                parentAuthorId,
                userId,
                parseInt(postId),
                commenter?.name || 'User',
                postImage
            ).catch(() => {});
        }

        // Real-time: push comment to all viewers of the post (fire and forget)
        emitComment(postId, {
            ...comment,
            author_name: commenter?.name,
            author_image: commenter?.profile_image_url ?? null,
            social_username: null,
        }).catch(() => {});

        // Real-time: push notification to post author
        if (postAuthorId !== userId) {
            emitNotification(postAuthorId, {
                type: 'social_comment',
                post_id: postId,
                comment_id: comment.comment_id,
            }).catch(() => {});
        }

        return NextResponse.json(comment, { status: 201 });

    } catch (error: any) {
        if (error.message === 'BLOCKED') {
            return NextResponse.json({ error: "BLOCKED" }, { status: 403 });
        }
        console.error("V1 Social Comments POST error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
