import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP (V1)
 *     tags: [v1 Auth]
 */

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();
        if (!email || !otp) return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });

        const result = await db.query('SELECT * FROM "OTP" WHERE email = $1', [email]);
        if (result.rowCount === 0) return NextResponse.json({ error: "OTP not found or expired" }, { status: 400 });

        const storedOtp = result.rows[0].otp;
        const isValid = await bcrypt.compare(otp.toString(), storedOtp);

        if (!isValid) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

        // We don't delete here yet if the user still needs to call register, 
        // OR we can return a temporary "verification_token".
        // For simplicity and compatibility with existing web logic:
        return NextResponse.json({ success: true, message: "OTP verified" });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
