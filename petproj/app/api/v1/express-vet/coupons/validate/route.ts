import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { checkCoupon } from "@/lib/expressVet/coupons";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/coupons/validate:
 *   post:
 *     summary: Check a Vets at Home coupon code before booking (V1). Read-only — the code is redeemed when the request is created.
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = await rateLimit(req, LIMITS.EXPRESS_VET_COUPON_CHECK, `evcoupon:${userId}`, {
      message: "Too many coupon attempts — please try again in a few minutes.",
    });
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const result = await checkCoupon(body?.code);
    if (!result.valid) return NextResponse.json({ valid: false, error: result.error });
    return NextResponse.json({ valid: true, code: result.code, discount_pkr: result.discount_pkr });
  } catch (error) {
    console.error("express-vet coupons/validate POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
