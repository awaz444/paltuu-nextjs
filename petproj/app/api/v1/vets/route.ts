import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/vets:
 *   get:
 *     summary: Get all approved vets (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest) {
    try {
        const result = await db.query(`
            SELECT 
                v.*, 
                u.profile_image_url 
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            WHERE v.approved = true
            ORDER BY v.created_at DESC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Vets Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
