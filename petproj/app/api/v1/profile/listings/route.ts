import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/profile/listings:
 *   get:
 *     summary: Get authenticated user's pet listings (V1 Hardened)
 *     tags: [v1 Profile]
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const query = `
            SELECT
                p.*,
                cat.category_name AS category,
                cities.city_name AS city_name,
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url,
                (SELECT COUNT(*) FROM pet_images WHERE pet_id = p.pet_id)::int AS photo_count,
                -- Application summary for the owner's dashboard. Foster listings
                -- collect foster applications; every other type collects adoption ones.
                CASE WHEN p.listing_type = 'foster'
                    THEN (SELECT COUNT(*) FROM foster_applications fa WHERE fa.pet_id = p.pet_id)
                    ELSE (SELECT COUNT(*) FROM adoption_applications aa WHERE aa.pet_id = p.pet_id)
                END::int AS application_count,
                CASE WHEN p.listing_type = 'foster'
                    THEN (SELECT COUNT(*) FROM foster_applications fa WHERE fa.pet_id = p.pet_id AND fa.status = 'pending')
                    ELSE (SELECT COUNT(*) FROM adoption_applications aa WHERE aa.pet_id = p.pet_id AND aa.status = 'pending')
                END::int AS pending_application_count,
                CASE WHEN p.listing_type = 'foster'
                    THEN ARRAY(SELECT u.name FROM foster_applications fa JOIN users u ON u.user_id = fa.user_id
                               WHERE fa.pet_id = p.pet_id ORDER BY fa.created_at DESC LIMIT 3)
                    ELSE ARRAY(SELECT u.name FROM adoption_applications aa JOIN users u ON u.user_id = aa.user_id
                               WHERE aa.pet_id = p.pet_id ORDER BY aa.created_at DESC LIMIT 3)
                END AS recent_applicant_names
            FROM pets p
            LEFT JOIN pet_category cat ON p.pet_type = cat.category_id
            LEFT JOIN cities ON p.city_id = cities.city_id
            WHERE p.owner_id = $1
            ORDER BY p.created_at DESC;
        `;
        const result = await db.query(query, [userId]);
        return NextResponse.json({ listings: result.rows });
    } catch (error) {
        console.error("V1 Profile Listings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
