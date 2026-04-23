import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/profile/[id]/reposts
 * Returns the reposts made by a specific user.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
        const limit = 20;
        const offset = (page - 1) * limit;

        const repostsQuery = `
            SELECT 
                p.post_id, p.content, p.like_count, p.comment_count, p.repost_count, p.created_at, p.post_type,
                COALESCE((
                    SELECT json_agg(m.* ORDER BY m.ordering ASC) 
                    FROM social_post_media m 
                    WHERE m.post_id = p.post_id
                ), '[]'::json) as media,
                -- In the absence of a direct original_post_id, we just return the post 
                -- If later a linking column is added, join with original post here.
                'repost' as display_type
            FROM social_posts p
            WHERE p.user_id = $1 AND p.is_deleted = false AND p.is_hidden = false
            AND p.post_type = 'repost'
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(repostsQuery, [userId, limit, offset]);

        return NextResponse.json({
            reposts: result.rows,
            meta: { page, limit }
        });

    } catch (error) {
        console.error("V1 Social Reposts GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
