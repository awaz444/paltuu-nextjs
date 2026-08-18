import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { encodeActivityCursor, decodeActivityCursor, POST_THUMBNAIL_SQL } from "@/lib/activityPagination";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/users/me/activity/comments
 * Comments the current user has posted.
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
                c.comment_id,
                c.created_at,
                c.content AS preview_text,
                c.post_id,
                p.content AS post_preview_text,
                u.user_id AS post_author_id,
                u.name AS post_author_name,
                u.profile_image_url AS post_author_image,
                u.social_username AS post_author_username,
                ${POST_THUMBNAIL_SQL} AS thumbnail_url
            FROM social_comments c
            JOIN social_posts p ON p.post_id = c.post_id
            JOIN users u ON u.user_id = p.user_id
            WHERE c.user_id = $1
              AND c.is_deleted = false
              AND p.is_deleted = false
        `;
        const params: any[] = [userId];

        if (cursor) {
            query += ` AND (c.created_at < $2 OR (c.created_at = $2 AND c.comment_id < $3))`;
            params.push(cursor.created_at, cursor.id);
        }

        query += ` ORDER BY c.created_at DESC, c.comment_id DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);
        const items = result.rows.map((row) => ({
            id: String(row.comment_id),
            kind: "comment" as const,
            created_at: row.created_at,
            preview_text: row.preview_text,
            post_preview_text: row.post_preview_text,
            thumbnail_url: row.thumbnail_url,
            post_id: String(row.post_id),
            comment_id: String(row.comment_id),
            actor: {
                user_id: row.post_author_id,
                name: row.post_author_name,
                profile_image_url: row.post_author_image,
                social_username: row.post_author_username,
            },
            deep_link: `/post/${row.post_id}`,
        }));

        const last = result.rows[result.rows.length - 1];
        const next_cursor = last && result.rows.length === limit
            ? encodeActivityCursor(last.comment_id, last.created_at)
            : null;

        return NextResponse.json({ items, next_cursor, has_more: !!next_cursor });
    } catch (error) {
        console.error("Activity comments GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
