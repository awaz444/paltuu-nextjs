import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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

        // 1. Verify token exists in DB and is not revoked
        const res = await db.query(`
            SELECT * FROM refresh_tokens 
            WHERE token = $1 AND revoked = false AND expires_at > NOW()
        `, [refreshToken]);

        if ((res.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
        }

        const rt = res.rows[0];

        // 2. Fetch User
        const userRes = await db.query("SELECT * FROM users WHERE user_id = $1", [rt.user_id]);
        if ((userRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const user = userRes.rows[0];

        // 3. Generate New Access Token
        const accessToken = jwt.sign(
            { 
                id: user.user_id,
                user_id: user.user_id,
                email: user.email, 
                name: user.name,
                role: user.role 
            },
            process.env.TOKEN_SECRET!,
            { expiresIn: '2h' }
        );

        return NextResponse.json({ 
            success: true, 
            accessToken,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image
            }
        });

    } catch (error) {
        console.error("V1 Auth Refresh POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
