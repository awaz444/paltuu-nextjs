import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/clinics:
 *   get:
 *     summary: Get all clinics with optional city filter
 *     tags: [v1 Professional]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter clinics by city (e.g. Karachi, Lahore, Islamabad)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by clinic category
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const city     = searchParams.get("city");
        const category = searchParams.get("category");

        // Always require a logo — clinics without one are not shown publicly
        const conditions: string[] = ["c.logo_url IS NOT NULL"];
        const params: any[] = [];

        if (city) {
            params.push(city);
            conditions.push(`LOWER(c.city) = LOWER($${params.length})`);
        }

        if (category) {
            params.push(`%${category}%`);
            conditions.push(`LOWER(c.category) ILIKE $${params.length}`);
        }

        const whereClause = `WHERE ${conditions.join(" AND ")}`;

        const result = await db.query(`
            SELECT
                c.*,
                u.profile_image_url  AS owner_image,
                COUNT(cv.vet_id)::int AS vet_count
            FROM clinics c
            LEFT JOIN users u   ON c.owner_id = u.user_id
            LEFT JOIN clinic_vets cv ON c.clinic_id = cv.clinic_id
            ${whereClause}
            GROUP BY c.clinic_id, u.profile_image_url
            ORDER BY c.rating DESC NULLS LAST, c.created_at DESC
        `, params);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Clinics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
