import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/profile/managed-entities:
 *   get:
 *     summary: Get shops or shelters managed by the current user (V1)
 *     tags: [v1 Profile]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Check for Shop
        const shopRes = await db.query('SELECT shop_id, shop_name FROM shops WHERE user_id = $1', [userId]);
        
        // 2. Check for Shelter
        const shelterRes = await db.query('SELECT shelter_id, shelter_name FROM rescue_shelters WHERE user_id = $1', [userId]);

        return NextResponse.json({
            managed_shops: shopRes.rows,
            managed_shelters: shelterRes.rows,
            is_admin: shopRes.rowCount > 0 || shelterRes.rowCount > 0
        });

    } catch (error) {
        console.error("V1 Managed Entities error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
