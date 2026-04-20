import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/bazaar/collections:
 *   get:
 *     summary: Get bazaar collections (Pet types)
 *     tags: [v1 Bazaar]
 */
export async function GET(req: NextRequest) {
    try {
        const result = await db.query(`
            SELECT collection_id, name, slug, description, image_url 
            FROM bazaar_collections 
            WHERE is_active = true 
            ORDER BY sort_order ASC, name ASC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Collections GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
