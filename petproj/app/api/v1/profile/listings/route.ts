import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/profile/listings:
 *   get:
 *     summary: Get current user pet listings (V1)
 *     tags: [v1 Profile]
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        const result = await db.query(`
            SELECT 
                p.*, 
                c.city_name as city,
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) as main_image
            FROM pets p
            LEFT JOIN cities c ON p.city_id = c.city_id
            WHERE p.owner_id = $1
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        const countRes = await db.query('SELECT COUNT(*) FROM pets WHERE owner_id = $1', [userId]);
        const total = parseInt(countRes.rows[0].count, 10);

        return NextResponse.json({
            data: result.rows,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error("V1 Profile Listings error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
