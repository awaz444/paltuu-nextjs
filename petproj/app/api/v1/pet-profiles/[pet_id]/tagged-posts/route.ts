import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/pet-profiles/:pet_id/tagged-posts
 * Get social posts tagged with this pet profile.
 * Cursor-paginated (keyset) by post_id DESC.
 * Auth optional. Respects owner privacy.
 *
 * Query params:
 *   cursor  — post_id to start after (exclusive, for next page)
 *   limit   — default 20, max 50
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { pet_id: string } }
) {
    try {
        const viewerIdRaw = await getUserIdFromRequest(req);
        const viewerId    = viewerIdRaw ? parseInt(String(viewerIdRaw), 10) : 0;

        // ── Verify profile exists + privacy gate ──────────────────────────────
        const profileRes = await db.query(
            `SELECT pp.pet_profile_id, pp.owner_id, u.is_private,
                    EXISTS(
                        SELECT 1 FROM social_follows f
                        WHERE f.follower_id = $2 AND f.following_id = pp.owner_id
                    ) AS viewer_is_following
             FROM pet_profiles pp
             JOIN users u ON u.user_id = pp.owner_id
             WHERE pp.pet_profile_id = $1`,
            [params.pet_id, viewerId]
        );

        if (profileRes.rowCount === 0) {
            return NextResponse.json({ error: "Pet profile not found" }, { status: 404 });
        }

        const profile    = profileRes.rows[0];
        const isOwner    = viewerId !== 0 && viewerId === profile.owner_id;
        const isPrivate  = profile.is_private && !isOwner && !profile.viewer_is_following;

        if (isPrivate) {
            return NextResponse.json({ error: "This profile is private" }, { status: 403 });
        }

        // ── Parse pagination params ────────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const limit  = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = searchParams.get("cursor"); // post_id of last seen post

        // ── Fetch tagged posts ─────────────────────────────────────────────────
        const values: any[] = [params.pet_id, viewerId, limit + 1];
        let cursorClause = "";

        if (cursor) {
            cursorClause = `AND p.post_id < $4`;
            values.push(cursor);
        }

        const result = await db.query(
            `SELECT
                p.post_id,
                p.user_id,
                p.content,
                p.like_count,
                p.comment_count,
                p.repost_count,
                p.view_count,
                p.post_type,
                p.is_repost,
                p.created_at,
                u.name               AS author_name,
                u.social_username    AS author_social_username,
                u.profile_image_url  AS author_avatar,
                COALESCE((
                    SELECT json_agg(m.* ORDER BY m.ordering ASC)
                    FROM social_post_media m
                    WHERE m.post_id = p.post_id
                ), '[]'::json) AS media,
                EXISTS(
                    SELECT 1 FROM social_likes sl
                    WHERE sl.post_id = p.post_id AND sl.user_id = $2
                ) AS is_liked,
                EXISTS(
                    SELECT 1 FROM social_reposts sr
                    WHERE sr.post_id = p.post_id AND sr.user_id = $2
                ) AS is_reposted
             FROM post_pet_tags ppt
             JOIN social_posts p ON p.post_id = ppt.post_id
             JOIN users u ON u.user_id = p.user_id
             WHERE ppt.pet_profile_id = $1
               AND p.is_deleted = false
               AND (p.is_hidden = false OR p.user_id = $2)
               ${cursorClause}
             ORDER BY p.post_id DESC
             LIMIT $3`,
            values
        );

        const rows     = result.rows;
        const hasMore  = rows.length > limit;
        const posts    = hasMore ? rows.slice(0, limit) : rows;
        const nextCursor = hasMore ? String(posts[posts.length - 1].post_id) : null;

        return NextResponse.json({
            posts,
            next_cursor: nextCursor,
            has_more:    hasMore,
        });

    } catch (error) {
        console.error("GET /api/v1/pet-profiles/[pet_id]/tagged-posts error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
