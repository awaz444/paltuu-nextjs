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
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'pet_profile_id', pp.pet_profile_id,
                        'name', pp.name,
                        'avatar_url', pp.avatar_url,
                        'species', pp.species
                     ))
                     FROM post_pet_tags ppt
                     JOIN pet_profiles pp ON pp.pet_profile_id = ppt.pet_profile_id
                     WHERE ppt.post_id = p.post_id),
                    '[]'::json
                ) AS tagged_pets,
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
                (sp.save_id IS NOT NULL) AS is_saved,
                COALESCE(
                  (SELECT json_agg(sc.collection_id)
                   FROM collection_posts cp
                   JOIN save_collections sc ON sc.collection_id = cp.collection_id
                   WHERE cp.save_id = sp.save_id),
                  '[]'::json
                ) AS saved_to_collections,
                EXISTS(
                    SELECT 1 FROM social_follows f
                    WHERE f.follower_id = $2 AND f.following_id = p.user_id
                ) AS is_following_author
            FROM social_posts p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN social_posts op ON op.post_id = p.original_post_id
            LEFT JOIN users ou ON ou.user_id = op.user_id
            LEFT JOIN saved_posts sp ON sp.post_id = p.post_id AND sp.user_id = $2
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
            // Decrement post_count for all hashtags linked to this post
            await db.query(`
                UPDATE hashtags h
                SET post_count = GREATEST(0, h.post_count - 1)
                FROM post_hashtags ph
                WHERE ph.hashtag_id = h.hashtag_id
                  AND ph.post_id = $1
            `, [postId]);

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

/**
 * PATCH /api/v1/social/posts/[id]
 * Update post metadata (content, post_type, pet_profile_tags)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);
        const postId = params.id;

        const body = await req.json();
        const { content, post_type, pet_profile_tags } = body;

        // Verify ownership
        const postCheck = await db.query(
            "SELECT user_id, content FROM social_posts WHERE post_id = $1 AND is_deleted = false",
            [postId]
        );
        if (postCheck.rowCount === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        if (postCheck.rows[0].user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const oldContent = postCheck.rows[0].content;

        await db.query('BEGIN');
        try {
            // Update the post
            await db.query(`
                UPDATE social_posts 
                SET content = COALESCE($1, content),
                    post_type = COALESCE($2, post_type),
                    updated_at = NOW()
                WHERE post_id = $3
            `, [content, post_type, postId]);

            // If pet_profile_tags is passed, update tags
            if (pet_profile_tags !== undefined && Array.isArray(pet_profile_tags)) {
                const tagIds = pet_profile_tags
                    .map((id: any) => parseInt(String(id), 10))
                    .filter((id: number) => !isNaN(id));

                if (tagIds.length > 0) {
                    // Validate ownership of all tagged profiles
                    const ownerCheck = await db.query(
                        `SELECT COUNT(*) FROM pet_profiles
                         WHERE pet_profile_id = ANY($1::int[]) AND owner_id = $2`,
                        [tagIds, userId]
                    );
                    if (parseInt(ownerCheck.rows[0].count, 10) !== tagIds.length) {
                        throw new Error('One or more tagged pet profiles do not belong to you');
                    }
                }

                // Delete existing tags
                await db.query("DELETE FROM post_pet_tags WHERE post_id = $1", [postId]);

                // Insert new ones
                for (const profileId of tagIds) {
                    await db.query(
                        `INSERT INTO post_pet_tags (post_id, pet_profile_id)
                         VALUES ($1, $2)
                         ON CONFLICT DO NOTHING`,
                        [postId, profileId]
                    );
                }
            }

            // If content changed, update hashtags
            if (content !== undefined && content !== oldContent) {
                // 1. Decrement old hashtag counts
                await db.query(`
                    UPDATE hashtags h
                    SET post_count = GREATEST(0, h.post_count - 1)
                    FROM post_hashtags ph
                    WHERE ph.hashtag_id = h.hashtag_id
                      AND ph.post_id = $1
                `, [postId]);

                // 2. Remove old hashtag links
                await db.query("DELETE FROM post_hashtags WHERE post_id = $1", [postId]);

                // 2. Parse & upsert new hashtags
                const tagMatches = content.match(/#([a-zA-Z0-9_]+)/g) || [];
                const uniqueTags = [...new Set(tagMatches.map((t: string) => t.slice(1).toLowerCase()))];
                for (const tag of uniqueTags) {
                    const tagRes = await db.query(`
                        INSERT INTO hashtags (tag, post_count)
                        VALUES ($1, 1)
                        ON CONFLICT (tag) DO UPDATE SET post_count = hashtags.post_count + 1
                        RETURNING hashtag_id
                    `, [tag]);
                    await db.query(`
                        INSERT INTO post_hashtags (post_id, hashtag_id)
                        VALUES ($1, $2) ON CONFLICT DO NOTHING
                    `, [postId, tagRes.rows[0].hashtag_id]);
                }
            }

            await db.query('COMMIT');
            return NextResponse.json({ updated: true });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }
    } catch (error) {
        console.error("V1 Social Post PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
