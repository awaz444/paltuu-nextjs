import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/profile/[id]
 * Returns user metadata and initial posts for the social profile view.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // 1. Fetch User Metadata
        const userQuery = `
            SELECT 
                user_id, name, username, social_username, bio, 
                follower_count, following_count, post_count, 
                profile_image_url, cover_photo_url 
            FROM users 
            WHERE user_id = $1
        `;
        const userRes = await db.query(userQuery, [userId]);

        if (userRes.rowCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = userRes.rows[0];

        // 2. Fetch Initial Posts (Default Tab)
        const postsQuery = `
            SELECT 
                p.post_id, p.content, p.like_count, p.comment_count, p.repost_count, p.created_at, p.post_type,
                COALESCE((
                    SELECT json_agg(m.* ORDER BY m.ordering ASC) 
                    FROM social_post_media m 
                    WHERE m.post_id = p.post_id
                ), '[]'::json) as media
            FROM social_posts p
            WHERE p.user_id = $1 AND p.is_deleted = false AND p.is_hidden = false
            AND p.post_type = 'original'
            ORDER BY p.created_at DESC
            LIMIT 12
        `;
        const postsRes = await db.query(postsQuery, [userId]);

        return NextResponse.json({
            profile: {
                ...user,
                // Ensure field names match common patterns
                username: user.social_username || user.username || `user_${user.user_id}`,
                followers_count: user.follower_count || 0,
                following_count: user.following_count || 0,
                posts_count: user.post_count || 0,
            },
            posts: postsRes.rows
        });

    } catch (error) {
        console.error("V1 Social Profile GET error:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal Server Error" 
        }, { status: 500 });
    }
}
