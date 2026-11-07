import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { archiveDeletedComments } from "@/lib/activityArchive";
import { assertNotSuspended } from "@/lib/moderation";
import { hasSevereMatch, redactSevereWords } from "@/lib/moderation/badWords";
import {
    parseMentions,
    validateMentions,
    deleteMentions,
    persistMentions,
    notifyNewMentions,
    MAX_MENTIONS_PER_CONTENT,
    type ParsedMention,
} from "@/lib/mentions";

export const dynamic = "force-dynamic";

const MAX_CHARS = 2000;

/**
 * The website shows mentions as plain "@name", so an edit made there comes back
 * without the {@}[name](user:1) tokens. Put back each mention the comment
 * already had whose "@name" is still in the text, so editing a typo does not
 * quietly turn a mention into plain text.
 */
function restoreMentionTokens(text: string, previous: ParsedMention[]): string {
    let out = text;
    for (const m of previous) {
        const plain = `@${m.displayName}`;
        const token = `{@}[${m.displayName}](${m.type}:${m.id})`;
        if (!out.includes(token) && out.includes(plain)) out = out.replace(plain, token);
    }
    return out;
}

/**
 * PATCH /api/v1/social/comments/[id]  { content }
 * Edit the text of your own comment or reply. Media stays as it is.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);
        await assertNotSuspended(userId);

        const body = await req.json().catch(() => ({}));
        const raw = typeof body.content === "string" ? body.content.trim() : "";
        if (!raw) return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        if (raw.length > MAX_CHARS) return NextResponse.json({ error: `Keep it under ${MAX_CHARS} characters` }, { status: 400 });

        const existing = await db.query(
            "SELECT comment_id, post_id, user_id, content, moderation_state FROM social_comments WHERE comment_id = $1 AND is_deleted = false",
            [params.id]
        );
        if (existing.rowCount === 0) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        const row = existing.rows[0];
        if (row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const oldMentions = parseMentions(row.content);
        const text = restoreMentionTokens(raw, oldMentions);
        if (text === row.content) {
            return NextResponse.json({ updated: false, comment_id: row.comment_id, content: text, moderation_state: row.moderation_state });
        }

        const newMentions = parseMentions(text);
        if (newMentions.length > MAX_MENTIONS_PER_CONTENT) {
            return NextResponse.json(
                { error: `A comment can mention at most ${MAX_MENTIONS_PER_CONTENT} users/pets` },
                { status: 400 }
            );
        }

        // Same auto-moderation as posting. One-way, like post edits: an edit can
        // redact but never clears a state a moderator (or an earlier match) set.
        const autoRedact = hasSevereMatch(text);
        const moderationState = autoRedact ? "redacted" : row.moderation_state;

        const client = await db.connect();
        try {
            await client.query("BEGIN");
            try {
                await validateMentions(client, newMentions, userId);
            } catch (e: any) {
                await client.query("ROLLBACK");
                return NextResponse.json({ error: e.message }, { status: 400 });
            }
            const updated = await client.query(
                `UPDATE social_comments SET content = $1, moderation_state = $2, updated_at = NOW()
                  WHERE comment_id = $3 RETURNING comment_id, post_id, content, moderation_state, updated_at`,
                [text, moderationState, row.comment_id]
            );
            await deleteMentions(client, { commentId: row.comment_id });
            await persistMentions(client, { postId: row.post_id, commentId: row.comment_id }, newMentions, userId);
            await client.query("COMMIT");

            // Only people newly mentioned by this edit get notified.
            const oldKeys = new Set(oldMentions.map((m) => `${m.type}:${m.id}`));
            const added = newMentions.filter((m) => !oldKeys.has(`${m.type}:${m.id}`));
            const publicText = autoRedact ? redactSevereWords(text) : text;
            if (added.length > 0) {
                const author = await db.query("SELECT name FROM users WHERE user_id = $1", [userId]);
                notifyNewMentions(added, {
                    mentionerId: userId,
                    mentionerName: author.rows[0]?.name || "User",
                    postId: Number(row.post_id),
                    isComment: true,
                    commentId: Number(row.comment_id),
                    preview: publicText,
                }).catch(() => {});
            }

            return NextResponse.json({ updated: true, ...updated.rows[0], content: publicText });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    } catch (error: any) {
        if (error?.message === "SUSPENDED") {
            return NextResponse.json({ error: "This account has been suspended for violating our Community Guidelines." }, { status: 403 });
        }
        console.error("V1 Social Comment PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/social/comments/[id]
 * Soft-delete a comment/reply (only the author can delete). Cascades to every
 * descendant reply in the subtree, since a reply orphaned under a deleted
 * parent has nothing to attach to in the comment tree.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const commentId = params.id;

        const comment = await db.query(
            "SELECT comment_id, post_id, user_id, parent_comment_id FROM social_comments WHERE comment_id = $1 AND is_deleted = false",
            [commentId]
        );
        if (comment.rowCount === 0) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        if (comment.rows[0].user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        const postId = comment.rows[0].post_id;
        const parentCommentId = comment.rows[0].parent_comment_id;

        const client = await db.connect();
        try {
            await archiveDeletedComments(client, commentId, userId);

            await client.query('BEGIN');

            // Deeper reply_counts die along with their rows below — only the
            // immediate parent of the comment being deleted needs decrementing.
            if (parentCommentId) {
                await client.query(
                    "UPDATE social_comments SET reply_count = GREATEST(0, reply_count - 1) WHERE comment_id = $1",
                    [parentCommentId]
                );
            }

            // Cascade: soft-delete this comment plus every descendant reply in its subtree
            const deleted = await client.query(
                `
                WITH RECURSIVE subtree AS (
                    SELECT comment_id FROM social_comments WHERE comment_id = $1
                    UNION ALL
                    SELECT c.comment_id FROM social_comments c
                    JOIN subtree s ON c.parent_comment_id = s.comment_id
                )
                UPDATE social_comments
                SET is_deleted = true, updated_at = NOW()
                WHERE comment_id IN (SELECT comment_id FROM subtree) AND is_deleted = false
                RETURNING comment_id
                `,
                [commentId]
            );
            const deletedCount = deleted.rowCount || 0;

            if (deletedCount > 0) {
                await client.query(
                    "UPDATE social_posts SET comment_count = GREATEST(0, comment_count - $2) WHERE post_id = $1",
                    [postId, deletedCount]
                );
            }

            await client.query('COMMIT');
            return NextResponse.json({
                deleted: true,
                deleted_comment_ids: deleted.rows.map((r: any) => r.comment_id),
            });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("V1 Social Comment DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
