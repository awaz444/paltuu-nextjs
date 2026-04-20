import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

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
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id LIMIT 1) AS primary_image
            FROM pets p
            LEFT JOIN pet_category cat ON p.pet_type = cat.category_id
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
