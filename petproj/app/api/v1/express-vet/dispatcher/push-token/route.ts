import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/push-token:
 *   post:
 *     summary: Register a dispatcher's ringing-call push token (VoIP on iOS, raw FCM on Android) for Vets at Home (Express Vet) (V1)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const platform: string | undefined = body?.platform;
    const voipToken: string | undefined = body?.voip_token;
    const fcmToken: string | undefined = body?.fcm_token;
    // Which build registered this token — dev/preview/production have different bundle
    // ids, and the APNs VoIP topic is derived from it (see lib/expressVet/apnsVoipClient).
    const bundleId: string | undefined =
      typeof body?.bundle_id === "string" && body.bundle_id.trim() ? body.bundle_id.trim() : undefined;

    if (platform !== "ios" && platform !== "android") {
      return NextResponse.json({ error: "platform must be 'ios' or 'android'" }, { status: 400 });
    }
    if (platform === "ios" && !voipToken) {
      return NextResponse.json({ error: "voip_token is required for platform 'ios'" }, { status: 400 });
    }
    if (platform === "android" && !fcmToken) {
      return NextResponse.json({ error: "fcm_token is required for platform 'android'" }, { status: 400 });
    }

    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

    const result = await db.query(
      `INSERT INTO express_vet_dispatcher_status (dispatcher_id, push_platform, voip_push_token, fcm_push_token, bundle_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (dispatcher_id) DO UPDATE
         SET push_platform = EXCLUDED.push_platform,
             voip_push_token = EXCLUDED.voip_push_token,
             fcm_push_token = EXCLUDED.fcm_push_token,
             -- COALESCE so an older client that doesn't send bundle_id doesn't wipe a
             -- value a newer one already recorded.
             bundle_id = COALESCE(EXCLUDED.bundle_id, express_vet_dispatcher_status.bundle_id),
             updated_at = now()
       RETURNING *`,
      [dispatcherId, platform, voipToken ?? null, fcmToken ?? null, bundleId ?? null]
    );

    return NextResponse.json({ status: result.rows[0] });
  } catch (error) {
    console.error("express-vet dispatcher/push-token POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
