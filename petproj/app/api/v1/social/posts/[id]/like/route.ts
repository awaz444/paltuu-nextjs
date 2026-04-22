import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/posts/[id]/like
 * Toggle like status for a post
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const postId = params.id;

        // Check if already liked
        const existing = await db.query(
            "SELECT like_id FROM social_likes WHERE post_id = $1 AND user_id = $2",
            [postId, userId]
        );

        await db.query('BEGIN');
        try {
            if ((existing.rowCount ?? 0) > 0) {
                // Unlike
                await db.query("DELETE FROM social_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
                await db.query("UPDATE social_posts SET like_count = GREATEST(0, like_count - 1) WHERE post_id = $1", [postId]);
                await db.query('COMMIT');
                return NextResponse.json({ liked: false });
            } else {
                // Like
                await db.query("INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2)", [postId, userId]);
                await db.query("UPDATE social_posts SET like_count = like_count + 1 WHERE post_id = $1", [postId]);
                await db.query('COMMIT');
                return NextResponse.json({ liked: true });
            }
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Likes POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
