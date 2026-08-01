import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { sendBetaSignupNotification } from "@/utils/mailjet";

/**
 * @swagger
 * /api/v1/beta-signup:
 *   post:
 *     summary: Sign up for the mobile app beta program (V1)
 *     tags: [v1 Communications]
 */

export async function POST(req: NextRequest) {
    try {
        const { email, platform } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        if (platform !== "ios" && platform !== "android") {
            return NextResponse.json({ error: "Platform must be 'ios' or 'android'" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        await db.query(`
            INSERT INTO beta_signups (email, platform, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            ON CONFLICT (email)
            DO UPDATE SET platform = EXCLUDED.platform, updated_at = NOW()
        `, [normalizedEmail, platform]);

        // Fire-and-forget — never blocks the response
        sendBetaSignupNotification({ email: normalizedEmail, platform }).catch((err) => {
            console.error("❌ [beta-signup/POST] notification email failed:", err);
        });

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        console.error("V1 Beta Signup POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
