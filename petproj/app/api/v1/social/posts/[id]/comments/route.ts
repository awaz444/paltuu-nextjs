import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/posts/[id]/comments
 * Fetch comments for a post (Flat list, frontend handles nesting or simple list)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const postId = params.id;
        
        const result = await db.query(`
            SELECT 
                c.*,
                u.name as author_name, u.image as author_image, u.social_username
            FROM social_comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.post_id = $1 AND c.is_deleted = false
            ORDER BY c.root_comment_id NULLS FIRST, c.created_at ASC
        `, [postId]);

        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Social Comments GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/social/posts/[id]/comments
 * Add a comment to a post (supports nesting via parent_comment_id)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const postId = params.id;
        const body = await req.json();
        const { content, parent_comment_id } = body;

        if (!content) return NextResponse.json({ error: "Comment content is required" }, { status: 400 });

        let depth = 0;
        let root_comment_id = null;

        await db.query('BEGIN');
        try {
            // Find root and depth if replying
            if (parent_comment_id) {
                const parent = await db.query(
                    "SELECT depth, root_comment_id, comment_id FROM social_comments WHERE comment_id = $1", 
                    [parent_comment_id]
                );
                if ((parent.rowCount ?? 0) > 0) {
                    depth = (parent.rows[0].depth || 0) + 1;
                    root_comment_id = parent.rows[0].root_comment_id || parent.rows[0].comment_id;
                }
            }

            const query = `
                INSERT INTO social_comments (
                    post_id, user_id, parent_comment_id, root_comment_id, 
                    content, depth
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const result = await db.query(query, [
                postId, userId, parent_comment_id || null, 
                root_comment_id, content, depth
            ]);

            // Increment post comment count
            await db.query("UPDATE social_posts SET comment_count = comment_count + 1 WHERE post_id = $1", [postId]);

            await db.query('COMMIT');
            return NextResponse.json(result.rows[0], { status: 201 });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Social Comments POST error:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal Server Error" 
        }, { status: 500 });
    }
}
