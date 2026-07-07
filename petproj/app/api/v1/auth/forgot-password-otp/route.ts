import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/email";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/utils/rateLimit";

/**
 * @swagger
 * /api/v1/auth/forgot-password-otp:
 *   post:
 *     summary: Send a 6-digit OTP for password reset (V1)
 *     tags: [v1 Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limited
 */
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        const normalizedEmail = String(email).toLowerCase().trim();

        // Rate limit: 3 requests per 5 minutes per email
        const limiter = await rateLimit(`forgot-pw-otp:${normalizedEmail}`, 3, 300, { failOpen: false });
        if (!limiter.success) {
            return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
        }

        // 1. Check if user exists
        const userRes = await db.query('SELECT user_id, name FROM users WHERE email = $1', [normalizedEmail]);
        if ((userRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
        }

        const user = userRes.rows[0];

        // 2. Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // 3. Store in OTP table (delete old entries first)
        await db.query('DELETE FROM "OTP" WHERE email = $1', [normalizedEmail]);
        await db.query('INSERT INTO "OTP" (email, otp, created_at) VALUES ($1, $2, NOW())', [normalizedEmail, hashedOtp]);

        // 4. Send email with OTP
        await sendEmail({
            to: normalizedEmail,
            subject: "Your Paltuu Password Reset Code",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #8B1538;">Password Reset Code</h2>
                    <p>Hello ${user.name},</p>
                    <p>You requested to reset your password for your Paltuu account. Use the code below to verify your identity:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background-color: #F9F0F2; border: 2px dashed #8B1538; border-radius: 12px; padding: 20px; display: inline-block;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8B1538;">${otp}</span>
                        </div>
                    </div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">Do not share this code with anyone. Paltuu will never ask for your code.</p>
                </div>
            `,
            text: `Your Paltuu password reset code is: ${otp}. It will expire in 10 minutes.`,
        });

        return NextResponse.json({ success: true, message: "Password reset code sent to your email" });

    } catch (error) {
        console.error("V1 Forgot Password OTP Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
