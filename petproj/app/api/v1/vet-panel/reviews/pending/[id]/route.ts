import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/vet-panel/reviews/pending/{id}:
 *   get:
 *     summary: Get all pending reviews for a vet (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vetId = params.id;

        const result = await db.query(`
            SELECT 
                vr.review_id,
                vr.user_id,
                u.name as user_name,
                u.profile_image_url as user_image_url,
                vr.rating,
                vr.comment as review_content,
                vr.created_at as review_date
            FROM vet_reviews vr
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.vet_id = $1 AND vr.is_approved = false
            ORDER BY vr.created_at DESC
        `, [vetId]);

        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Vet Pending Reviews GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
