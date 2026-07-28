import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

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
