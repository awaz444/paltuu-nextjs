import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { NotificationService } from "@/lib/notifications/NotificationService";
import { db } from "@/db/index";

/**
 * @swagger
 * /api/v1/notifications/device:
 *   post:
 *     summary: Register or update device FCM token
 *     tags: [v1 Communications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcm_token:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *             required:
 *               - fcm_token
 *               - platform
 *     responses:
 *       200:
 *         description: Device registered successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fcm_token, platform } = await req.json();

    if (!fcm_token || !platform) {
      return NextResponse.json(
        { error: "fcm_token and platform are required" },
        { status: 400 }
      );
    }

    if (!["ios", "android"].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be 'ios' or 'android'" },
        { status: 400 }
      );
    }

    const success = await NotificationService.registerDevice(
      parseInt(userId),
      fcm_token,
      platform as "ios" | "android"
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to register device" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Device registration error:", error);
    return NextResponse.json(
      {
        error: "Failed to register device",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/notifications/device:
 *   delete:
 *     summary: Unregister this device's push token (call on logout)
 *     tags: [v1 Communications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcm_token:
 *                 type: string
 *             required:
 *               - fcm_token
 *     responses:
 *       200:
 *         description: Device unregistered successfully
 *       400:
 *         description: Missing fcm_token
 *       401:
 *         description: Unauthorized
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fcm_token } = await req.json();
    if (!fcm_token) {
      return NextResponse.json({ error: "fcm_token is required" }, { status: 400 });
    }

    await NotificationService.unregisterDevice(parseInt(userId), fcm_token);

    // Also clear this account's Vets at Home dispatcher ringing-call token (a separate
    // channel — see express_vet_dispatcher_status — keyed by dispatcher_id, not by device).
    // Without this, logging out of a dispatcher account on this device would leave it
    // receiving full-screen VoIP/CallKit incoming-job alerts for that account indefinitely,
    // regardless of which account is actually logged into the app now. Harmless no-op for a
    // non-dispatcher account (no row / already-null fields).
    await db.query(
      `UPDATE express_vet_dispatcher_status
       SET voip_push_token = NULL, fcm_push_token = NULL, push_platform = NULL, bundle_id = NULL
       WHERE dispatcher_id = $1`,
      [parseInt(userId)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Device unregistration error:", error);
    return NextResponse.json(
      {
        error: "Failed to unregister device",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
