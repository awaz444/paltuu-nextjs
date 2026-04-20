import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/clinics:
 *   get:
 *     summary: Get all approved clinics (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest) {
    try {
        const result = await db.query(`
            SELECT 
                c.*, 
                u.profile_image_url as owner_image
            FROM clinics c
            JOIN users u ON c.owner_id = u.user_id
            WHERE c.is_paltuu_partner = true
            ORDER BY c.created_at DESC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Clinics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
