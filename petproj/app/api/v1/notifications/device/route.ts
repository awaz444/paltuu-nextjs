import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { NotificationService } from "@/lib/notifications/NotificationService";

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
