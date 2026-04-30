/**
 * NotificationService
 * Central service for creating, sending, and managing notifications
 * Handles both database writes and Firebase FCM pushes
 */

import { db } from "@/db/index";
import { getMessaging } from "./firebase";
import {
  NotificationType,
  EntityType,
  getNotificationTemplate,
  buildDeepLink,
} from "./notificationTypes";

interface CreateNotificationParams {
  userId?: number | null; // Nullable for global broadcasts
  senderId?: number | null;
  type: NotificationType;
  entityType?: EntityType | string;
  entityId?: number | null;
  imageUrl?: string;
  customData?: Record<string, any>;
}

interface NotificationRow {
  notification_id: number;
  user_id: number | null;
  sender_id: number | null;
  title: string;
  body: string;
  type: string;
  entity_type: string | null;
  entity_id: number | null;
  deep_link: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export class NotificationService {
  /**
   * Create a notification in DB and send FCM push to user's devices
   */
  static async createAndSend(params: CreateNotificationParams): Promise<NotificationRow | null> {
    try {
      // 1. Validate: Never notify yourself
      if (params.senderId && params.userId && params.senderId === params.userId) {
        console.log(
          `⚠️ Skipping self-notification: sender=${params.senderId} user=${params.userId}`
        );
        return null;
      }

      // 2. Get notification template
      const template = getNotificationTemplate(params.type, params.customData || {});

      // 3. Build deep link
      const deepLink = buildDeepLink(params.type, {
        entity_id: params.entityId,
        sender_id: params.senderId,
        ...params.customData,
      });

      // 4. Insert into database
      const notificationResult = await db.query(
        `
        INSERT INTO notifications (
          user_id, sender_id, title, body, type, entity_type, entity_id,
          deep_link, image_url, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW())
        RETURNING
          notification_id, user_id, sender_id, title, body, type,
          entity_type, entity_id, deep_link, image_url, is_read, created_at
        `,
        [
          params.userId ?? null,
          params.senderId ?? null,
          template.title,
          template.body,
          params.type,
          params.entityType ?? null,
          params.entityId ?? null,
          deepLink || null,
          params.imageUrl ?? null,
        ]
      );

      if (notificationResult.rowCount === 0) {
        throw new Error("Failed to insert notification");
      }

      const notification = notificationResult.rows[0] as NotificationRow;

      // 5. Send FCM push (only if userId is set)
      if (params.userId) {
        await this.sendPushToUser(params.userId, notification, template);
      }

      return notification;
    } catch (error) {
      console.error("❌ Failed to create notification:", error);
      // Don't throw - log but continue so one failure doesn't break the flow
      return null;
    }
  }

  /**
   * Send FCM push to all devices of a user
   */
  private static async sendPushToUser(
    userId: number,
    notification: NotificationRow,
    template: ReturnType<typeof getNotificationTemplate>
  ): Promise<void> {
    try {
      // 1. Fetch all FCM tokens for user
      const devicesResult = await db.query(
        `SELECT fcm_token FROM user_devices WHERE user_id = $1`,
        [userId]
      );

      const tokens = devicesResult.rows.map((row: any) => row.fcm_token);

      if (tokens.length === 0) {
        console.log(`ℹ️ No devices registered for user ${userId}`);
        return;
      }

      // 2. Get unread count for badge
      const unreadResult = await db.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      const unreadCount = parseInt(unreadResult.rows[0]?.count || "0", 10);

      // 3. Build FCM payload
      const messaging = getMessaging();
      const fcmPayload = {
        tokens,
        notification: {
          title: template.title.substring(0, 255),
          body: template.body.substring(0, 255),
        },
        data: {
          notification_id: String(notification.notification_id),
          type: notification.type,
          deep_link: template.deepLink || "",
          entity_id: String(notification.entity_id || ""),
          entity_type: notification.entity_type || "",
        },
        apns: {
          payload: {
            aps: {
              badge: unreadCount,
              sound: "default",
            },
          },
        },
        android: {
          priority: "high" as const,
          notification: {
            sound: "default",
            channel_id: "paltuu_default",
          },
        },
      };

      // 4. Send multicast message
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: fcmPayload.notification,
        data: fcmPayload.data as Record<string, string>,
        apns: fcmPayload.apns as any,
        android: fcmPayload.android as any,
      } as any);

      console.log(`✅ FCM push sent to ${response.successCount}/${tokens.length} devices for user ${userId}`);

      // 5. Delete invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && tokens[idx]) {
            const errorCode = (resp.error as any)?.code;
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered"
            ) {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await db.query(
            `DELETE FROM user_devices WHERE fcm_token = ANY($1)`,
            [failedTokens]
          );
          console.log(`🗑️ Deleted ${failedTokens.length} invalid FCM tokens`);
        }
      }
    } catch (error) {
      console.error("❌ Failed to send FCM push:", error);
    }
  }

  /**
   * Fetch notifications for a user with pagination
   */
  static async fetchNotifications(
    userId: number,
    limit: number = 20,
    cursor: number = 0,
    filter?: string
  ): Promise<{
    notifications: any[];
    unreadCount: number;
    nextCursor: number | null;
  }> {
    try {
      limit = Math.min(50, Math.max(1, limit));

      // Build filter condition
      let filterCondition = "";
      if (filter && filter !== "all") {
        const typeMap: Record<string, string> = {
          social: "social_%",
          adoptions: "adoption_%",
          orders: "bazaar_%",
        };
        const pattern = typeMap[filter];
        if (pattern) {
          filterCondition = `AND type LIKE '${pattern}'`;
        }
      }

      // Fetch notifications
      const result = await db.query(
        `
        SELECT
          n.*,
          u.name as sender_name,
          u.profile_image_url as sender_image,
          u.user_id as sender_user_id
        FROM notifications n
        LEFT JOIN users u ON u.user_id = n.sender_id
        WHERE n.user_id = $1 ${filterCondition}
        ORDER BY n.created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, limit + 1, cursor]
      );

      const rows = result.rows;
      const hasMore = rows.length > limit;
      const notifications = rows.slice(0, limit).map((row: any) => ({
        notification_id: row.notification_id,
        type: row.type,
        title: row.title,
        body: row.body,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        deep_link: row.deep_link,
        image_url: row.image_url,
        is_read: row.is_read,
        created_at: row.created_at,
        sender: row.sender_user_id
          ? {
              user_id: row.sender_user_id,
              name: row.sender_name,
              profile_image_url: row.sender_image,
            }
          : null,
      }));

      // Get unread count
      const unreadResult = await db.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      const unreadCount = parseInt(unreadResult.rows[0]?.count || "0", 10);

      return {
        notifications,
        unreadCount,
        nextCursor: hasMore ? cursor + limit : null,
      };
    } catch (error) {
      console.error("❌ Failed to fetch notifications:", error);
      return { notifications: [], unreadCount: 0, nextCursor: null };
    }
  }

  /**
   * Mark notifications as read
   */
  static async markRead(
    userId: number,
    params: {
      notificationId?: number;
      markAllRead?: boolean;
      filter?: string;
    }
  ): Promise<number> {
    try {
      let query: string;
      let queryParams: any[];

      if (params.markAllRead) {
        // Mark all notifications for user as read
        query = `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`;
        queryParams = [userId];
      } else if (params.filter) {
        // Mark by filter
        const typeMap: Record<string, string> = {
          social: "social_%",
          adoptions: "adoption_%",
          orders: "bazaar_%",
        };
        const pattern = typeMap[params.filter];
        if (!pattern) {
          return 0;
        }
        query = `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false AND type LIKE $2`;
        queryParams = [userId, pattern];
      } else if (params.notificationId) {
        // Mark single notification
        // Verify ownership first
        const check = await db.query(
          `SELECT user_id FROM notifications WHERE notification_id = $1`,
          [params.notificationId]
        );
        if (check.rowCount === 0 || check.rows[0].user_id !== userId) {
          return 0;
        }
        query = `UPDATE notifications SET is_read = true WHERE notification_id = $1 AND is_read = false`;
        queryParams = [params.notificationId];
      } else {
        return 0;
      }

      const result = await db.query(query, queryParams);
      return result.rowCount || 0;
    } catch (error) {
      console.error("❌ Failed to mark notifications as read:", error);
      return 0;
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: number): Promise<number> {
    try {
      const result = await db.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      return parseInt(result.rows[0]?.count || "0", 10);
    } catch (error) {
      console.error("❌ Failed to get unread count:", error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(userId: number, notificationId: number): Promise<boolean> {
    try {
      // Verify ownership
      const check = await db.query(
        `SELECT user_id FROM notifications WHERE notification_id = $1`,
        [notificationId]
      );
      if (check.rowCount === 0 || check.rows[0].user_id !== userId) {
        return false;
      }

      await db.query(`DELETE FROM notifications WHERE notification_id = $1`, [notificationId]);
      return true;
    } catch (error) {
      console.error("❌ Failed to delete notification:", error);
      return false;
    }
  }

  /**
   * Register device token for user
   */
  static async registerDevice(
    userId: number,
    fcmToken: string,
    platform: "ios" | "android"
  ): Promise<boolean> {
    try {
      // Upsert: update if exists, insert if not
      await db.query(
        `
        INSERT INTO user_devices (user_id, fcm_token, device_platform, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (fcm_token) DO UPDATE
        SET updated_at = NOW(), device_platform = $3
        `,
        [userId, fcmToken, platform]
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to register device:", error);
      return false;
    }
  }

  /**
   * Send notification to Firebase Topic (for broadcasts)
   * Does NOT create a DB row
   */
  static async sendTopicNotification(
    topic: string,
    title: string,
    body: string,
    deepLink?: string,
    imageUrl?: string
  ): Promise<boolean> {
    try {
      const messaging = getMessaging();

      const fcmPayload = {
        topic,
        notification: {
          title: title.substring(0, 255),
          body: body.substring(0, 255),
        },
        data: {
          type: "system_broadcast",
          deep_link: deepLink || "",
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
        android: {
          priority: "high" as const,
          notification: {
            sound: "default",
            channel_id: "paltuu_default",
          },
        },
      };

      const messageId = await messaging.send(fcmPayload as any);
      console.log(`✅ Topic notification sent to '${topic}': ${messageId}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to send topic notification:", error);
      return false;
    }
  }
}
