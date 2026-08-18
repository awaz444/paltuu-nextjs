import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { sendEmail } from "@/utils/email";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/utils/rateLimit";

/**
 * @swagger
 * /api/v1/auth/request-email-change:
 *   post:
 *     summary: Send a 6-digit OTP to the caller's current (on-file) email, as the first step of changing it (V1)
 *     tags: [v1 Auth]
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // The current email is looked up server-side from the authenticated
        // user, never taken from the request body — otherwise a caller could
        // point the OTP at an email they don't actually own.
        const userRes = await db.query('SELECT email FROM users WHERE user_id = $1', [userId]);
        if ((userRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const currentEmail = userRes.rows[0].email as string;

        const limiter = await rateLimit(`email-change-otp:${userId}`, 3, 300, { failOpen: false });
        if (!limiter.success) {
            return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await db.query('DELETE FROM "OTP" WHERE email = $1', [currentEmail]);
        await db.query('INSERT INTO "OTP" (email, otp, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)', [currentEmail, hashedOtp]);

        await sendEmail({
            to: currentEmail,
            subject: "Your Paltuu Email Change Verification Code",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #8B1538;">Email Change Verification</h2>
                    <p>We received a request to change the email address on your Paltuu account. Use the code below to confirm it's you:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background-color: #F9F0F2; border: 2px dashed #8B1538; border-radius: 12px; padding: 20px; display: inline-block;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8B1538;">${otp}</span>
                        </div>
                    </div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <p>If you didn't request this, you can safely ignore this email — your account will not be changed.</p>
                </div>
            `,
            text: `Your Paltuu email change verification code is: ${otp}. It will expire in 10 minutes.`,
        });

        // Mask so the client can show "code sent to jo***@gmail.com" without exposing the full address.
        const [local, domain] = currentEmail.split('@');
        const maskedLocal = local.length <= 2 ? local[0] + '*' : local.slice(0, 2) + '*'.repeat(local.length - 2);
        const maskedEmail = `${maskedLocal}@${domain}`;

        return NextResponse.json({ success: true, maskedEmail });

    } catch (error) {
        console.error("V1 Request Email Change Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
