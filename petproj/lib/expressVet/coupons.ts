import type { PoolClient } from "pg";
import { db } from "@/db/index";

// Printed single-use Vets at Home coupons (PALTU-131) — see migrations/add_express_vet_coupons.sql.
//
// A code is redeemed when the booking is created: redeemCoupon runs inside the same
// transaction as the request INSERT, and its conditional UPDATE is what makes one-time
// use hold under concurrency (two people racing the same code: one UPDATE matches, the
// other gets no row). If that booking is cancelled or expires before the visit,
// releaseCouponForRequest gives the code back so the printed coupon isn't wasted.

export type CouponCheck =
  | { valid: true; coupon_id: string; code: string; discount_pkr: number }
  | { valid: false; error: string };

const CODE_PATTERN = /^[A-Z0-9]{3,16}$/;

/** Trim and uppercase what the user typed; null if it can't possibly be a code. */
export function normalizeCouponCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

export const COUPON_INVALID_ERROR = "That coupon code isn't valid.";
export const COUPON_USED_ERROR = "That coupon code has already been used.";

/** Read-only check for the app's "Apply" button. Doesn't redeem anything. */
export async function checkCoupon(rawCode: unknown): Promise<CouponCheck> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { valid: false, error: COUPON_INVALID_ERROR };
  const res = await db.query(
    `SELECT coupon_id, code, discount_pkr, is_used FROM express_vet_coupons WHERE code = $1`,
    [code]
  );
  const row = res.rows[0];
  if (!row) return { valid: false, error: COUPON_INVALID_ERROR };
  if (row.is_used) return { valid: false, error: COUPON_USED_ERROR };
  return { valid: true, coupon_id: String(row.coupon_id), code: row.code, discount_pkr: Number(row.discount_pkr) };
}

/**
 * Atomically mark a code used by this user. Must run inside the booking transaction;
 * call linkCouponToRequest once the request row exists.
 */
export async function redeemCoupon(client: PoolClient, rawCode: unknown, userId: number): Promise<CouponCheck> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { valid: false, error: COUPON_INVALID_ERROR };
  const res = await client.query(
    `UPDATE express_vet_coupons
     SET is_used = true, used_by_user_id = $2, used_at = now()
     WHERE code = $1 AND is_used = false
     RETURNING coupon_id, code, discount_pkr`,
    [code, userId]
  );
  const row = res.rows[0];
  if (row) return { valid: true, coupon_id: String(row.coupon_id), code: row.code, discount_pkr: Number(row.discount_pkr) };
  // No row: either it doesn't exist or someone already used it — tell them which.
  const exists = await client.query(`SELECT 1 FROM express_vet_coupons WHERE code = $1`, [code]);
  return { valid: false, error: exists.rowCount ? COUPON_USED_ERROR : COUPON_INVALID_ERROR };
}

export async function linkCouponToRequest(client: PoolClient, couponId: string, requestId: string | number) {
  await client.query(`UPDATE express_vet_coupons SET request_id = $2 WHERE coupon_id = $1`, [couponId, requestId]);
}

/**
 * Give a cancelled/expired booking's code back. Only releases a code still pointing at
 * this request, and leaves the request's own coupon_id/discount_pkr as the historical
 * record of what was applied.
 */
export async function releaseCouponForRequest(requestId: string | number) {
  try {
    await db.query(
      `UPDATE express_vet_coupons
       SET is_used = false, used_by_user_id = NULL, request_id = NULL, used_at = NULL
       WHERE request_id = $1 AND is_used = true`,
      [requestId]
    );
  } catch (err) {
    console.error(`express-vet coupon release for request ${requestId} failed (non-blocking):`, err);
  }
}

/** What the client actually pays: the agreed price (or the estimate) minus the coupon, floored at 0. */
export function payablePkr(request: {
  final_price_pkr?: number | null;
  starting_price_pkr: number;
  discount_pkr?: number | null;
}): number {
  const price = Number(request.final_price_pkr ?? request.starting_price_pkr);
  return Math.max(price - Number(request.discount_pkr ?? 0), 0);
}
