import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/profile/[id]
 * Returns user profile metadata, stats, and their recent posts.
 * Includes viewer context: is_following, is_own_profile.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const limited = await rateLimit(req, LIMITS.FEED);
        if (limited) return limited;

        const viewerId = await getUserIdFromRequest(req);
        const targetId = params.id;

        if (!targetId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // 1. Fetch user profile with viewer context
        const userRes = await db.query(`
            SELECT 
                u.user_id,
                u.name,
                u.username,
                u.social_username,
                u.bio,
                u.follower_count,
                u.following_count,
                u.post_count,
                u.profile_image_url,
                u.cover_photo_url,
                u.is_private,
                u.created_at,
                -- Viewer context
                EXISTS(
                    SELECT 1 FROM social_follows f
                    WHERE f.follower_id = $2 AND f.following_id = u.user_id
                ) AS is_following,
                EXISTS(
                    SELECT 1 FROM user_blocks b
                    WHERE b.blocker_id = $2 AND b.blocked_id = u.user_id
                ) AS is_blocked_by_me,
                EXISTS(
                    SELECT 1 FROM user_blocks b
                    WHERE b.blocker_id = u.user_id AND b.blocked_id = $2
                ) AS is_blocking_me,
                ($2 = u.user_id) AS is_own_profile
            FROM users u
            WHERE u.user_id = $1
        `, [targetId, viewerId || 0]);

        if (userRes.rowCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = userRes.rows[0];
        const isBlocked = user.is_blocked_by_me || user.is_blocking_me;
        const isPrivate = user.is_private && !user.is_own_profile && !user.is_following;

        // 2. Fetch posts (hidden if private account and not following, or if blocked)
        let posts: any[] = [];
        if (!isPrivate && !isBlocked) {
            const postsRes = await db.query(`
                SELECT
                    p.post_id, p.content, p.like_count, p.comment_count,
                    p.repost_count, p.view_count, p.created_at, p.post_type,
                    p.is_repost, p.original_post_id,
                    COALESCE((
                        SELECT json_agg(m.* ORDER BY m.ordering ASC)
                        FROM social_post_media m
                        WHERE m.post_id = p.post_id
                    ), '[]'::json) AS media,
                    EXISTS(
                        SELECT 1 FROM social_likes l
                        WHERE l.post_id = p.post_id AND l.user_id = $2
                    ) AS is_liked
                FROM social_posts p
                WHERE p.user_id = $1
                  AND p.is_deleted = false
                  AND p.is_hidden = false
                  AND p.is_repost = false
                ORDER BY p.created_at DESC
                LIMIT 18
            `, [targetId, viewerId || 0]);
            posts = postsRes.rows;
        }

        return NextResponse.json({
            profile: {
                user_id: user.user_id,
                name: user.name,
                username: user.social_username || user.username || `user_${user.user_id}`,
                social_username: user.social_username,
                bio: user.bio,
                follower_count: user.follower_count || 0,
                following_count: user.following_count || 0,
                post_count: user.post_count || 0,
                profile_image_url: user.profile_image_url,
                cover_photo_url: user.cover_photo_url,
                is_private: user.is_private,
                is_following: user.is_following,
                is_own_profile: user.is_own_profile,
                is_blocked_by_me: user.is_blocked_by_me,
                is_blocking_me: user.is_blocking_me,
                joined_at: user.created_at,
            },
            posts,
            is_private_locked: isPrivate || isBlocked, // true = profile is locked, posts hidden
        });

    } catch (error) {
        console.error("V1 Social Profile GET error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
