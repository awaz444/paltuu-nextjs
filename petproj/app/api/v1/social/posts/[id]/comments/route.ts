import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitComment, emitNotification } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";
import { assertNotBlocked, checkIsBlocked } from "@/lib/moderation";
import { recordEngagementEvent } from "@/lib/interestScoring";
import { resolveRepostTarget } from "@/lib/reposts";
import {
    parseMentions,
    validateMentions,
    persistMentions,
    notifyNewMentions,
    MAX_MENTIONS_PER_CONTENT,
    type ParsedMention,
} from "@/lib/mentions";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts/[id]/comments
 * Paginated comments with nested replies.
 * ?cursor=<root_comment_id>&limit=<roots per page, default 20>
 *
 * Pagination is by ROOT (top-level) comment, and every page returns each root's
 * ENTIRE reply subtree alongside it. This guarantees a comment is never split
 * from its replies across pages — otherwise a parent could load on one page and
 * its replies on a later, not-yet-fetched page, making it look reply-less.
 * The cursor is the last root's comment_id (unique + monotonic → stable,
 * gap-free, duplicate-free pages). The client rebuilds the tree and sorts by
 * "Top" itself, so flat id ordering here is fine.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        const userId = userIdRaw ? parseInt(String(userIdRaw), 10) : 0;

        // A plain repost has no comments of its own — they live on the root post.
        const resolved = await resolveRepostTarget(db, params.id);
        const postId = resolved ? resolved.postId : params.id;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const cursorRaw = searchParams.get("cursor");
        const cursor = cursorRaw != null ? parseInt(cursorRaw, 10) : null;
        const hasCursor = cursor != null && !Number.isNaN(cursor);

        const cursorClause = hasCursor ? `AND c.comment_id > $4` : "";
        const queryParams: any[] = [postId, userId, limit, ...(hasCursor ? [cursor] : [])];

        // Not blocked in either direction (reused for both the root selection and
        // the subtree fetch).
        const notBlocked = `NOT EXISTS (
            SELECT 1 FROM user_blocks b
            WHERE (b.blocker_id = $2 AND b.blocked_id = c.user_id)
               OR (b.blocker_id = c.user_id AND b.blocked_id = $2)
        )`;

        const result = await db.query(`
            WITH roots AS (
                SELECT c.comment_id
                FROM social_comments c
                WHERE c.post_id = $1 AND c.is_deleted = false
                  AND c.parent_comment_id IS NULL
                  AND ${notBlocked}
                  ${cursorClause}
                ORDER BY c.comment_id ASC
                LIMIT $3
            ),
            comment_media AS (
                SELECT comment_id, json_agg(m ORDER BY m.ordering) AS media
                FROM social_comment_media m
                GROUP BY comment_id
            )
            SELECT
                c.*,
                u.name              AS author_name,
                u.profile_image_url AS author_image,
                u.social_username,
                u.verified     AS author_verified,
                false               AS is_blocked_by_me,
                false               AS is_blocking_me,
                COALESCE(cm.media, '[]'::json) AS media,
                (scl.comment_id IS NOT NULL) AS is_liked
            FROM social_comments c
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN comment_media cm ON cm.comment_id = c.comment_id
            LEFT JOIN social_comment_likes scl ON scl.comment_id = c.comment_id AND scl.user_id = $2
            WHERE c.post_id = $1 AND c.is_deleted = false
              AND (
                c.comment_id IN (SELECT comment_id FROM roots)
                OR c.root_comment_id IN (SELECT comment_id FROM roots)
              )
              AND ${notBlocked}
            ORDER BY c.comment_id ASC
        `, queryParams);

        const comments = result.rows;
        // The cursor advances by root comment. has_more is true only when this
        // page filled its root quota (a full page of roots may still be followed
        // by more).
        const rootRows = comments.filter((c: any) => c.parent_comment_id == null);
        const nextCursor = rootRows.length === limit
            ? rootRows[rootRows.length - 1].comment_id
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

        const body = await req.json();
        const { content, parent_comment_id, media } = body;
        const mediaList: any[] = Array.isArray(media) ? media : [];

        if (!content?.trim()) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }

        // Commenting on a plain repost card must comment on the underlying root
        // post — a plain repost entry is a hollow row with no comments of its own.
        const resolved = await resolveRepostTarget(db, params.id);
        if (!resolved || resolved.isDeleted) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        const postId = resolved.postId;
        const postAuthorId = resolved.authorId;

        await assertNotBlocked(userId, postAuthorId);

        let depth = 0;
        let root_comment_id = null;
        let parentAuthorId: number | null = null;

        // Check out a dedicated client so BEGIN/INSERT/COMMIT all run on ONE connection
        const client = await db.connect();
        let comment: any;
        let parsedMentions: ParsedMention[] = [];
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

            // Persist attached media (images/videos already uploaded via /social/upload)
            for (let i = 0; i < mediaList.length; i++) {
                const m = mediaList[i];
                await client.query(`
                    INSERT INTO social_comment_media (comment_id, media_type, url, thumbnail_url, ordering)
                    VALUES ($1, $2, $3, $4, $5)
                `, [comment.comment_id, m.media_type, m.url, m.thumbnail_url || null, i]);
            }
            comment.media = mediaList.map((m, i) => ({
                media_type: m.media_type,
                url: m.url,
                thumbnail_url: m.thumbnail_url || null,
                ordering: i,
            }));

            // Parse, validate & persist @mentions from content (covers both
            // top-level comments and replies — both are social_comments rows)
            parsedMentions = parseMentions(content.trim());
            if (parsedMentions.length > MAX_MENTIONS_PER_CONTENT) {
                await client.query('ROLLBACK');
                client.release();
                return NextResponse.json(
                    { error: `A comment can mention at most ${MAX_MENTIONS_PER_CONTENT} users/pets` },
                    { status: 400 }
                );
            }
            await validateMentions(client, parsedMentions, userId);
            await persistMentions(client, { commentId: comment.comment_id }, parsedMentions, userId);

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

        // Fire-and-forget interest scoring (every successful comment / reply)
        recordEngagementEvent(userId, postId, 'comment').catch(() => {});

        // Fetch notification metadata AFTER the transaction (pool queries, non-blocking)
        const commenterRes = await db.query(`SELECT name, profile_image_url, social_username, verified FROM users WHERE user_id = $1`, [userId]);
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
                content.trim(),
                postImage
            ).catch(() => {});
        }

        // Real-time: push comment to all viewers of the post (fire and forget)
        emitComment(postId, {
            ...comment,
            author_name: commenter?.name,
            author_image: commenter?.profile_image_url ?? null,
            social_username: commenter?.social_username ?? null,
            author_verified: commenter?.verified ?? false,
        }).catch(() => {});

        // Real-time: push notification to post author
        if (postAuthorId !== userId) {
            emitNotification(postAuthorId, {
                type: 'social_comment',
                post_id: postId,
                comment_id: comment.comment_id,
            }).catch(() => {});
        }

        // Notify mentioned users/pet-owners (fire and forget — non-blocking)
        if (parsedMentions.length > 0) {
            notifyNewMentions(parsedMentions, {
                mentionerId: userId,
                mentionerName: commenter?.name || 'User',
                postId: parseInt(postId),
                isComment: true,
                postImageUrl: postImage,
                preview: content.trim(),
            }).catch(() => {});
        }

        return NextResponse.json(comment, { status: 201 });

    } catch (error: any) {
        if (error.message === 'BLOCKED') {
            return NextResponse.json({ error: "BLOCKED" }, { status: 403 });
        }
        console.error("V1 Social Comments POST error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const isValidationError =
            message.includes('do not belong to you') ||
            message.includes('do not exist') ||
            message.includes('mention at most');
        return NextResponse.json(
            { error: message },
            { status: isValidationError ? 400 : 500 }
        );
    }
}
