import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { NotificationService } from "@/lib/notifications/NotificationService";

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count (for bell badge)
 *     tags: [v1 Communications]
 *     responses:
 *       200:
 *         description: Unread count retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadCount = await NotificationService.getUnreadCount(parseInt(userId));

    return NextResponse.json({
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error("❌ Unread count error:", error);
    return NextResponse.json(
      {
        error: "Failed to get unread count",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
