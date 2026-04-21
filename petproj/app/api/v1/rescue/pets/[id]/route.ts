import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.pathname.split("/").pop();
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const query = `
            SELECT 
                p.*,
                COALESCE((SELECT json_agg(rmc.*) FROM rescue_medical_conditions rmc WHERE rmc.pet_id = p.pet_id), '[]'::json) as medical_conditions,
                COALESCE((SELECT json_agg(ri.image_url) FROM rescue_images ri WHERE ri.pet_id = p.pet_id), '[]'::json) as images,
                COALESCE((SELECT json_agg(rsn.special_need) FROM rescue_special_needs rsn WHERE rsn.pet_id = p.pet_id), '[]'::json) as special_needs,
                (SELECT json_build_object(
                    'id', rs.shelter_id, 
                    'name', rs.shelter_name, 
                    'profilePicture', rs.logo_url,
                    'location', rs.address,
                    'contactInfo', users.phone_number,
                    'verified', rs.approved
                ) 
                 FROM rescue_shelters rs 
                 JOIN users ON rs.user_id = users.user_id
                 WHERE rs.shelter_id = p.shelter_id) as shelter
            FROM pets p
            WHERE p.pet_id = $1 AND p.listing_type = 'rescue'
        `;

        const result = await db.query(query, [id]);
        
        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Rescue pet not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Rescue Pet Detail GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
