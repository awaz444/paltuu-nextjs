import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { EXPRESS_VET_CATEGORY_LABELS } from "@/lib/expressVet/catalog";
import { ExpressVetNotifications } from "@/lib/notifications";
import { notifyVetRequestUpdate } from "@/lib/whatsappNotify";
import { releaseCouponForRequest } from "@/lib/expressVet/coupons";

export const dynamic = "force-dynamic";

const EXPIRY_HOURS_SETTING_KEY = "express_vet_request_expiry_hours";

/**
 * @swagger
 * /api/v1/express-vet/cron/expire:
 *   post:
 *     summary: Flip overdue pending_dispatch Vets at Home (Express Vet) requests to expired (V1, internal)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest) {
  const internalKey = req.headers.get("x-internal-key");
  if (!process.env.REALTIME_INTERNAL_KEY || internalKey !== process.env.REALTIME_INTERNAL_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settingRes = await db.query(`SELECT setting_value FROM app_settings WHERE setting_key = $1`, [
      EXPIRY_HOURS_SETTING_KEY,
    ]);
    const expiryHours: Record<string, number> = settingRes.rows[0]?.setting_value ?? {};

    let expiredCount = 0;
    for (const [category, hours] of Object.entries(expiryHours)) {
      if (!Number.isFinite(hours) || hours <= 0) continue;

      const result = await db.query(
        `UPDATE express_vet_requests
         SET status = 'expired'
         WHERE status = 'pending_dispatch'
           AND category = $1
           AND created_at < now() - ($2 || ' hours')::interval
         RETURNING request_id, client_user_id, coupon_id`,
        [category, hours]
      );

      // Expired without ever being dispatched — give any printed coupon back (PALTU-131).
      await Promise.allSettled(
        result.rows
          .filter((row: { coupon_id: string | null }) => row.coupon_id)
          .map((row: { request_id: string }) => releaseCouponForRequest(row.request_id))
      );

      const categoryLabel = EXPRESS_VET_CATEGORY_LABELS[category] ?? category;
      await Promise.allSettled(
        result.rows.map((row: { request_id: string; client_user_id: number }) =>
          ExpressVetNotifications.onRequestExpired(row.client_user_id, row.request_id, categoryLabel)
        )
      );
      await Promise.allSettled(
        result.rows.map((row: { request_id: string }) => notifyVetRequestUpdate({ request_id: row.request_id, category }, "expired"))
      );

      expiredCount += result.rowCount ?? 0;
    }

    return NextResponse.json({ expired_count: expiredCount });
  } catch (error) {
    console.error("express-vet cron/expire POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
