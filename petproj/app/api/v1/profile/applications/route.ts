import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/profile/applications:
 *   get:
 *     summary: Get all applications submitted by the current user (V1)
 *     tags: [v1 Profile]
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch adoption applications
        const adoptionApps = await db.query(`
            SELECT 
                aa.adoption_id as id, 'adoption' as type, aa.status, aa.created_at,
                p.pet_id, p.pet_name, p.pet_type,
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) as pet_image
            FROM adoption_applications aa
            JOIN pets p ON aa.pet_id = p.pet_id
            WHERE aa.user_id = $1
            ORDER BY aa.created_at DESC
        `, [userId]);

        // Fetch foster applications
        const fosterApps = await db.query(`
            SELECT 
                fa.foster_id as id, 'foster' as type, fa.status, fa.created_at,
                p.pet_id, p.pet_name, p.pet_type,
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) as pet_image
            FROM foster_applications fa
            JOIN pets p ON fa.pet_id = p.pet_id
            WHERE fa.user_id = $1
            ORDER BY fa.created_at DESC
        `, [userId]);

        return NextResponse.json({
            adoption: adoptionApps.rows,
            foster: fosterApps.rows,
            total: (adoptionApps.rowCount ?? 0) + (fosterApps.rowCount ?? 0)
        });

    } catch (error) {
        console.error("V1 Profile Applications error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
