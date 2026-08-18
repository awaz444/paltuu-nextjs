import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { encodeActivityCursor, decodeActivityCursor, POST_THUMBNAIL_SQL } from "@/lib/activityPagination";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/users/me/activity/likes
 * Posts the current user has liked.
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
                sl.like_id,
                sl.created_at,
                p.post_id,
                p.content AS preview_text,
                u.user_id AS actor_user_id,
                u.name AS actor_name,
                u.profile_image_url AS actor_image,
                u.social_username AS actor_social_username,
                ${POST_THUMBNAIL_SQL} AS thumbnail_url
            FROM social_likes sl
            JOIN social_posts p ON p.post_id = sl.post_id
            JOIN users u ON u.user_id = p.user_id
            WHERE sl.user_id = $1
              AND p.is_deleted = false
              AND (p.is_hidden = false OR p.user_id = $1)
              AND (p.is_shadow_hidden = false OR p.user_id = $1)
        `;
        const params: any[] = [userId];

        if (cursor) {
            query += ` AND (sl.created_at < $2 OR (sl.created_at = $2 AND sl.like_id < $3))`;
            params.push(cursor.created_at, cursor.id);
        }

        query += ` ORDER BY sl.created_at DESC, sl.like_id DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);
        const items = result.rows.map((row) => ({
            id: String(row.like_id),
            kind: "like" as const,
            created_at: row.created_at,
            preview_text: row.preview_text,
            thumbnail_url: row.thumbnail_url,
            post_id: String(row.post_id),
            actor: {
                user_id: row.actor_user_id,
                name: row.actor_name,
                profile_image_url: row.actor_image,
                social_username: row.actor_social_username,
            },
            deep_link: `/post/${row.post_id}`,
        }));

        const last = result.rows[result.rows.length - 1];
        const next_cursor = last && result.rows.length === limit
            ? encodeActivityCursor(last.like_id, last.created_at)
            : null;

        return NextResponse.json({ items, next_cursor, has_more: !!next_cursor });
    } catch (error) {
        console.error("Activity likes GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
