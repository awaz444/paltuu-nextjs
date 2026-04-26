import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { fanOutPostToFollowers } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts
 * Fetch social feed — following users first, then global fallback
 * Cursor-based pagination (no OFFSET)
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = searchParams.get("cursor"); // ISO timestamp or null for first page
        const mode = searchParams.get("mode") || "following"; // 'following' | 'global'

        const cursorClause = cursor ? `AND p.created_at < $3` : "";
        const cursorParam = cursor ? [cursor] : [];

        let feedQuery: string;
        let queryParams: any[];

        if (userId && mode === "following") {
            // Show posts from people the user follows
            feedQuery = `
                SELECT 
                    p.*,
                    u.name            AS author_name,
                    u.profile_image_url AS author_image,
                    u.social_username,
                    COALESCE(
                        (SELECT json_agg(m.* ORDER BY m.ordering) 
                         FROM social_post_media m 
                         WHERE m.post_id = p.post_id), 
                        '[]'::json
                    ) AS media,
                    -- repost origin
                    op.content         AS original_content,
                    op.user_id         AS original_user_id,
                    ou.name            AS original_author_name,
                    ou.social_username  AS original_social_username,
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
                        WHERE l.post_id = p.post_id AND l.user_id = $1
                    ) AS is_liked,
                    EXISTS(
                        SELECT 1 FROM social_reposts r 
                        WHERE r.post_id = p.post_id AND r.user_id = $1
                    ) AS is_reposted
                FROM social_posts p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN social_posts op ON op.post_id = p.original_post_id
                LEFT JOIN users ou ON ou.user_id = op.user_id
                WHERE 
                    p.is_deleted = false 
                    AND p.is_hidden = false
                    AND (
                        p.user_id = $1
                        OR p.user_id IN (
                            SELECT following_id FROM social_follows WHERE follower_id = $1
                        )
                    )
                    ${cursorClause}
                ORDER BY p.created_at DESC
                LIMIT $2
            `;
            queryParams = [userId, limit, ...cursorParam];
        } else {
            // Global feed (no auth or explicitly requested)
            feedQuery = `
                SELECT 
                    p.*,
                    u.name            AS author_name,
                    u.profile_image_url AS author_image,
                    u.social_username,
                    COALESCE(
                        (SELECT json_agg(m.* ORDER BY m.ordering) 
                         FROM social_post_media m 
                         WHERE m.post_id = p.post_id), 
                        '[]'::json
                    ) AS media,
                    op.content         AS original_content,
                    op.user_id         AS original_user_id,
                    ou.name            AS original_author_name,
                    ou.social_username  AS original_social_username,
                    ou.profile_image_url AS original_author_image,
                    COALESCE(
                        (SELECT json_agg(om.* ORDER BY om.ordering) 
                         FROM social_post_media om 
                         WHERE om.post_id = op.post_id), 
                        '[]'::json
                    ) AS original_media,
                    EXISTS(
                        SELECT 1 FROM social_likes l 
                        WHERE l.post_id = p.post_id AND l.user_id = $1
                    ) AS is_liked,
                    EXISTS(
                        SELECT 1 FROM social_reposts r 
                        WHERE r.post_id = p.post_id AND r.user_id = $1
                    ) AS is_reposted
                FROM social_posts p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN social_posts op ON op.post_id = p.original_post_id
                LEFT JOIN users ou ON ou.user_id = op.user_id
                WHERE p.is_deleted = false AND p.is_hidden = false
                ${cursorClause}
                ORDER BY p.created_at DESC
                LIMIT $2
            `;
            queryParams = [userId || 0, limit, ...cursorParam];
        }

        const result = await db.query(feedQuery, queryParams);
        const posts = result.rows;

        // Next cursor = created_at of last post
        const nextCursor = posts.length === limit
            ? posts[posts.length - 1].created_at
            : null;

        return NextResponse.json({
            posts,
            next_cursor: nextCursor,
            has_more: nextCursor !== null,
        });

    } catch (error) {
        console.error("V1 Social Posts GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/social/posts
 * Create a new social post
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { pet_id, post_type, content, media = [] } = body;

        if (!post_type || (!content && media.length === 0)) {
            return NextResponse.json({ error: "Post content or media is required" }, { status: 400 });
        }

        await db.query('BEGIN');
        try {
            // 1. Create Post
            const postRes = await db.query(`
                INSERT INTO social_posts (user_id, pet_id, post_type, content)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [userId, pet_id || null, post_type, content]);
            const post = postRes.rows[0];

            // 2. Add Media
            for (let i = 0; i < media.length; i++) {
                const m = media[i];
                await db.query(`
                    INSERT INTO social_post_media (post_id, media_type, url, thumbnail_url, ordering)
                    VALUES ($1, $2, $3, $4, $5)
                `, [post.post_id, m.media_type, m.url, m.thumbnail_url || null, i]);
            }

            // 3. Increment Post Count
            await db.query("UPDATE users SET post_count = post_count + 1 WHERE user_id = $1", [userId]);
            if (pet_id) {
                await db.query("UPDATE pets SET post_count = post_count + 1 WHERE pet_id = $1", [pet_id]);
            }

            await db.query('COMMIT');

            // Fan-out to follower feed caches (fire and forget — non-blocking)
            fanOutPostToFollowers(post.post_id, userId, post.created_at, db)
                .catch(() => {}); // never block the response

            return NextResponse.json(post, { status: 201 });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Posts POST error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
