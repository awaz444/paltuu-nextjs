import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { resolveRepostTarget } from "@/lib/reposts";
import { assertNotBlocked, isBlockedSql } from "@/lib/moderation";
import { encodeActivityCursor, decodeActivityCursor } from "@/lib/activityPagination";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts/[id]/likes
 * Users who liked this post, with follow state for the viewer.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const resolved = await resolveRepostTarget(db, params.id);
        if (!resolved || resolved.isDeleted) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        if (resolved.isShadowHidden && resolved.authorId !== userId) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        await assertNotBlocked(userId, resolved.authorId);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
        const q = (searchParams.get("q") || "").trim().slice(0, 80);
        const cursor = decodeActivityCursor(searchParams.get("cursor"));

        const paramsArr: any[] = [userId, resolved.postId];
        let query = `
            SELECT
                l.like_id,
                l.created_at,
                u.user_id,
                u.name,
                u.profile_image_url,
                u.social_username,
                u.verified,
                u.founding_club,
                u.is_private,
                EXISTS(
                    SELECT 1 FROM social_follows cf
                    WHERE cf.follower_id = $1 AND cf.following_id = u.user_id AND cf.status = 'accepted'
                ) AS is_followed_by_me,
                EXISTS(
                    SELECT 1 FROM social_follows cf
                    WHERE cf.follower_id = $1 AND cf.following_id = u.user_id AND cf.status = 'pending'
                ) AS has_pending_request
            FROM social_likes l
            JOIN users u ON u.user_id = l.user_id
            WHERE l.post_id = $2
              AND NOT ${isBlockedSql("$1", "u.user_id")}
        `;

        if (q) {
            paramsArr.push(`%${q}%`);
            query += ` AND (u.name ILIKE $${paramsArr.length} OR u.social_username ILIKE $${paramsArr.length})`;
        }

        if (cursor) {
            paramsArr.push(cursor.created_at, cursor.id);
            query += ` AND (l.created_at < $${paramsArr.length - 1} OR (l.created_at = $${paramsArr.length - 1} AND l.like_id < $${paramsArr.length}))`;
        }

        query += ` ORDER BY l.created_at DESC, l.like_id DESC LIMIT $${paramsArr.length + 1}`;
        paramsArr.push(limit);

        const result = await db.query(query, paramsArr);
        const likes = result.rows.map((row) => ({
            like_id: String(row.like_id),
            user_id: row.user_id,
            name: row.name,
            profile_image_url: row.profile_image_url,
            social_username: row.social_username,
            verified: !!row.verified,
            founding_club: !!row.founding_club,
            is_private: !!row.is_private,
            is_followed_by_me: !!row.is_followed_by_me,
            has_pending_request: !!row.has_pending_request,
            created_at: row.created_at,
        }));

        const last = result.rows[result.rows.length - 1];
        const next_cursor = last && result.rows.length === limit
            ? encodeActivityCursor(last.like_id, last.created_at)
            : null;

        return NextResponse.json({ likes, next_cursor, has_more: !!next_cursor });
    } catch (error: any) {
        if (error.message === "BLOCKED") {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        console.error("V1 Social Post likes GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
