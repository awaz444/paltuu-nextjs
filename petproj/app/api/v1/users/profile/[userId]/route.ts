import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/users/profile/{userId}:
 *   get:
 *     summary: Get user profile data
 *     tags: [v1 Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const userId = parseInt(params.userId);

        if (isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 }
            );
        }

        // Fetch user profile with city information
        const result = await db.query(
            `SELECT
                u.user_id,
                u.name,
                u.dob,
                u.email,
                u.profile_image_url,
                u.created_at,
                c.city_name as city
            FROM users u
            LEFT JOIN cities c ON u.city_id = c.city_id
            WHERE u.user_id = $1`,
            [userId]
        );

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const user = result.rows[0];

        return NextResponse.json({
            user_id: user.user_id,
            name: user.name,
            dob: user.dob,
            email: user.email,
            profile_image_url: user.profile_image_url || "/default-avatar.png",
            city: user.city || "Not specified",
            created_at: user.created_at
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
