import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/email";
import crypto from "crypto";

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset (V1)
 *     tags: [v1 Auth]
 */
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        // 1. Check if user exists
        const userRes = await db.query('SELECT user_id, name FROM users WHERE email = $1', [email]);
        if ((userRes.rowCount ?? 0) === 0) {
            // Security best practice: Don't reveal if user exists, but for this app we'll be helpful
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = userRes.rows[0];

        // 2. Generate a secure token
        const token = crypto.randomBytes(32).toString('hex');

        // 3. Store in OTP table (overloading it for password reset)
        // We delete old entries for this email first
        await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);
        await db.query('INSERT INTO "OTP" (email, otp, created_at) VALUES ($1, $2, NOW())', [email, token]);

        // 4. Send Email
        // Use production domain for email links, not localhost
        const emailDomain = process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')
            ? process.env.NEXTAUTH_URL
            : (process.env.NEXT_PUBLIC_APP_URL || 'https://paltuu.pk');
        const resetLink = `${emailDomain}/reset-password?token=${token}`;

        await sendEmail({
            to: email,
            subject: "Reset your Paltuu Password",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #8B1538;">Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>You requested to reset your password for your Paltuu account. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #8B1538; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="font-size: 12px; color: #777; word-break: break-all;">${resetLink}</p>
                </div>
            `
        });

        return NextResponse.json({ success: true, message: "Reset link sent" });

    } catch (error) {
        console.error("V1 Forgot Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
