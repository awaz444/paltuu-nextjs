import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import {
    VIEWER_COMMENTS_CTE,
    TAGGED_PETS_AGG_CTE,
    originalPostAccessibleExpr,
    originalPostVisibilityFilter,
    shadowHiddenFilter,
    redactUnavailableOriginals,
} from "@/lib/feedQueryFragments";

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

        // Fire the profile lookup and the posts query concurrently — the posts
        // query only needs targetId/viewerId (both already known), not the
        // privacy/block result from the profile query. We gate the *response*
        // below on the privacy check, not the query dispatch, trading a little
        // wasted DB work on the rare private/blocked profile for saved latency
        // on the common (public, non-blocked) case.
        //
        // Reposts are included here (no `is_repost = false` filter) so they
        // render inline in the main feed, same as the home feed — the
        // Reposts tab was removed in favor of this. The original_* fields
        // (via LEFT JOIN on the reposted post) are what PostCard needs to
        // render a repost's embedded original.
        const [userRes, postsRes] = await Promise.all([
            db.query(`
                SELECT
                    u.user_id,
                    u.name,
                    u.username,
                    u.social_username,
                    u.verified,
                    u.founding_club,
                    u.bio,
                    u.follower_count,
                    u.following_count,
                    u.post_count,
                    u.profile_image_url,
                    u.cover_photo_url,
                    u.is_private,
                    u.created_at,
                    u.is_suspended,
                    -- Viewer context
                    EXISTS(
                        SELECT 1 FROM social_follows f
                        WHERE f.follower_id = $2 AND f.following_id = u.user_id AND f.status = 'accepted'
                    ) AS is_following,
                    EXISTS(
                        SELECT 1 FROM social_follows f
                        WHERE f.follower_id = $2 AND f.following_id = u.user_id AND f.status = 'pending'
                    ) AS has_pending_request,
                    EXISTS(
                        SELECT 1 FROM social_follows f
                        WHERE f.follower_id = u.user_id AND f.following_id = $2 AND f.status = 'accepted'
                    ) AS is_following_me,
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
            `, [targetId, viewerId || 0]),
            db.query(`
                WITH post_media AS (
                    SELECT post_id, json_agg(m ORDER BY m.ordering) AS media
                    FROM social_post_media m
                    GROUP BY post_id
                ),
                ${VIEWER_COMMENTS_CTE},
                ${TAGGED_PETS_AGG_CTE}
                SELECT
                    p.post_id, p.user_id, p.content, p.created_at, p.updated_at, p.post_type,
                    p.is_repost, p.original_post_id,
                    -- Author block, same shape the feed returns. Every post here
                    -- belongs to the profile owner, but the client must not have
                    -- to reconstruct that: badges in particular were being
                    -- dropped because the screens only patched name/image/handle.
                    u.name               AS author_name,
                    u.profile_image_url  AS author_image,
                    COALESCE(u.social_username, u.username) AS social_username,
                    u.verified           AS author_verified,
                    u.founding_club      AS author_founding_club,
                    u.is_private         AS author_is_private,
                    -- A plain repost (content IS NULL) is a hollow row — its
                    -- stats, likes, saves and comments all belong to the root
                    -- post it re-surfaces, not to the repost entry itself.
                    CASE WHEN p.is_repost AND p.content IS NULL THEN op.like_count    ELSE p.like_count    END AS like_count,
                    CASE WHEN p.is_repost AND p.content IS NULL THEN op.comment_count ELSE p.comment_count END AS comment_count,
                    CASE WHEN p.is_repost AND p.content IS NULL THEN op.view_count    ELSE p.view_count    END AS view_count,
                    p.repost_count,
                    COALESCE(pm.media, '[]'::json) AS media,
                    COALESCE(tpa.tagged_pets, '[]'::json) AS tagged_pets,
                    op.content           AS original_content,
                    op.user_id           AS original_user_id,
                    ou.name              AS original_author_name,
                    ou.social_username   AS original_social_username,
                    ou.verified          AS original_author_verified,
                    ou.founding_club     AS original_author_founding_club,
                    ou.profile_image_url AS original_author_image,
                    ou.is_private        AS original_author_is_private,
                    ${originalPostAccessibleExpr('$2')} AS original_available,
                    COALESCE(opm.media, '[]'::json) AS original_media,
                    (sl.post_id IS NOT NULL) AS is_liked,
                    (sr.post_id IS NOT NULL) AS is_reposted,
                    (sp.save_id IS NOT NULL) AS is_saved,
                    (vc.post_id IS NOT NULL) AS is_commented
                FROM social_posts p
                JOIN users u              ON u.user_id = p.user_id
                LEFT JOIN social_posts op ON op.post_id = p.original_post_id
                LEFT JOIN users ou        ON ou.user_id = op.user_id
                LEFT JOIN post_media pm   ON pm.post_id  = p.post_id
                LEFT JOIN post_media opm  ON opm.post_id = op.post_id
                LEFT JOIN tagged_pets_agg tpa ON tpa.post_id = p.post_id
                LEFT JOIN social_likes   sl ON sl.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sl.user_id = $2
                LEFT JOIN social_reposts sr ON sr.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sr.user_id = $2
                LEFT JOIN saved_posts    sp ON sp.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END AND sp.user_id = $2
                LEFT JOIN viewer_comments vc ON vc.post_id = CASE WHEN p.is_repost AND p.content IS NULL THEN p.original_post_id ELSE p.post_id END
                WHERE p.user_id = $1
                  AND p.is_deleted = false
                  AND (p.is_hidden = false OR p.user_id = $2)
                  ${shadowHiddenFilter('$2')}
                  ${originalPostVisibilityFilter('$2')}
                ORDER BY p.created_at DESC
                LIMIT 18
            `, [targetId, viewerId || 0]),
        ]);

        if (userRes.rowCount === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = userRes.rows[0];

        // A suspended account is publicly shown as suspended — unlike a
        // shadow-hide, this is meant to be visible: the profile is real, it's
        // just been actioned for a guidelines violation. Short-circuits before
        // any profile/post fields go out.
        if (user.is_suspended) {
            return NextResponse.json({
                suspended: true,
                profile: { user_id: user.user_id, social_username: user.social_username },
                message: "This account has been suspended for violating our Community Guidelines.",
            });
        }

        const isBlocked = user.is_blocked_by_me || user.is_blocking_me;
        const isPrivate = user.is_private && !user.is_own_profile && !user.is_following;

        // Discard the fetched posts if the privacy/block check (only knowable
        // after both queries resolve) says they shouldn't be visible.
        const posts: any[] = (!isPrivate && !isBlocked) ? redactUnavailableOriginals(postsRes.rows) : [];

        return NextResponse.json({
            profile: {
                user_id: user.user_id,
                name: user.name,
                username: user.social_username || user.username || `user_${user.user_id}`,
                social_username: user.social_username,
                verified: user.verified,
                founding_club: user.founding_club,
                bio: user.bio,
                follower_count: user.follower_count || 0,
                following_count: user.following_count || 0,
                post_count: user.post_count || 0,
                profile_image_url: user.profile_image_url,
                cover_photo_url: user.cover_photo_url,
                is_private: user.is_private,
                is_following: user.is_following,
                has_pending_request: user.has_pending_request,
                is_following_me: user.is_following_me,
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
