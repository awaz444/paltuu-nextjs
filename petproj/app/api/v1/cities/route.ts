import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/cities:
 *   get:
 *     summary: Get all supported cities
 *     tags: [v1 Infrastructure]
 */
export async function GET(req: NextRequest) {
    try {
        const result = await db.query('SELECT city_id, city_name FROM cities ORDER BY city_name ASC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Cities GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
