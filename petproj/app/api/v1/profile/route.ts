import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get current user profile (V1)
 *     tags: [v1 Profile]
 *   patch:
 *     summary: Update profile (V1)
 *     tags: [v1 Profile]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const result = await db.query(`
            SELECT 
                u.user_id, u.name, u.email, u.dob, u.phone_number, u.role, 
                u.profile_image_url, u.created_at, u.username,
                c.city_name as city, c.city_id,
                (SELECT COUNT(*) FROM pets WHERE owner_id = u.user_id) as total_listings,
                (SELECT COUNT(*) FROM adoption_applications WHERE user_id = u.user_id) as total_applications
            FROM users u
            LEFT JOIN cities c ON u.city_id = c.city_id
            WHERE u.user_id = $1
        `, [userId]);

        if (result.rowCount === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Profile GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, profile_image_url, city_id, dob } = body;

        const result = await db.query(`
            UPDATE users SET 
                name = COALESCE($1, name),
                profile_image_url = COALESCE($2, profile_image_url),
                city_id = COALESCE($3, city_id),
                dob = COALESCE($4, dob),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $5
            RETURNING user_id, name, email, profile_image_url, role, city_id
        `, [name, profile_image_url, city_id, dob, userId]);

        if (result.rowCount === 0) return NextResponse.json({ error: "Update failed" }, { status: 404 });

        return NextResponse.json({
            message: "Profile updated successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("V1 Profile PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
