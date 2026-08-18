import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { encodeActivityCursor, decodeActivityCursor, POST_THUMBNAIL_SQL } from "@/lib/activityPagination";
import { ensureActivityArchiveTables } from "@/lib/activityArchive";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/users/me/activity/recently-deleted
 * Soft-deleted posts and comments by the current user, plus archive snapshots
 * for anything already purged from the live tables.
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const archiveReady = await ensureActivityArchiveTables();

        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const cursor = decodeActivityCursor(searchParams.get("cursor"));

        const commentThumbSql = `
            (SELECT COALESCE(m.thumbnail_url, m.url)
             FROM social_post_media m
             WHERE m.post_id = c.post_id
             ORDER BY m.ordering NULLS LAST, m.media_id
             LIMIT 1)
        `;

        const liveSources = `
            SELECT
                p.post_id AS archive_id,
                'deleted_post' AS kind,
                p.post_id,
                NULL::bigint AS comment_id,
                p.content AS preview_text,
                ${POST_THUMBNAIL_SQL} AS thumbnail_url,
                COALESCE(p.updated_at, p.created_at) AS created_at
            FROM social_posts p
            WHERE p.user_id = $1
              AND COALESCE(p.is_deleted, false) = true
              AND COALESCE(p.is_repost, false) = false

            UNION ALL

            SELECT
                c.comment_id AS archive_id,
                'deleted_comment' AS kind,
                c.post_id,
                c.comment_id,
                c.content AS preview_text,
                ${commentThumbSql} AS thumbnail_url,
                COALESCE(c.updated_at, c.created_at) AS created_at
            FROM social_comments c
            WHERE c.user_id = $1
              AND COALESCE(c.is_deleted, false) = true
        `;

        const archiveSources = archiveReady ? `
            UNION ALL

            SELECT
                d.deleted_post_id AS archive_id,
                'deleted_post' AS kind,
                d.post_id,
                NULL::bigint AS comment_id,
                d.content AS preview_text,
                d.thumbnail_url,
                d.deleted_at AS created_at
            FROM deleted_social_posts d
            WHERE d.user_id = $1
              AND NOT EXISTS (
                  SELECT 1 FROM social_posts p
                  WHERE p.post_id = d.post_id
                    AND p.user_id = $1
                    AND COALESCE(p.is_deleted, false) = true
              )

            UNION ALL

            SELECT
                d.deleted_comment_id AS archive_id,
                'deleted_comment' AS kind,
                d.post_id,
                d.comment_id,
                d.content AS preview_text,
                d.thumbnail_url,
                d.deleted_at AS created_at
            FROM deleted_social_comments d
            WHERE d.user_id = $1
              AND NOT EXISTS (
                  SELECT 1 FROM social_comments c
                  WHERE c.comment_id = d.comment_id
                    AND c.user_id = $1
                    AND COALESCE(c.is_deleted, false) = true
              )
        ` : "";

        let query = `
            SELECT *
            FROM (
                ${liveSources}
                ${archiveSources}
            ) archived
        `;
        const params: any[] = [userId];

        if (cursor) {
            query += ` WHERE (archived.created_at < $2 OR (archived.created_at = $2 AND archived.archive_id < $3))`;
            params.push(cursor.created_at, cursor.id);
        }

        query += ` ORDER BY archived.created_at DESC, archived.archive_id DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);
        const items = result.rows.map((row) => ({
            id: `${row.kind}-${row.archive_id}`,
            kind: row.kind as "deleted_post" | "deleted_comment",
            created_at: row.created_at,
            preview_text: row.preview_text,
            thumbnail_url: row.thumbnail_url,
            post_id: String(row.post_id),
            comment_id: row.comment_id ? String(row.comment_id) : null,
            deep_link: null,
        }));

        const last = result.rows[result.rows.length - 1];
        const next_cursor = last && result.rows.length === limit
            ? encodeActivityCursor(last.archive_id, last.created_at)
            : null;

        return NextResponse.json({ items, next_cursor, has_more: !!next_cursor });
    } catch (error) {
        console.error("Activity recently-deleted GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
