import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts
 * Fetch social feed (Following + Global)
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const offset = (page - 1) * limit;

        // Base Query: Fetch posts with user and pet info
        // Simple dynamic feed: Global posts ordered by date for now
        // TODO: Filter by following if userId is present
        const query = `
            SELECT 
                p.*,
                u.name as author_name, u.image as author_image, u.social_username,
                pet.pet_name, pet.image_url as pet_image,
                COALESCE((SELECT json_agg(m.*) FROM social_post_media m WHERE m.post_id = p.post_id), '[]'::json) as media,
                EXISTS(SELECT 1 FROM social_likes l WHERE l.post_id = p.post_id AND l.user_id = $1) as is_liked
            FROM social_posts p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN pets pet ON p.pet_id = pet.pet_id
            WHERE p.is_deleted = false AND p.is_hidden = false
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, [userId || 0, limit, offset]);
        
        return NextResponse.json({
            posts: result.rows,
            meta: { page, limit }
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

            // 3. Increment Post Count for user and pet
            await db.query("UPDATE users SET post_count = post_count + 1 WHERE user_id = $1", [userId]);
            if (pet_id) {
                await db.query("UPDATE pets SET post_count = post_count + 1 WHERE pet_id = $1", [pet_id]);
            }

            await db.query('COMMIT');
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
