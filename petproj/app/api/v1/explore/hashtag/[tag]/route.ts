import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/explore/hashtag/[tag]
 * Returns all posts tagged with a specific hashtag.
 */
export async function GET(req: NextRequest, { params }: { params: { tag: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tag = params.tag.toLowerCase();
        const { searchParams } = new URL(req.url);
        const limit = Math.min(40, parseInt(searchParams.get("limit") || "20", 10));
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // Fetch hashtag info
        const hashtagRes = await db.query(
            "SELECT tag, post_count FROM hashtags WHERE tag = $1",
            [tag]
        );

        if (hashtagRes.rowCount === 0) {
            return NextResponse.json({ error: "Hashtag not found" }, { status: 404 });
        }

        // Fetch posts for this hashtag
        const postsRes = await db.query(`
            SELECT
                p.post_id,
                p.content,
                p.like_count,
                p.comment_count,
                p.created_at,
                u.name              AS author_name,
                u.profile_image_url AS author_image,
                u.user_id           AS author_id,
                COALESCE(
                    (SELECT json_agg(m.* ORDER BY m.ordering)
                     FROM social_post_media m WHERE m.post_id = p.post_id),
                    '[]'::json
                ) AS media
            FROM social_posts p
            JOIN users u ON u.user_id = p.user_id
            JOIN post_hashtags ph ON ph.post_id = p.post_id
            JOIN hashtags h ON h.hashtag_id = ph.hashtag_id
            WHERE h.tag = $1
              AND p.is_deleted = false
              AND p.is_hidden = false
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `, [tag, limit, offset]);

        const nextCursor = postsRes.rows.length === limit
            ? String(offset + limit)
            : null;

        return NextResponse.json({
            tag: hashtagRes.rows[0].tag,
            post_count: hashtagRes.rows[0].post_count,
            posts: postsRes.rows,
            next_cursor: nextCursor
        });

    } catch (error) {
        console.error("V1 Hashtag Feed error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
