import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/applications/my-pets
 * Fetch all adoption and foster applications received on the current user's pet listings
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Fetch adoption applications received on user's pets
        const adoptionsResult = await db.query(`
            SELECT
                'adoption' AS type,
                aa.adoption_id,
                aa.status,
                aa.created_at,
                aa.adopter_name,
                aa.contact_number AS contact_info,
                aa.adopter_address,
                aa.age_of_youngest_child,
                aa.other_pets_details,
                aa.other_pets_neutered,
                aa.has_secure_outdoor_area,
                aa.pet_sleep_location,
                aa.pet_left_alone,
                aa.additional_details AS pet_description,
                c.city_name,
                p.pet_name,
                p.pet_id,
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url
            FROM adoption_applications aa
            JOIN pets p ON aa.pet_id = p.pet_id
            LEFT JOIN cities c ON aa.city_id = c.city_id
            WHERE p.owner_id = $1
            ORDER BY aa.created_at DESC;
        `, [userId]);

        return NextResponse.json(adoptionsResult.rows);
    } catch (error) {
        console.error("V1 Applications My-Pets GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
