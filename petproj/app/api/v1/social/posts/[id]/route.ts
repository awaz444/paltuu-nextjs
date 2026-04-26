import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts/[id]
 * Fetch a single post with all context
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        const userId = userIdRaw ? parseInt(String(userIdRaw), 10) : 0;
        const postId = params.id;

        const result = await db.query(`
            SELECT 
                p.*,
                u.name              AS author_name,
                u.profile_image_url AS author_image,
                u.social_username,
                u.follower_count     AS author_followers,
                COALESCE(
                    (SELECT json_agg(m.* ORDER BY m.ordering) 
                     FROM social_post_media m 
                     WHERE m.post_id = p.post_id), 
                    '[]'::json
                ) AS media,
                -- repost context
                op.content          AS original_content,
                op.post_id          AS original_post_id_ref,
                op.user_id          AS original_user_id,
                ou.name             AS original_author_name,
                ou.social_username   AS original_social_username,
                ou.profile_image_url AS original_author_image,
                COALESCE(
                    (SELECT json_agg(om.* ORDER BY om.ordering) 
                     FROM social_post_media om 
                     WHERE om.post_id = op.post_id), 
                    '[]'::json
                ) AS original_media,
                -- viewer context
                EXISTS(
                    SELECT 1 FROM social_likes l 
                    WHERE l.post_id = p.post_id AND l.user_id = $2
                ) AS is_liked,
                EXISTS(
                    SELECT 1 FROM social_reposts r 
                    WHERE r.post_id = p.post_id AND r.user_id = $2
                ) AS is_reposted,
                EXISTS(
                    SELECT 1 FROM social_follows f
                    WHERE f.follower_id = $2 AND f.following_id = p.user_id
                ) AS is_following_author
            FROM social_posts p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN social_posts op ON op.post_id = p.original_post_id
            LEFT JOIN users ou ON ou.user_id = op.user_id
            WHERE p.post_id = $1 AND p.is_deleted = false
        `, [postId, userId || 0]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Increment view count (fire and forget, non-blocking)
        db.query(
            "UPDATE social_posts SET view_count = view_count + 1 WHERE post_id = $1",
            [postId]
        ).catch(() => {});

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Social Post GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/social/posts/[id]
 * Soft-delete a post (only the author can delete)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const postId = params.id;

        const post = await db.query(
            "SELECT user_id FROM social_posts WHERE post_id = $1 AND is_deleted = false",
            [postId]
        );

        if (post.rowCount === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        if (post.rows[0].user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await db.query('BEGIN');
        try {
            await db.query(
                "UPDATE social_posts SET is_deleted = true WHERE post_id = $1",
                [postId]
            );
            await db.query(
                "UPDATE users SET post_count = GREATEST(0, post_count - 1) WHERE user_id = $1",
                [userId]
            );
            await db.query('COMMIT');
            return NextResponse.json({ deleted: true });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Post DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
