import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validateEmail } from "@/utils/emailValidation";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/utils/rateLimit";

/**
 * @swagger
 * /api/v1/auth/change-email:
 *   post:
 *     summary: Complete an email change by confirming the OTP sent to the current email, then writing the new one (V1)
 *     tags: [v1 Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp, newEmail]
 *             properties:
 *               otp:
 *                 type: string
 *               newEmail:
 *                 type: string
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { otp, newEmail } = await req.json();
        if (!otp || !newEmail) {
            return NextResponse.json({ error: "OTP and new email are required" }, { status: 400 });
        }

        const validation = validateEmail(newEmail);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const normalizedNewEmail = validation.normalised!;

        const userRes = await db.query('SELECT email FROM users WHERE user_id = $1', [userId]);
        if ((userRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const currentEmail = userRes.rows[0].email as string;

        if (normalizedNewEmail === currentEmail.toLowerCase()) {
            return NextResponse.json({ error: "That's already your current email." }, { status: 400 });
        }

        const limiter = await rateLimit(`change-email:${userId}`, 5, 300, { failOpen: false });
        if (!limiter.success) {
            return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
        }

        // 1. Fetch the OTP that was sent to the CURRENT email (request-email-change)
        const otpRes = await db.query('SELECT otp, created_at FROM "OTP" WHERE email = $1', [currentEmail]);
        if ((otpRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
        }

        const storedOtp = otpRes.rows[0].otp;
        const createdAt = otpRes.rows[0].created_at;

        // 2. Check expiry (10 minutes)
        const tokenCreatedTime = new Date(createdAt).getTime();
        const tenMinutesMs = 10 * 60 * 1000;
        if (Date.now() - tokenCreatedTime > tenMinutesMs) {
            await db.query('DELETE FROM "OTP" WHERE email = $1', [currentEmail]);
            return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 410 });
        }

        // 3. Verify OTP
        const isValid = await bcrypt.compare(otp.toString(), storedOtp);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        // 4. Ensure the new email isn't already taken by another account
        const existing = await db.query(
            'SELECT user_id FROM users WHERE LOWER(email) = $1 AND user_id != $2',
            [normalizedNewEmail, userId]
        );
        if ((existing.rowCount ?? 0) > 0) {
            return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
        }

        // 5. Write the new email and clean up the used OTP
        const result = await db.query(
            'UPDATE users SET email = $1 WHERE user_id = $2 RETURNING user_id, name, email',
            [normalizedNewEmail, userId]
        );
        await db.query('DELETE FROM "OTP" WHERE email = $1', [currentEmail]);

        return NextResponse.json({ success: true, user: result.rows[0] });

    } catch (error) {
        console.error("V1 Change Email Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
