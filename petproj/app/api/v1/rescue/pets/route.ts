import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/rescue/pets:
 *   get:
 *     summary: Get all rescue pets with medical and shelter data (V1)
 *     tags: [v1 Community]
 */

export async function GET(req: NextRequest) {
    try {
        const query = `
            SELECT 
                rp.*,
                COALESCE((SELECT json_agg(rmc.*) FROM rescue_medical_conditions rmc WHERE rmc.rescue_id = rp.rescue_id), '[]'::json) as medical_conditions,
                COALESCE((SELECT json_agg(ri.image_url) FROM rescue_images ri WHERE ri.rescue_id = rp.rescue_id), '[]'::json) as images,
                COALESCE((SELECT json_agg(rsn.special_need) FROM rescue_special_needs rsn WHERE rsn.rescue_id = rp.rescue_id), '[]'::json) as special_needs,
                (SELECT json_build_object('id', rs.shelter_id, 'name', rs.shelter_name, 'location', rs.address) 
                 FROM rescue_shelters rs WHERE rs.shelter_id = rp.rescue_org_id) as shelter
            FROM rescue_pets rp
            ORDER BY rp.rescue_date DESC
        `;

        const result = await db.query(query);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Rescue Pets GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
