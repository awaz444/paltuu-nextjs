import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/utils/rateLimit";

/**
 * @swagger
 * /api/v1/auth/reset-password-otp:
 *   post:
 *     summary: Reset password using 6-digit OTP (V1)
 *     tags: [v1 Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or missing fields
 *       410:
 *         description: OTP expired
 *       429:
 *         description: Rate limited
 */
export async function POST(req: NextRequest) {
    try {
        const { email, otp, newPassword } = await req.json();
        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 });
        }

        const normalizedEmail = String(email).toLowerCase().trim();

        // Rate limit: 5 attempts per 5 minutes per email
        const limiter = await rateLimit(`reset-pw-otp:${normalizedEmail}`, 5, 300, { failOpen: false });
        if (!limiter.success) {
            return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
        }

        // 1. Get stored OTP for this email
        const otpRes = await db.query('SELECT otp, created_at FROM "OTP" WHERE email = $1', [normalizedEmail]);
        if ((otpRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "No reset code found. Please request a new one." }, { status: 400 });
        }

        const storedOtp = otpRes.rows[0].otp;
        const createdAt = otpRes.rows[0].created_at;

        // 2. Check expiry (10 minutes)
        const tokenDate = new Date(createdAt);
        const tokenCreatedTime = Date.UTC(
            tokenDate.getFullYear(),
            tokenDate.getMonth(),
            tokenDate.getDate(),
            tokenDate.getHours(),
            tokenDate.getMinutes(),
            tokenDate.getSeconds(),
            tokenDate.getMilliseconds()
        );
        const currentTime = Date.now();
        const tenMinutesMs = 10 * 60 * 1000;

        if (currentTime - tokenCreatedTime > tenMinutesMs) {
            await db.query('DELETE FROM "OTP" WHERE email = $1', [normalizedEmail]);
            return NextResponse.json({ error: "Reset code has expired. Please request a new one." }, { status: 410 });
        }

        // 3. Verify OTP (bcrypt compare since we stored it hashed)
        const isValid = await bcrypt.compare(otp.toString(), storedOtp);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
        }

        // 4. Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, normalizedEmail]);

        // 5. Clean up used OTP
        await db.query('DELETE FROM "OTP" WHERE email = $1', [normalizedEmail]);

        return NextResponse.json({ success: true, message: "Password reset successful" });

    } catch (error) {
        console.error("V1 Reset Password OTP Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
