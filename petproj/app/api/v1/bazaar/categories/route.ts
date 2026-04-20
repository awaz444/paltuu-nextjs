import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/bazaar/categories:
 *   get:
 *     summary: Get bazaar categories
 *     tags: [v1 Bazaar]
 */
export async function GET(req: NextRequest) {
    try {
        const result = await db.query(`
            SELECT category_id, name, slug, description, image_url, parent_id 
            FROM bazaar_categories 
            WHERE is_active = true 
            ORDER BY sort_order ASC, name ASC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Categories GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
