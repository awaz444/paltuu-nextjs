import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/vet-panel/reviews/{id}:
 *   get:
 *     summary: Get review summary for a vet (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vetId = params.id;

        const result = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE is_approved = true) as total_approved_reviews,
                COUNT(*) FILTER (WHERE is_approved = false) as total_pending_reviews,
                COALESCE(AVG(rating) FILTER (WHERE is_approved = true), 0)::text as average_rating,
                MAX(created_at) FILTER (WHERE is_approved = true) as most_recent_review_date
            FROM vet_reviews
            WHERE vet_id = $1
        `, [vetId]);

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Vet Reviews GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
