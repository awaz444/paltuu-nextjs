import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/newsletter:
 *   get:
 *     summary: Check newsletter subscription status (V1)
 *     tags: [v1 Communications]
 *   post:
 *     summary: Subscribe or reactivate newsletter (V1)
 *     tags: [v1 Communications]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        const result = await db.query(`
            SELECT subscription_status, created_at 
            FROM newsletter_subscriptions 
            WHERE email = $1
        `, [email]);

        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ subscribed: false });
        return NextResponse.json({
            subscribed: result.rows[0].subscription_status === 'active',
            details: result.rows[0]
        });
    } catch (error) {
        console.error("V1 Newsletter GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        // Basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

        // Check/Upsert
        const check = await db.query('SELECT id, subscription_status FROM newsletter_subscriptions WHERE email = $1', [email]);

        if ((check.rowCount ?? 0) > 0) {
            if (check.rows[0].subscription_status === 'active') {
                return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
            }
            await db.query("UPDATE newsletter_subscriptions SET subscription_status = 'active', updated_at = NOW() WHERE email = $1", [email]);
            return NextResponse.json({ message: "Subscription reactivated" });
        }

        await db.query(`
            INSERT INTO newsletter_subscriptions (email, subscription_status, created_at)
            VALUES ($1, 'active', NOW())
        `, [email]);

        return NextResponse.json({ success: true, message: "Subscribed successfully" }, { status: 201 });

    } catch (error) {
        console.error("V1 Newsletter POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
