import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitComment, emitNotification } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";
import { assertNotBlocked, assertNotSuspended, checkIsBlocked } from "@/lib/moderation";
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
import { validateSocialMediaPayload } from "@/lib/giphyMedia";
import { invalidateViewerPostCache } from "@/lib/redis";
import { hasSevereMatch, redactSevereWords } from "@/lib/moderation/badWords";
import { redactModerationFields } from "@/lib/moderationRedaction";

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
        const rootOnlyRaw = searchParams.get("rootOnly");
        const rootOnly = rootOnlyRaw != null ? parseInt(rootOnlyRaw, 10) : null;

        // Private-post gate — same rule as the main feed (Step 1): a private
        // author's post is invisible to anyone who isn't the author or an
        // accepted follower. The one narrow exception is a surfaced-comment
        // deep link (?rootOnly=<commentId>): the feed already told this viewer
        // a specific comment exists because they follow ITS author, so that
        // one thread is readable even though the post itself stays hidden —
        // re-verified here rather than trusted blindly from the client.
        const postRes = await db.query(
            `SELECT p.post_id, p.user_id,
                    p.is_shadow_hidden AS post_is_shadow_hidden,
                    u.is_private,
                    EXISTS(
                        SELECT 1 FROM social_follows f
                        WHERE f.follower_id = $2 AND f.following_id = p.user_id AND f.status = 'accepted'
                    ) AS viewer_is_following
             FROM social_posts p
             JOIN users u ON u.user_id = p.user_id
             WHERE p.post_id = $1 AND p.is_deleted = false`,
            [postId, userId || 0]
        );
        if (postRes.rowCount === 0) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        const post = postRes.rows[0];
        const isOwner = userId !== 0 && userId === post.user_id;

        // A shadow-hidden post's thread is author-only, full stop — no
        // follower access and no surfaced-comment deep link either (those
        // comments are never surfaced in the first place; see
        // lib/commentSurfacing.ts), so there's nothing to scope access to.
        // The author still sees their thread exactly as before.
        if (post.post_is_shadow_hidden && !isOwner) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const hasFullAccess = isOwner || !post.is_private || post.viewer_is_following;

        // The single comment/reply this narrow access, if any, is scoped to —
        // resolved to its thread ROOT so the full surrounding subtree renders
        // (a bare reply with no parent context would look broken).
        let scopedRootId: number | null = null;
        if (!hasFullAccess && rootOnly != null && !Number.isNaN(rootOnly)) {
            const rootComment = await db.query(
                `SELECT comment_id, root_comment_id, user_id
                 FROM social_comments
                 WHERE comment_id = $1 AND post_id = $2 AND is_deleted = false`,
                [rootOnly, postId]
            );
            if ((rootComment.rowCount ?? 0) > 0) {
                const row = rootComment.rows[0];
                const viewerFollowsCommenter = await db.query(
                    `SELECT 1 FROM social_follows WHERE follower_id = $1 AND following_id = $2 AND status = 'accepted'`,
                    [userId, row.user_id]
                );
                if ((viewerFollowsCommenter.rowCount ?? 0) > 0) {
                    scopedRootId = row.root_comment_id ?? row.comment_id;
                }
            }
        }

        if (!hasFullAccess && scopedRootId == null) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const cursorClause = hasCursor && hasFullAccess ? `AND c.comment_id > $4` : "";
        const scopedRootClause = scopedRootId != null ? `AND c.comment_id = $4` : "";
        const queryParams: any[] = [
            postId,
            userId,
            hasFullAccess ? limit : 1,
            ...(scopedRootId != null ? [scopedRootId] : hasCursor && hasFullAccess ? [cursor] : []),
        ];

        // Not blocked in either direction (reused for both the root selection and
        // the subtree fetch).
        const notBlocked = `NOT EXISTS (
            SELECT 1 FROM user_blocks b
            WHERE (b.blocker_id = $2 AND b.blocked_id = c.user_id)
               OR (b.blocker_id = c.user_id AND b.blocked_id = $2)
        )`;

        // A shadow-hidden comment is invisible to everyone except its own
        // author — same rule as shadow-hidden posts (see
        // lib/moderationRedaction.ts). Applied at both levels: hiding a ROOT
        // hides its whole reply subtree for other viewers (you can't see
        // replies to a comment you can't see); hiding a REPLY only removes
        // that one reply from an otherwise-visible thread.
        const notShadowHidden = `(c.is_shadow_hidden = false OR c.user_id = $2)`;

        const result = await db.query(`
            WITH roots AS (
                SELECT c.comment_id
                FROM social_comments c
                WHERE c.post_id = $1 AND c.is_deleted = false
                  AND c.parent_comment_id IS NULL
                  AND ${notBlocked}
                  AND ${notShadowHidden}
                  ${cursorClause}
                  ${scopedRootClause}
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
                u.founding_club AS author_founding_club,
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
              AND ${notShadowHidden}
            ORDER BY c.comment_id ASC
        `, queryParams);

        const comments = result.rows;
        // Never let the shadow-hide flag reach the app — an author who could
        // see it would know their comment had been moderated.
        redactModerationFields(comments);
        // The cursor advances by root comment. has_more is true only when this
        // page filled its root quota (a full page of roots may still be followed
        // by more). A scoped (?rootOnly=) fetch is always a single fixed thread,
        // never paginated.
        const rootRows = comments.filter((c: any) => c.parent_comment_id == null);
        const nextCursor = scopedRootId == null && rootRows.length === limit
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
        await assertNotSuspended(userId);

        const body = await req.json();
        const { content, parent_comment_id, media } = body;
        const mediaList: any[] = Array.isArray(media) ? media : [];
        const text = typeof content === 'string' ? content.trim() : '';

        // Text-only comments need content; media-only (image/gif/video) is allowed
        // with an empty string — mirrors create-post and the mobile composer.
        if (!text && mediaList.length === 0) {
            return NextResponse.json({ error: "Comment content or media is required" }, { status: 400 });
        }

        const mediaError = validateSocialMediaPayload(mediaList);
        if (mediaError) {
            return NextResponse.json({ error: mediaError }, { status: 400 });
        }

        // Commenting on a plain repost card must comment on the underlying root
        // post — a plain repost entry is a hollow row with no comments of its own.
        const resolved = await resolveRepostTarget(db, params.id);
        if (!resolved || resolved.isDeleted) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        const postId = resolved.postId;
        const postAuthorId = resolved.authorId;

        // A shadow-hidden post is readable only by its author, so nobody else
        // may comment on it. The author commenting on their own post still
        // works normally. 404 keeps the moderation decision unobservable.
        if (resolved.isShadowHidden && resolved.authorId !== userId) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        await assertNotBlocked(userId, postAuthorId);

        // Auto-moderation: a SEVERE match (slurs — see lib/moderation/badWords.ts)
        // REDACTS the comment rather than shadow-hiding it. Hiding a reply
        // outright orphans its own replies and breaks the thread's connecting
        // line, so the comment stays exactly where it is in the tree and only
        // the offending word is covered (grey chip, rendered by the client from
        // the marker lib/moderationRedaction.ts substitutes on read).
        //
        // Unlike a shadow-hide, this is deliberately NOT silent: the row goes
        // out with moderation_state = 'redacted', which the composer uses to
        // warn the author that their wording was censored. Full shadow-hide
        // stays available to admins for cases where the whole comment has to
        // go (see app/api/v1/admin/social/comments/[id]/moderate/route.ts).
        const autoRedact = text ? hasSevereMatch(text) : false;
        // The raw text is what gets stored (admins review the original, and
        // restoring to 'none' has to bring the real wording back). Everything
        // that leaves this request — notification previews, the realtime
        // broadcast, the response body — uses the censored copy instead.
        const publicText = autoRedact ? redactSevereWords(text) : text;

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
                    (post_id, user_id, parent_comment_id, root_comment_id, content, depth, moderation_state, is_shadow_hidden)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                postId, userId, parent_comment_id || null, root_comment_id, text, depth,
                autoRedact ? 'redacted' : 'none', false,
            ]);

            comment = result.rows[0];

            // Denormalized reply counter on the immediate parent (mirrors like_count).
            if (parent_comment_id) {
                await client.query(
                    "UPDATE social_comments SET reply_count = reply_count + 1 WHERE comment_id = $1",
                    [parent_comment_id]
                );
            }

            // Persist attached media (uploaded images/videos, or CDN GIFs)
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
            parsedMentions = parseMentions(text);
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

        if (autoRedact) {
            // Logged for the admin queue so a human can still review the
            // original wording (and escalate to a shadow-hide or a suspension
            // if the censored version isn't enough). Notifications and the
            // realtime broadcast below are NOT suppressed — a redacted comment
            // is visible to everyone, so the thread behaves normally; they just
            // carry `publicText` rather than the raw slur.
            db.query(
                `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
                 VALUES (NULL, 'auto_redact:severe_word_match', $1, 'successful')`,
                [`comment:${comment.comment_id}`]
            ).catch(() => {});
        }

        // Fire-and-forget interest scoring (every successful comment / reply)
        recordEngagementEvent(userId, postId, 'comment').catch(() => {});
        invalidateViewerPostCache(postId, userId).catch(() => {});

        // Fetch notification metadata AFTER the transaction (pool queries, non-blocking)
        const commenterRes = await db.query(`SELECT name, profile_image_url, social_username, verified, founding_club FROM users WHERE user_id = $1`, [userId]);
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
                publicText,
                postImage,
                comment.comment_id
            ).catch(() => {});
        }

        // Notification: parent comment author (if replying to someone else's comment)
        if (parentAuthorId && parentAuthorId !== userId && parentAuthorId !== postAuthorId) {
            SocialNotifications.onCommentReplied(
                parentAuthorId,
                userId,
                parseInt(postId),
                commenter?.name || 'User',
                publicText,
                postImage,
                parent_comment_id
            ).catch(() => {});
        }

        // Real-time: push comment to all viewers of the post (fire and forget).
        // Carries the censored copy — this path bypasses the read-time
        // redaction in lib/moderationRedaction.ts, so it has to censor itself.
        emitComment(postId, {
            ...comment,
            content: publicText,
            author_name: commenter?.name,
            author_image: commenter?.profile_image_url ?? null,
            social_username: commenter?.social_username ?? null,
            author_verified: commenter?.verified ?? false,
            author_founding_club: commenter?.founding_club ?? false,
        }).catch(() => {});

        // Real-time: push notification to post author
        if (postAuthorId !== userId) {
            emitNotification(postAuthorId, {
                type: 'social_comment',
                post_id: postId,
                comment_id: comment.comment_id,
            }).catch(() => {});
        }

        // Notify mentioned users/pet-owners (fire and forget — non-blocking).
        // Excludes the post/parent-comment author: replying auto-mentions them
        // (see RN's handleReply), and they already got the more specific
        // "replied to your comment" / "commented on your post" notification
        // above — a second "mentioned you" for the same action would be a dupe.
        if (parsedMentions.length > 0) {
            notifyNewMentions(parsedMentions, {
                mentionerId: userId,
                mentionerName: commenter?.name || 'User',
                postId: parseInt(postId),
                isComment: true,
                commentId: comment.comment_id,
                postImageUrl: postImage,
                preview: publicText,
                excludeUserIds: [postAuthorId, parentAuthorId].filter(
                    (id): id is number => id != null
                ),
            }).catch(() => {});
        }

        // Censors `content` in place when moderation_state is 'redacted', so
        // the author's own optimistic row is replaced by the same censored
        // text everyone else sees — and reads moderation_state to show them
        // the "we hid some words" warning.
        redactModerationFields(comment);
        return NextResponse.json(comment, { status: 201 });

    } catch (error: any) {
        if (error.message === 'BLOCKED') {
            return NextResponse.json({ error: "BLOCKED" }, { status: 403 });
        }
        if (error.message === 'SUSPENDED') {
            return NextResponse.json({ error: "This account has been suspended for violating our Community Guidelines." }, { status: 403 });
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
