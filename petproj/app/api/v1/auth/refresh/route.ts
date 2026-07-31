import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { rotateMobileTokenPair, verifyMobileRefreshToken, verifyRefreshTokenInDb } from "@/utils/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/refresh
 * Exchange a valid refresh token for a new access token
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { refreshToken } = body;

        if (!refreshToken) {
            return NextResponse.json({ error: "Refresh token is required" }, { status: 400 });
        }

        const limited = await rateLimit(`refresh:${String(refreshToken).slice(-12)}`, 10, 60, { failOpen: false });
        if (!limited.success) {
            return NextResponse.json({ error: "Too many refresh attempts" }, { status: 429 });
        }

        // 1. Verify refresh token signature and check that it is still active in DB.
        const decoded = verifyMobileRefreshToken(refreshToken);
        if (!decoded?.user_id) {
            return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
        }

        const activeUserId = await verifyRefreshTokenInDb(refreshToken);
        if (!activeUserId) {
            return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
        }

        // 2. Fetch User
        const userRes = await db.query("SELECT user_id, name, email, role, profile_image_url FROM users WHERE user_id = $1", [activeUserId]);
        if ((userRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const user = userRes.rows[0];

        // 3. Rotate the refresh token so replay windows stay small.
        const tokens = await rotateMobileTokenPair(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
            },
            refreshToken
        );

        return NextResponse.json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.profile_image_url
            }
        });

    } catch (error) {
        console.error("V1 Auth Refresh POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
