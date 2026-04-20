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

        return NextResponse.json({
            valid: true,
            user: {
                id: user.user_id || user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("V1 Auth Verify Error:", error);
        return NextResponse.json({ valid: false, error: "Internal Server Error" }, { status: 500 });
    }
}
