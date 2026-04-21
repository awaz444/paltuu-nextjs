import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/vet-panel:
 *   get:
 *     summary: Get the current vet's professional dashboard (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const query = `
            SELECT 
                v.*, u.name as vet_name, u.email as vet_email, u.profile_image_url,
                COALESCE((SELECT AVG(rating) FROM vet_reviews WHERE vet_id = v.vet_id AND is_approved = true), 0) as avg_rating,
                COALESCE((SELECT COUNT(*) FROM vet_reviews WHERE vet_id = v.vet_id AND is_approved = true), 0) as total_reviews,
                COALESCE((SELECT json_agg(va.*) FROM vet_availability va WHERE va.vet_id = v.vet_id), '[]'::json) as schedules
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            WHERE v.user_id = $1
        `;

        const result = await db.query(query, [userId]);

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Vet profile not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Vet Panel error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
