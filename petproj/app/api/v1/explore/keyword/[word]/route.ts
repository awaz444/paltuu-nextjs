import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

function encodeCursor(id: number | string, createdAt: Date | string | null) {
    if (!id || !createdAt) return null;
    return Buffer.from(JSON.stringify({ id, created_at: createdAt })).toString("base64");
}

function decodeCursor(cursor: string | null) {
    if (!cursor) return null;
    try {
        return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as { id: number | string; created_at: string };
    } catch {
        return null;
    }
}

function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json({ error: { code, message, status } }, { status });
}

/**
 * GET /api/v1/explore/keyword/[word]
 * Returns posts whose content contains a given trending keyword (whole-word,
 * case-insensitive), newest first. Powers the "Trending" chips on Explore.
 */
export async function GET(req: NextRequest, { params }: { params: { word: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return errorResponse("UNAUTHORIZED", "Missing or invalid JWT", 401);

        const userId = parseInt(String(userIdRaw), 10);

        // Sanitize to [a-z0-9] only. The keyword is interpolated into a regex
        // (via \m ... \M word boundaries) so this also prevents regex injection.
        const keyword = decodeURIComponent(params.word).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!keyword) return errorResponse("BAD_REQUEST", "Invalid keyword", 400);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(40, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = decodeCursor(searchParams.get("cursor"));

        const queryParams: any[] = [keyword, userId, limit + 1];

        let query = `
            WITH post_media AS (
                SELECT post_id, json_agg(m ORDER BY m.ordering) AS media
                FROM social_post_media m
                GROUP BY post_id
            )
            SELECT
                p.post_id,
                p.content,
                p.like_count,
                p.comment_count,
                p.repost_count,
                p.post_type,
                p.created_at,
                p.user_id,
                u.name               AS author_name,
                u.profile_image_url  AS author_image,
                u.social_username,
                COALESCE(pm.media, '[]'::json) AS media,
                (sl.post_id IS NOT NULL) AS is_liked,
                (sr.post_id IS NOT NULL) AS is_reposted,
                (sp.save_id IS NOT NULL) AS is_saved,
                EXISTS(
                    SELECT 1 FROM social_follows f
                    WHERE f.follower_id = $2 AND f.following_id = p.user_id
                ) AS is_following
            FROM social_posts p
            JOIN users u ON u.user_id = p.user_id
            LEFT JOIN post_media pm ON pm.post_id = p.post_id
            LEFT JOIN social_likes sl ON sl.post_id = p.post_id AND sl.user_id = $2
            LEFT JOIN social_reposts sr ON sr.post_id = p.post_id AND sr.user_id = $2
            LEFT JOIN saved_posts sp ON sp.post_id = p.post_id AND sp.user_id = $2
            WHERE p.content ~* ('\\m' || $1 || '\\M')
              AND p.is_deleted = false
              AND p.is_hidden = false
              AND u.is_private = false
              AND NOT EXISTS (
                  SELECT 1 FROM user_blocks b
                  WHERE (b.blocker_id = $2 AND b.blocked_id = p.user_id)
                     OR (b.blocker_id = p.user_id AND b.blocked_id = $2)
              )
        `;

        if (cursor) {
            query += ` AND (p.created_at, p.post_id) < ($4, $5)`;
            queryParams.push(cursor.created_at, cursor.id);
        }

        query += ` ORDER BY p.created_at DESC, p.post_id DESC LIMIT $3`;

        const postsRes = await db.query(query, queryParams);

        // Total match count — only needed on the first page for the header.
        let postCount: number | null = null;
        if (!cursor) {
            const countRes = await db.query(
                `SELECT COUNT(*)::int AS count
                 FROM social_posts p
                 JOIN users u ON u.user_id = p.user_id
                 WHERE p.content ~* ('\\m' || $1 || '\\M')
                   AND p.is_deleted = false
                   AND p.is_hidden = false
                   AND u.is_private = false
                   AND NOT EXISTS (
                       SELECT 1 FROM user_blocks b
                       WHERE (b.blocker_id = $2 AND b.blocked_id = p.user_id)
                          OR (b.blocker_id = p.user_id AND b.blocked_id = $2)
                   )`,
                [keyword, userId]
            );
            postCount = countRes.rows[0]?.count ?? 0;
        }

        const hasMore = postsRes.rows.length > limit;
        const posts = hasMore ? postsRes.rows.slice(0, limit) : postsRes.rows;
        const lastItem = posts[posts.length - 1];

        return NextResponse.json({
            keyword,
            post_count: postCount,
            posts,
            next_cursor: hasMore && lastItem ? encodeCursor(lastItem.post_id, lastItem.created_at) : null,
        });

    } catch (error) {
        console.error("V1 Keyword Feed error:", error);
        return errorResponse("INTERNAL_ERROR", "An unhandled exception occurred", 500);
    }
}
