import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/vets:
 *   get:
 *     summary: Get veterinarian directory (V1)
 *     tags: [v1 Services]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cityId = searchParams.get("city");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = 20;
        const offset = (page - 1) * limit;

        const conditions = ["v.is_active = true"];
        const values = [];
        let pIdx = 1;

        if (cityId) { values.push(parseInt(cityId)); conditions.push(`v.city_id = $${pIdx++}`); }

        const query = `
            SELECT 
                v.vet_id, v.clinic_name, v.vet_name, v.address, v.phone_number,
                v.specialization, v.rating, v.image_url, v.latitude, v.longitude,
                c.city_name as city
            FROM vets v
            LEFT JOIN cities c ON v.city_id = c.city_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY v.rating DESC, v.vet_name ASC
            LIMIT $${pIdx++} OFFSET $${pIdx++}
        `;

        const result = await db.query(query, [...values, limit, offset]);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Vets GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
