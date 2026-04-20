import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/foster-pets:
 *   get:
 *     summary: Get all pets in foster care (V1)
 *     tags: [v1 Pets]
 */

export async function GET(req: NextRequest) {
    try {
        const result = await db.query(`
            SELECT 
                pets.*, 
                (SELECT image_url FROM pet_images WHERE pet_id = pets.pet_id ORDER BY "order" ASC LIMIT 1) as image_url
            FROM pets
            WHERE adoption_status = 'foster' AND approved = true
            ORDER BY created_at DESC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Foster Pets Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
