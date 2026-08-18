import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { encodeActivityCursor, decodeActivityCursor } from "@/lib/activityPagination";

export const dynamic = "force-dynamic";

const POST_THUMB = `
    (SELECT COALESCE(m.thumbnail_url, m.url)
     FROM social_post_media m
     WHERE m.post_id = COALESCE(sm.post_id, sc.post_id)
     ORDER BY m.ordering NULLS LAST, m.media_id
     LIMIT 1)
`;

/**
 * GET /api/v1/users/me/activity/tags
 * Posts/comments where the current user was @mentioned.
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const cursor = decodeActivityCursor(searchParams.get("cursor"));

        let query = `
            SELECT
                sm.mention_id,
                sm.created_at,
                sm.post_id,
                sm.comment_id,
                u.user_id AS actor_user_id,
                u.name AS actor_name,
                u.profile_image_url AS actor_image,
                u.social_username AS actor_social_username,
                COALESCE(sc.content, sp.content) AS preview_text,
                ${POST_THUMB} AS thumbnail_url
            FROM social_mentions sm
            JOIN users u ON u.user_id = sm.mentioned_by
            LEFT JOIN social_posts sp ON sp.post_id = sm.post_id
            LEFT JOIN social_comments sc ON sc.comment_id = sm.comment_id
            WHERE sm.mentioned_user_id = $1
              AND (sp.is_deleted = false OR sp.post_id IS NULL)
              AND (sc.is_deleted = false OR sc.comment_id IS NULL)
        `;
        const params: any[] = [userId];

        if (cursor) {
            query += ` AND (sm.created_at < $2 OR (sm.created_at = $2 AND sm.mention_id < $3))`;
            params.push(cursor.created_at, cursor.id);
        }

        query += ` ORDER BY sm.created_at DESC, sm.mention_id DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);
        const items = result.rows.map((row) => {
            const postId = row.post_id ? String(row.post_id) : null;
            const commentId = row.comment_id ? String(row.comment_id) : null;
            return {
                id: String(row.mention_id),
                kind: "tag" as const,
                created_at: row.created_at,
                preview_text: row.preview_text,
                thumbnail_url: row.thumbnail_url,
                post_id: postId,
                comment_id: commentId,
                actor: {
                    user_id: row.actor_user_id,
                    name: row.actor_name,
                    profile_image_url: row.actor_image,
                    social_username: row.actor_social_username,
                },
                deep_link: postId
                    ? commentId
                        ? `/post/${postId}`
                        : `/post/${postId}`
                    : null,
            };
        });

        const last = result.rows[result.rows.length - 1];
        const next_cursor = last && result.rows.length === limit
            ? encodeActivityCursor(last.mention_id, last.created_at)
            : null;

        return NextResponse.json({ items, next_cursor, has_more: !!next_cursor });
    } catch (error) {
        console.error("Activity tags GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
