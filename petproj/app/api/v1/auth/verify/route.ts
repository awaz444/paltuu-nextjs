import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     summary: Verify session and get user identity (v1)
 *     tags: [v1 Auth]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        
        if (!user) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        const userId = user.user_id || user.id;
        
        // Fetch full profile to avoid extra client-side calls
        const { db } = await import("@/db/index");
        const result = await db.query('SELECT user_id, name, email, role, profile_image_url FROM users WHERE user_id = $1', [userId]);
        
        if (result.rowCount === 0) {
            return NextResponse.json({ valid: false, error: "User not found" }, { status: 404 });
        }

        const dbUser = result.rows[0];

        return NextResponse.json({
            valid: true,
            user: {
                id: dbUser.user_id,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
                profile_image_url: dbUser.profile_image_url || "/default-avatar.png"
            }
        });
    } catch (error) {
        console.error("V1 Auth Verify Error:", error);
        return NextResponse.json({ valid: false, error: "Internal Server Error" }, { status: 500 });
    }
}
