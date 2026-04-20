import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { rateLimit } from "@/utils/rateLimit";
// Helper to send email (reusing existing logic or standardizing)
import { sendEmail } from "@/utils/email"; 

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send OTP to email (V1)
 *     tags: [v1 Auth]
 */

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        // Rate limit: 3 OTPs per 5 minutes per email
        const limiter = await rateLimit(`otp:${email}`, 3, 300);
        if (!limiter.success) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Store OTP (Delete old ones first)
        await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);
        await db.query('INSERT INTO "OTP" (email, otp, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)', [email, hashedOtp]);

        // Send Email
        await sendEmail({
            to: email,
            subject: "Your Paltuu Verification Code",
            text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `<h1>Verification Code</h1><p>Your code is: <strong>${otp}</strong></p>`
        });

        return NextResponse.json({ success: true, message: "OTP sent successfully" });

    } catch (error) {
        console.error("V1 Send OTP error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
