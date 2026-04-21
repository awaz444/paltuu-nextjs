import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, subtotal } = body;

        if (!code) return NextResponse.json({ error: "Coupon code required" }, { status: 400 });

        const result = await db.query(`
            SELECT * FROM bazaar_coupons 
            WHERE code = $1 
            AND is_active = true 
            AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
            AND (ends_at IS NULL OR ends_at >= CURRENT_TIMESTAMP)
        `, [code]);

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
        }

        const coupon = result.rows[0];

        // Validate usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
        }

        // Validate min subtotal
        if (coupon.min_subtotal && subtotal < coupon.min_subtotal) {
            return NextResponse.json({ error: `Minimum order amount for this coupon is ${coupon.min_subtotal}` }, { status: 400 });
        }

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount_amount) {
                discount = Math.min(discount, coupon.max_discount_amount);
            }
        } else if (coupon.discount_type === 'fixed') {
            discount = coupon.discount_value;
        }

        return NextResponse.json({
            success: true,
            discount,
            coupon_id: coupon.coupon_id
        });

    } catch (error) {
        console.error("V1 Coupon Apply error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
