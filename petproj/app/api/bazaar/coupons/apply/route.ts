/**
 * @swagger
 * /api/bazaar/coupons/apply:
 *   post:
 *     summary: Auto-generated summary for /api/bazaar/coupons/apply
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../../db/ecom';

export async function POST(req: NextRequest) {
  const pool = getPool();
  try {
    const body = await req.json();
    const codeRaw: string = (body?.code || '').toString().trim();
    const subtotal: number = Number(body?.subtotal || 0);

    if (!codeRaw || subtotal <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const code = codeRaw.toUpperCase();

    // Fetch active coupon
    const { rows } = await pool.query(
      `SELECT * FROM bazaar_coupons WHERE UPPER(code) = $1 LIMIT 1`,
      [code]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 });
    }

    const coupon = rows[0];

    // Basic validations
    const now = new Date();
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (coupon.is_active === false) {
      return NextResponse.json({ error: 'Promo code is no longer active' }, { status: 400 });
    }
    if (validFrom && now < validFrom) {
      return NextResponse.json({ error: 'Promo code is not yet valid' }, { status: 400 });
    }
    if (validUntil && now > validUntil) {
      return NextResponse.json({ error: 'Promo code has expired' }, { status: 400 });
    }
    if (coupon.min_order_amount && Number(subtotal) < Number(coupon.min_order_amount)) {
      return NextResponse.json({ error: `Minimum order amount not met` }, { status: 400 });
    }
    if (coupon.usage_limit && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
      return NextResponse.json({ error: 'Promo code usage limit reached' }, { status: 400 });
    }

    // Compute discount
    let discount = 0;
    const discountType = (coupon.discount_type || '').toString();
    const discountValue = Number(coupon.discount_value || 0);

    if (discountType === 'percentage') {
      discount = (subtotal * discountValue) / 100;
      const maxCap = coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null;
      if (maxCap !== null) discount = Math.min(discount, maxCap);
    } else if (discountType === 'fixed_amount') {
      discount = discountValue;
    } else {
      return NextResponse.json({ error: 'Invalid promo configuration' }, { status: 400 });
    }

    // prevent over-discount
    discount = Math.max(0, Math.min(discount, subtotal));

    // Mark as used: increment used_count and deactivate after use as requested
    await pool.query(
      `UPDATE bazaar_coupons 
       SET used_count = COALESCE(used_count, 0) + 1,
           is_active = FALSE,
           valid_until = COALESCE(valid_until, NOW())
       WHERE coupon_id = $1`,
      [coupon.coupon_id]
    );

    return NextResponse.json({
      success: true,
      code,
      discount,
      discount_type: discountType,
    });
  } catch (e: any) {
    console.error('Apply coupon error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


