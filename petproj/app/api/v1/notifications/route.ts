import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { NotificationService } from "@/lib/notifications/NotificationService";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Fetch current user notifications with pagination
 *     tags: [v1 Communications]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, social, adoptions, orders]
 *           default: all
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Mark notifications as read
 *     tags: [v1 Communications]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - properties:
 *                   notification_id:
 *                     type: integer
 *               - properties:
 *                   mark_all_read:
 *                     type: boolean
 *               - properties:
 *                   filter:
 *                     type: string
 *                     enum: [social, adoptions, orders]
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a notification
 *     tags: [v1 Communications]
 *     parameters:
 *       - in: query
 *         name: notification_id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Notification deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */

/**
 * GET /api/v1/notifications
 * Fetch notifications with pagination and filtering
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
    const cursor = Math.max(0, parseInt(searchParams.get("cursor") || "0", 10));
    const filter = searchParams.get("filter") || "all";

    const { notifications, unreadCount, nextCursor } = await NotificationService.fetchNotifications(
      parseInt(userId),
      limit,
      cursor,
      filter
    );

    return NextResponse.json({
      notifications,
      unread_count: unreadCount,
      next_cursor: nextCursor,
    });
  } catch (error) {
    console.error("❌ Notifications GET Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch notifications",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/notifications
 * Mark notifications as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notification_id, mark_all_read, filter } = body;

    const updatedCount = await NotificationService.markRead(parseInt(userId), {
      notificationId: notification_id,
      markAllRead: mark_all_read,
      filter,
    });

    return NextResponse.json({
      success: true,
      updated_count: updatedCount,
    });
  } catch (error) {
    console.error("❌ Notifications PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/notifications
 * Delete a notification
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = parseInt(searchParams.get("notification_id") || "0", 10);

    if (!notificationId) {
      return NextResponse.json({ error: "notification_id is required" }, { status: 400 });
    }

    const success = await NotificationService.deleteNotification(parseInt(userId), notificationId);

    if (!success) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Notifications DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
