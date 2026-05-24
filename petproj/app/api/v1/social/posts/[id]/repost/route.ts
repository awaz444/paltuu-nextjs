import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { emitRepost, emitNotification } from "@/utils/realtimeEmitter";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { SocialNotifications } from "@/lib/notifications";
import { assertNotBlocked } from "@/lib/moderation";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/posts/[id]/repost
 * Repost a post (with optional caption). Idempotent — ignores duplicate reposts.
 *
 * Body: { caption?: string }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const limited = await rateLimit(req, LIMITS.REPOST);
        if (limited) return limited;

        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const originalPostId = params.id;
        const body = await req.json().catch(() => ({}));
        const caption = body.caption || null;

        // 1. Verify original post exists
        const original = await db.query(
            `SELECT post_id, user_id FROM social_posts WHERE post_id = $1 AND is_deleted = false`,
            [originalPostId]
        );
        if (original.rowCount === 0) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        const originalAuthorId = original.rows[0].user_id;

        // 2. Check if already reposted
        const existing = await db.query(
            "SELECT repost_id FROM social_reposts WHERE post_id = $1 AND user_id = $2",
            [originalPostId, userId]
        );
        if ((existing.rowCount ?? 0) > 0) {
            return NextResponse.json({ reposted: true, message: "Already reposted" });
        }

        // 3. Ensure no blocking relationship exists
        await assertNotBlocked(userId, originalAuthorId);

        await db.query('BEGIN');
        try {
            // 3. Record the repost relationship
            await db.query(
                "INSERT INTO social_reposts (post_id, user_id, caption) VALUES ($1, $2, $3)",
                [originalPostId, userId, caption]
            );

            // 4. Create a new post entry (the repost in feed)
            const repostEntry = await db.query(`
                INSERT INTO social_posts
                    (user_id, post_type, content, original_post_id, is_repost)
                VALUES ($1, 'repost', $2, $3, true)
                RETURNING *
            `, [userId, caption, originalPostId]);

            // 5. Update repost_count on original
            await db.query(
                "UPDATE social_posts SET repost_count = repost_count + 1 WHERE post_id = $1",
                [originalPostId]
            );

            // 6. Update user post_count
            await db.query(
                "UPDATE users SET post_count = post_count + 1 WHERE user_id = $1",
                [userId]
            );

            // 7. Create notification for original author (if not reposting own post)
            if (originalAuthorId !== userId) {
                // Fetch reposter and post details
                const [reposterRes, postImageRes] = await Promise.all([
                    db.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [userId]),
                    db.query(`SELECT (SELECT url FROM social_post_media WHERE post_id = $1 LIMIT 1) as image_url`, [originalPostId])
                ]);
                const reposter = reposterRes.rows[0];
                const postImage = postImageRes.rows[0]?.image_url;

                SocialNotifications.onPostReposted(
                    originalAuthorId,
                    userId,
                    parseInt(originalPostId),
                    reposter?.name || 'User',
                    postImage
                ).catch(() => {});
            }

            await db.query('COMMIT');

            // Real-time: push repost count update to post viewers
            const updatedPost = await db.query(
                "SELECT repost_count FROM social_posts WHERE post_id = $1",
                [originalPostId]
            );
            emitRepost(originalPostId, userId, updatedPost.rows[0]?.repost_count ?? 0).catch(() => {});

            // Real-time: push notification to original author
            if (originalAuthorId !== userId) {
                emitNotification(originalAuthorId, {
                    type: 'social_repost',
                    post_id: originalPostId,
                    actor_id: userId,
                }).catch(() => {});
            }

            return NextResponse.json({ reposted: true, post: repostEntry.rows[0] }, { status: 201 });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error: any) {
        if (error.message === 'BLOCKED') {
            return NextResponse.json({ error: "BLOCKED" }, { status: 403 });
        }
        console.error("V1 Social Repost POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/social/posts/[id]/repost
 * Undo a repost
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const originalPostId = params.id;

        const existing = await db.query(
            "SELECT repost_id FROM social_reposts WHERE post_id = $1 AND user_id = $2",
            [originalPostId, userId]
        );
        if ((existing.rowCount ?? 0) === 0) {
            return NextResponse.json({ reposted: false, message: "No repost found" });
        }

        await db.query('BEGIN');
        try {
            // Remove repost record
            await db.query(
                "DELETE FROM social_reposts WHERE post_id = $1 AND user_id = $2",
                [originalPostId, userId]
            );

            // Soft-delete the repost post entry
            await db.query(`
                UPDATE social_posts
                SET is_deleted = true
                WHERE original_post_id = $1 AND user_id = $2 AND is_repost = true
            `, [originalPostId, userId]);

            // Decrement counts
            await db.query(
                "UPDATE social_posts SET repost_count = GREATEST(0, repost_count - 1) WHERE post_id = $1",
                [originalPostId]
            );
            await db.query(
                "UPDATE users SET post_count = GREATEST(0, post_count - 1) WHERE user_id = $1",
                [userId]
            );

            await db.query('COMMIT');
            return NextResponse.json({ reposted: false });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Repost DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
