import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using token (V1)
 *     tags: [v1 Auth]
 */
export async function POST(req: NextRequest) {
    try {
        const { token, newPassword } = await req.json();
        if (!token || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // 1. Verify token in OTP table
        const otpRes = await db.query('SELECT email, created_at FROM "OTP" WHERE otp = $1', [token]);

        if ((otpRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
        }

        const email = otpRes.rows[0].email;
        const created_at = otpRes.rows[0].created_at;

        // Check if token is expired (1 hour)
        const tokenCreatedTime = new Date(created_at).getTime();
        const currentTime = new Date().getTime();
        const hourInMs = 60 * 60 * 1000;

        if (currentTime - tokenCreatedTime > hourInMs) {
            await db.query('DELETE FROM "OTP" WHERE otp = $1', [token]);
            return NextResponse.json({ error: "Password reset link has expired" }, { status: 410 });
        }

        // 2. Hash new password
        const hashed = await bcrypt.hash(newPassword, 10);

        // 3. Update user password
        await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashed, email]);

        // 4. Delete the used token
        await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);

        return NextResponse.json({ success: true, message: "Password reset successful" });

    } catch (error) {
        console.error("V1 Reset Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
