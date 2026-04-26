import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { fanOutPostToFollowers } from "@/lib/redis";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts
 * Fetch social feed
 * Modes:
 *   ?mode=following    (default) — algorithmic ranked feed from followed users + self
 *   ?mode=global       — algorithmic ranked feed from all users
 *   ?mode=chronological — pure newest-first (no ranking)
 *
 * Cursor-based pagination using the relevance score.
 *
 * Algorithm scoring (computed in SQL):
 *   Recency    40% — EXP decay, half-life = 6 hours
 *   Engagement 40% — (likes×1 + comments×2 + reposts×3) normalized
 *   Relationship 20% — following = +0.2 boost, own post = +0.4 boost
 */
export async function GET(req: NextRequest) {
    try {
        const limited = await rateLimit(req, LIMITS.FEED);
        if (limited) return limited;

        const userId = await getUserIdFromRequest(req);
        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
        const cursor = searchParams.get("cursor"); // stringified float score
        const mode = searchParams.get("mode") || "following";

        const isChronological = mode === "chronological";
        const isGlobal = mode === "global";

        
        // ── Shared SELECT columns ──────────────────────────────────────────
        const selectCols = `
            p.*,
            u.name              AS author_name,
            u.profile_image_url AS author_image,
            u.social_username,
            COALESCE(
                (SELECT json_agg(m.* ORDER BY m.ordering)
                 FROM social_post_media m WHERE m.post_id = p.post_id),
                '[]'::json
            ) AS media,
            op.content              AS original_content,
            op.user_id              AS original_user_id,
            ou.name                 AS original_author_name,
            ou.social_username      AS original_social_username,
            ou.profile_image_url    AS original_author_image,
            COALESCE(
                (SELECT json_agg(om.* ORDER BY om.ordering)
                 FROM social_post_media om WHERE om.post_id = op.post_id),
                '[]'::json
            ) AS original_media,
            EXISTS(SELECT 1 FROM social_likes l
                WHERE l.post_id = p.post_id AND l.user_id = $1) AS is_liked,
            EXISTS(SELECT 1 FROM social_reposts r
                WHERE r.post_id = p.post_id AND r.user_id = $1) AS is_reposted
        `;

        // ── Algorithmic score expression ───────────────────────────────────
        // Recency: exponential decay, half-life 6 hours (21600 seconds)
        // Engagement: like×1 + comment×2 + repost×3, soft-capped via LOG
        // Relationship: following = 0.2, own post = 0.4, stranger = 0
        const scoreExpr = `(
            -- Recency score (0..1, peaks now, ~0.5 after 6h)
            EXP(-EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 21600.0) * 0.4

            -- Engagement score (0..~0.4, LOG-dampened)
            + LEAST(
                LOG(1 + p.like_count * 1.0
                      + p.comment_count * 2.0
                      + p.repost_count  * 3.0) / 10.0,
                0.4
              ) * 0.4

            -- Relationship bonus
            + CASE
                WHEN p.user_id = $1 THEN 0.4           -- own post
                WHEN EXISTS(
                    SELECT 1 FROM social_follows f
                    WHERE f.follower_id = $1 AND f.following_id = p.user_id
                ) THEN 0.2                              -- following
                ELSE 0.0                                -- stranger
              END * 0.2
        )`;

        // ── WHERE clause ───────────────────────────────────────────────────
        const baseWhere = `p.is_deleted = false AND p.is_hidden = false`;
        const followingWhere = `AND (
            p.user_id = $1
            OR p.user_id IN (SELECT following_id FROM social_follows WHERE follower_id = $1)
        )`;

        let feedQuery: string;
        let queryParams: any[];

        if (isChronological) {
            // Simple cursor: timestamp
            const cursorClause = cursor ? `AND p.created_at < $3` : "";
            feedQuery = `
                SELECT ${selectCols}
                FROM social_posts p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN social_posts op ON op.post_id = p.original_post_id
                LEFT JOIN users ou ON ou.user_id = op.user_id
                WHERE ${baseWhere}
                ${userId ? followingWhere : ""}
                ${cursorClause}
                ORDER BY p.created_at DESC
                LIMIT $2
            `;
            queryParams = [userId || 0, limit, ...(cursor ? [cursor] : [])];

        } else {
            // Algorithmic: score-based cursor
            const cursorClause = cursor ? `AND ${scoreExpr} < $3` : "";
            feedQuery = `
                SELECT ${selectCols},
                    ${scoreExpr} AS relevance_score
                FROM social_posts p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN social_posts op ON op.post_id = p.original_post_id
                LEFT JOIN users ou ON ou.user_id = op.user_id
                WHERE ${baseWhere}
                ${!isGlobal && userId ? followingWhere : ""}
                ${cursorClause}
                ORDER BY relevance_score DESC, p.created_at DESC
                LIMIT $2
            `;
            queryParams = [userId || 0, limit, ...(cursor ? [parseFloat(cursor)] : [])];
        }

        const result = await db.query(feedQuery, queryParams);
        const posts = result.rows;

        // Next cursor
        const lastPost = posts[posts.length - 1];
        const nextCursor = posts.length === limit
            ? (isChronological
                ? String(lastPost.created_at)
                : String(lastPost.relevance_score))
            : null;

        return NextResponse.json({
            posts,
            next_cursor: nextCursor,
            has_more: nextCursor !== null,
            mode: isChronological ? "chronological" : "algorithmic",
        });

    } catch (error) {
        console.error("V1 Social Posts GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/social/posts
 * Create a new social post
 */
export async function POST(req: NextRequest) {
    try {
        const limited = await rateLimit(req, LIMITS.POST_CREATE);
        if (limited) return limited;

        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { pet_id, post_type, content, media = [] } = body;

        if (!post_type || (!content && media.length === 0)) {
            return NextResponse.json({ error: "Post content or media is required" }, { status: 400 });
        }

        await db.query('BEGIN');
        try {
            // 1. Create Post
            const postRes = await db.query(`
                INSERT INTO social_posts (user_id, pet_id, post_type, content)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [userId, pet_id || null, post_type, content]);
            const post = postRes.rows[0];

            // 2. Add Media
            for (let i = 0; i < media.length; i++) {
                const m = media[i];
                await db.query(`
                    INSERT INTO social_post_media (post_id, media_type, url, thumbnail_url, ordering)
                    VALUES ($1, $2, $3, $4, $5)
                `, [post.post_id, m.media_type, m.url, m.thumbnail_url || null, i]);
            }

            // 3. Increment Post Count
            await db.query("UPDATE users SET post_count = post_count + 1 WHERE user_id = $1", [userId]);
            if (pet_id) {
                await db.query("UPDATE pets SET post_count = post_count + 1 WHERE pet_id = $1", [pet_id]);
            }

            await db.query('COMMIT');

            // Fan-out to follower feed caches (fire and forget — non-blocking)
            fanOutPostToFollowers(post.post_id, userId, post.created_at, db)
                .catch(() => {}); // never block the response

            return NextResponse.json(post, { status: 201 });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Posts POST error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
