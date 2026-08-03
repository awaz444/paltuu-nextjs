import { db } from "@/db/index";
import { SocialFeedSettings } from "./reportScoring";

/**
 * "Popular reply on a private post" feed-card candidate — the one narrow
 * exception to private-post visibility (see posts/route.ts + feedQueryFragments.ts):
 * a comment authored by someone the viewer follows, on a post whose (private)
 * author the viewer does NOT follow, once its engagement clears a threshold.
 *
 * Deliberately excludes the parent post's own content/media/author identity —
 * only comment_id + bare post_id (for deep-linking into the thread) are
 * returned, so the private post itself is never exposed through this path.
 */
export interface SurfacedComment {
    item_type: "surfaced_comment";
    comment_id: string;
    post_id: string;
    commenter: {
        user_id: number;
        name: string;
        social_username: string | null;
        profile_image_url: string | null;
        verified: boolean;
    };
    content: string;
    like_count: number;
    reply_count: number;
    created_at: string;
    is_liked: boolean;
}

/**
 * Finds at most one eligible comment for this viewer's feed. Returns null if
 * the feature is disabled, no candidate clears the threshold, or none remain
 * outside the caller-supplied exclusion list (already-surfaced comment ids).
 */
export async function getSurfaceableComment(
    viewerId: number,
    settings: SocialFeedSettings,
    excludeCommentIds: string[]
): Promise<SurfacedComment | null> {
    if (!settings.comment_surface_enabled) return null;

    const result = await db.query(
        `
        SELECT
            c.comment_id,
            c.post_id,
            c.content,
            c.like_count,
            c.reply_count,
            c.created_at,
            (c.like_count * $2 + c.reply_count * $3) AS surface_score,
            cu.user_id            AS commenter_id,
            cu.name               AS commenter_name,
            cu.social_username    AS commenter_social_username,
            cu.profile_image_url  AS commenter_image,
            cu.verified           AS commenter_verified,
            EXISTS(
                SELECT 1 FROM social_comment_likes scl
                WHERE scl.comment_id = c.comment_id AND scl.user_id = $1
            ) AS is_liked
        FROM social_comments c
        JOIN social_posts p ON p.post_id = c.post_id
        JOIN users pu ON pu.user_id = p.user_id   -- post author
        JOIN users cu ON cu.user_id = c.user_id   -- commenter
        WHERE c.is_deleted = false
          AND p.is_deleted = false
          AND p.is_hidden = false
          AND p.is_shadow_hidden = false
          AND (p.moderation_state IS NULL OR p.moderation_state <> 'quarantined')
          -- Post author must be private, and the viewer must NOT already
          -- follow them — the inverse of the normal visibility gate.
          AND pu.is_private = true
          AND p.user_id <> $1
          AND NOT EXISTS (
              SELECT 1 FROM social_follows f
              WHERE f.follower_id = $1 AND f.following_id = p.user_id AND f.status = 'accepted'
          )
          -- The viewer MUST follow the commenter — the one thing that unlocks this.
          AND c.user_id <> $1
          AND EXISTS (
              SELECT 1 FROM social_follows f
              WHERE f.follower_id = $1 AND f.following_id = c.user_id AND f.status = 'accepted'
          )
          -- No block in either direction, viewer <-> commenter
          AND NOT EXISTS (
              SELECT 1 FROM user_blocks b
              WHERE (b.blocker_id = $1 AND b.blocked_id = c.user_id)
                 OR (b.blocker_id = c.user_id AND b.blocked_id = $1)
          )
          -- No block in either direction, viewer <-> post author
          AND NOT EXISTS (
              SELECT 1 FROM user_blocks b
              WHERE (b.blocker_id = $1 AND b.blocked_id = p.user_id)
                 OR (b.blocker_id = p.user_id AND b.blocked_id = $1)
          )
          AND NOT EXISTS (
              SELECT 1 FROM hidden_posts hp WHERE hp.user_id = $1 AND hp.post_id = p.post_id
          )
          AND c.created_at <= NOW() - make_interval(mins => $4)
          AND c.created_at >= NOW() - make_interval(days => $5)
          AND c.comment_id <> ALL($6::bigint[])
          AND (c.like_count * $2 + c.reply_count * $3) >= $7
        ORDER BY surface_score DESC, c.created_at DESC
        LIMIT 1
        `,
        [
            viewerId,
            settings.comment_surface_like_weight,
            settings.comment_surface_reply_weight,
            settings.comment_surface_min_age_minutes,
            settings.comment_surface_max_age_days,
            excludeCommentIds.length ? excludeCommentIds : [],
            settings.comment_surface_score_threshold,
        ]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
        item_type: "surfaced_comment",
        comment_id: String(row.comment_id),
        post_id: String(row.post_id),
        commenter: {
            user_id: row.commenter_id,
            name: row.commenter_name,
            social_username: row.commenter_social_username,
            profile_image_url: row.commenter_image,
            verified: !!row.commenter_verified,
        },
        content: row.content,
        like_count: row.like_count,
        reply_count: row.reply_count,
        created_at: row.created_at,
        is_liked: row.is_liked,
    };
}
