import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/newsletter:
 *   post:
 *     summary: Subscribe to newsletter (V1)
 *     tags: [v1 Infrastructure]
 */

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        const result = await db.query(`
            INSERT INTO newsletter_subscriptions (email, subscription_status, created_at)
            VALUES ($1, 'active', CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO UPDATE SET subscription_status = 'active', updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [email]);

        return NextResponse.json({ message: "Subscribed successfully", subscription: result.rows[0] });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
