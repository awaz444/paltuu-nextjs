/**
 * NotificationService
 * Central service for creating, sending, and managing notifications
 * Handles both database writes and Firebase FCM pushes
 */

import { db } from "@/db/index";
import { checkIsBlocked } from "@/lib/moderation";
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
  commentId?: number | null;
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
  target_comment_id: number | null;
  deep_link: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

const MAX_CHUNK_CONCURRENCY = 5;
const EXPO_CHUNK_SIZE = 100;
const FCM_CHUNK_SIZE = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency).map((task) => task());
    results.push(...(await Promise.all(batch)));
  }
  return results;
}

export class NotificationService {
  /**
   * Split raw device tokens into Expo push tokens vs native FCM tokens
   */
  private static classifyTokens(tokens: string[]): { expoTokens: string[]; fcmTokens: string[] } {
    const expoTokens = tokens.filter((t) => t.startsWith("ExponentPushToken") || t.startsWith("ExpoPushToken"));
    const fcmTokens = tokens.filter((t) => !t.startsWith("ExponentPushToken") && !t.startsWith("ExpoPushToken"));
    return { expoTokens, fcmTokens };
  }

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

      // 1.5. Validate block
      if (params.senderId && params.userId) {
        const isBlocked = await checkIsBlocked(params.userId, params.senderId);
        if (isBlocked) {
          console.log(`⚠️ Skipping blocked notification: sender=${params.senderId} user=${params.userId}`);
          return null;
        }
      }

      // 2. Get notification template
      const template = getNotificationTemplate(params.type, params.customData || {});

      // 3. Build deep link
      const deepLink = buildDeepLink(params.type, {
        entity_id: params.entityId,
        sender_id: params.senderId,
        comment_id: params.commentId,
        ...params.customData,
      });

      // 4. Insert into database
      const notificationResult = await db.query(
        `
        INSERT INTO notifications (
          user_id, sender_id, title, body, type, entity_type, entity_id,
          target_comment_id, deep_link, image_url, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW())
        RETURNING
          notification_id, user_id, sender_id, title, body, type,
          entity_type, entity_id, target_comment_id, deep_link, image_url, is_read, created_at
        `,
        [
          params.userId ?? null,
          params.senderId ?? null,
          template.title,
          template.body,
          params.type,
          params.entityType ?? null,
          params.entityId ?? null,
          params.commentId ?? null,
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
   * Send push notification to all devices of a user
   * Automatically routes Expo Push Tokens to Expo Push API, and FCM tokens to Firebase
   */
  private static async sendPushToUser(
    userId: number,
    notification: NotificationRow,
    template: ReturnType<typeof getNotificationTemplate>
  ): Promise<void> {
    try {
      // 1. Fetch all tokens for user
      const devicesResult = await db.query(
        `SELECT fcm_token FROM user_devices WHERE user_id = $1`,
        [userId]
      );

      const tokens = devicesResult.rows.map((row: any) => row.fcm_token);

      if (tokens.length === 0) {
        console.log(`ℹ️ No devices registered for user ${userId}`);
        return;
      }

      // 2. Get unread count for badge. Must go through getUnreadCount so the
      // app icon badge matches the bell badge in-app exactly — a raw COUNT here
      // would include notifications from blocked users, which getUnreadCount
      // (and therefore the notifications screen) filters out.
      const unreadCount = await this.getUnreadCount(userId);

      // Separate Expo push tokens from raw FCM tokens
      const { expoTokens, fcmTokens } = this.classifyTokens(tokens);

      // 3. Send via Expo Push API if there are Expo tokens
      if (expoTokens.length > 0) {
        const expoPayload = expoTokens.map((token: string) => ({
          to: token,
          sound: "default",
          title: template.title,
          body: template.body,
          badge: unreadCount,
          ...(notification.image_url && {
            mutableContent: true,
            richContent: { image: notification.image_url },
          }),
          data: {
            notification_id: String(notification.notification_id),
            type: notification.type,
            deep_link: notification.deep_link || "",
            entity_id: String(notification.entity_id || ""),
            entity_type: notification.entity_type || "",
          },
        }));

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (process.env.EXPO_ACCESS_TOKEN) {
          headers["Authorization"] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
        }

        try {
          const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers,
            body: JSON.stringify(expoPayload),
          });

          const expoData = await expoResponse.json() as any;
          console.log(`✅ Expo push sent to ${expoTokens.length} devices for user ${userId}`);

          // Cleanup invalid Expo tokens
          if (expoData?.data && Array.isArray(expoData.data)) {
            const invalidTokens: string[] = [];
            expoData.data.forEach((receipt: any, idx: number) => {
              if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
                if (expoTokens[idx]) {
                  invalidTokens.push(expoTokens[idx]);
                }
              }
            });

            if (invalidTokens.length > 0) {
              await db.query(
                `DELETE FROM user_devices WHERE fcm_token = ANY($1)`,
                [invalidTokens]
              );
              console.log(`🗑️ Deleted ${invalidTokens.length} invalid Expo tokens`);
            }
          }
        } catch (expoErr) {
          console.error("❌ Failed to send via Expo Push API:", expoErr);
        }
      }

      // 4. Send via Firebase FCM if there are native FCM tokens
      if (fcmTokens.length > 0) {
        const messaging = getMessaging();
        if (!messaging) {
          console.log(`ℹ️ FCM push skipped for user ${userId}: Firebase is not configured`);
          return;
        }

        const fcmPayload = {
          tokens: fcmTokens,
          notification: {
            title: template.title.substring(0, 255),
            body: template.body.substring(0, 255),
            ...(notification.image_url && { imageUrl: notification.image_url }),
          },
          data: {
            notification_id: String(notification.notification_id),
            type: notification.type,
            deep_link: notification.deep_link || "",
            entity_id: String(notification.entity_id || ""),
            entity_type: notification.entity_type || "",
          },
          apns: {
            payload: {
              aps: {
                badge: unreadCount,
                sound: "default",
                ...(notification.image_url && { "mutable-content": 1 }),
              },
            },
          },
          android: {
            priority: "high" as const,
            notification: {
              sound: "default",
              channel_id: "default",
            },
          },
        };

        const response = await messaging.sendEachForMulticast({
          tokens: fcmTokens,
          notification: fcmPayload.notification,
          data: fcmPayload.data as Record<string, string>,
          apns: fcmPayload.apns as any,
          android: fcmPayload.android as any,
        } as any);

        console.log(`✅ FCM push sent to ${response.successCount}/${fcmTokens.length} devices for user ${userId}`);

        // Delete invalid FCM tokens
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success && fcmTokens[idx]) {
              const errorCode = (resp.error as any)?.code;
              if (
                errorCode === "messaging/invalid-registration-token" ||
                errorCode === "messaging/registration-token-not-registered"
              ) {
                failedTokens.push(fcmTokens[idx]);
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
      }
    } catch (error) {
      console.error("❌ Failed to send push notification:", error);
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
          AND (n.sender_id IS NULL OR NOT EXISTS (
              SELECT 1 FROM user_blocks b 
              WHERE (b.blocker_id = $1 AND b.blocked_id = n.sender_id)
                 OR (b.blocker_id = n.sender_id AND b.blocked_id = $1)
          ))
        ORDER BY n.created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, limit + 1, cursor]
      );

      const rows = result.rows;
      const hasMore = rows.length > limit;
      const notifications = rows.slice(0, limit).map((row: any) => ({
        notification_id: row.notification_id,
        type: row.type || row.notification_type || 'system_broadcast',
        title: row.title || (row.notification_type === 'new_listing' ? 'New Listing' : 'Notification'),
        body: row.body || row.notification_content || '',
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        entity_comment_id: row.target_comment_id,
        deep_link: row.deep_link,
        image_url: row.image_url,
        is_read: row.is_read,
        created_at: row.created_at,
        date_sent: row.created_at,
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
        `SELECT COUNT(*) as count FROM notifications n WHERE n.user_id = $1 AND n.is_read = false
          AND (n.sender_id IS NULL OR NOT EXISTS (
              SELECT 1 FROM user_blocks b 
              WHERE (b.blocker_id = $1 AND b.blocked_id = n.sender_id)
                 OR (b.blocker_id = n.sender_id AND b.blocked_id = $1)
          ))`,
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
        SET user_id = $1, updated_at = NOW(), device_platform = $3
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
      if (!messaging) {
        console.log(`ℹ️ FCM topic notification skipped for topic '${topic}': Firebase is not configured`);
        return false;
      }

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
            channel_id: "default",
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

  /**
   * Broadcast a custom notification to every user: bulk-inserts one DB row per
   * user and fans out pushes in batched Expo/FCM calls (not one HTTP call per user).
   */
  static async broadcastToAllUsers(params: {
    senderId: number;
    title: string;
    body: string;
    deepLink?: string;
    imageUrl?: string;
  }): Promise<{
    recipientCount: number;
    insertedCount: number;
    pushSuccessCount: number;
    pushFailureCount: number;
  }> {
    const { senderId, title, body, deepLink, imageUrl } = params;
    console.log(`📣 Broadcast triggered by admin user ${senderId}: "${title}"`);

    const usersResult = await db.query(`SELECT user_id FROM users`);
    const userIds: number[] = usersResult.rows.map((row: any) => row.user_id);

    if (userIds.length === 0) {
      return { recipientCount: 0, insertedCount: 0, pushSuccessCount: 0, pushFailureCount: 0 };
    }

    // 1. Bulk-insert one notification row per user.
    // sender_id is intentionally left NULL: this is a message "from Paltuu", not from the
    // admin's personal account, so the recipient's client shouldn't render the admin's name/photo
    // as the sender. Who triggered the send is already tracked in notification_campaigns.sent_by.
    const insertResult = await db.query(
      `
      INSERT INTO notifications (
        user_id, sender_id, title, body, type, deep_link, image_url, is_read, created_at
      )
      SELECT uid, NULL, $1, $2, 'system_admin_broadcast', $3, $4, false, NOW()
      FROM unnest($5::int[]) AS uid
      `,
      [title.substring(0, 255), body, deepLink || null, imageUrl || null, userIds]
    );
    const insertedCount = insertResult.rowCount || 0;

    // 2. Fetch all device tokens for the target users in one query
    const devicesResult = await db.query(
      `SELECT user_id, fcm_token FROM user_devices WHERE user_id = ANY($1)`,
      [userIds]
    );
    const tokens: string[] = devicesResult.rows.map((row: any) => row.fcm_token);
    const { expoTokens, fcmTokens } = this.classifyTokens(tokens);

    // 2a. Per-user unread counts for the app icon badge. Same block-aware
    // definition as getUnreadCount so the icon matches the in-app bell; done as
    // one grouped query rather than per user. Rows inserted in step 1 are
    // already unread, so this includes this broadcast.
    const unreadResult = await db.query(
      `
      SELECT n.user_id, COUNT(*)::int AS count
      FROM notifications n
      WHERE n.user_id = ANY($1) AND n.is_read = false
        AND (n.sender_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM user_blocks b
            WHERE (b.blocker_id = n.user_id AND b.blocked_id = n.sender_id)
               OR (b.blocker_id = n.sender_id AND b.blocked_id = n.user_id)
        ))
      GROUP BY n.user_id
      `,
      [userIds]
    );
    const unreadByUser = new Map<number, number>(
      unreadResult.rows.map((row: any): [number, number] => [row.user_id, row.count])
    );
    const badgeByToken = new Map<string, number>(
      devicesResult.rows.map((row: any): [string, number] => [
        row.fcm_token,
        unreadByUser.get(row.user_id) ?? 0,
      ])
    );

    let pushSuccessCount = 0;
    let pushFailureCount = 0;
    const invalidTokens: string[] = [];

    // 3. Batched Expo push sends (≤100 tokens per request)
    if (expoTokens.length > 0) {
      const expoChunks = chunk(expoTokens, EXPO_CHUNK_SIZE);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.EXPO_ACCESS_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
      }

      await runWithConcurrency(
        expoChunks.map((tokenChunk) => async () => {
          try {
            const payload = tokenChunk.map((token) => ({
              to: token,
              sound: "default",
              title: title.substring(0, 255),
              body,
              badge: badgeByToken.get(token) ?? 0,
              data: {
                type: "system_admin_broadcast",
                deep_link: deepLink || "",
              },
            }));

            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers,
              body: JSON.stringify(payload),
            });
            const data = (await response.json()) as any;

            if (data?.data && Array.isArray(data.data)) {
              data.data.forEach((receipt: any, idx: number) => {
                if (receipt.status === "error") {
                  pushFailureCount++;
                  if (receipt.details?.error === "DeviceNotRegistered" && tokenChunk[idx]) {
                    invalidTokens.push(tokenChunk[idx]);
                  }
                } else {
                  pushSuccessCount++;
                }
              });
            } else {
              pushSuccessCount += tokenChunk.length;
            }
          } catch (err) {
            console.error("❌ Failed to send Expo push chunk in broadcast:", err);
            pushFailureCount += tokenChunk.length;
          }
        }),
        MAX_CHUNK_CONCURRENCY
      );

      console.log(`✅ Broadcast Expo push sent to ~${expoTokens.length} devices across ${expoChunks.length} chunk(s)`);
    }

    // 4. Batched FCM push sends (≤500 tokens per request)
    if (fcmTokens.length > 0) {
      const messaging = getMessaging();
      if (!messaging) {
        console.log(`ℹ️ FCM broadcast skipped: Firebase is not configured`);
        pushFailureCount += fcmTokens.length;
      } else {
        // A multicast shares one payload across its whole token list, but the
        // badge differs per recipient — so group tokens by their user's unread
        // count and send one multicast per distinct count, each still chunked
        // to the 500-token API limit. Distinct counts are few in practice, so
        // this stays far closer to one call per 500 devices than per device.
        const tokensByBadge = new Map<number, string[]>();
        for (const token of fcmTokens) {
          const badge = badgeByToken.get(token) ?? 0;
          const group = tokensByBadge.get(badge);
          if (group) {
            group.push(token);
          } else {
            tokensByBadge.set(badge, [token]);
          }
        }

        const fcmChunks: { badge: number; tokens: string[] }[] = [];
        for (const [badge, groupTokens] of tokensByBadge) {
          for (const tokenChunk of chunk(groupTokens, FCM_CHUNK_SIZE)) {
            fcmChunks.push({ badge, tokens: tokenChunk });
          }
        }

        await runWithConcurrency(
          fcmChunks.map(({ badge, tokens: tokenChunk }) => async () => {
            try {
              const response = await messaging.sendEachForMulticast({
                tokens: tokenChunk,
                notification: {
                  title: title.substring(0, 255),
                  body: body.substring(0, 255),
                },
                data: {
                  type: "system_admin_broadcast",
                  deep_link: deepLink || "",
                },
                apns: { payload: { aps: { sound: "default", badge } } },
                android: {
                  priority: "high" as const,
                  notification: { sound: "default", channel_id: "default" },
                },
              } as any);

              pushSuccessCount += response.successCount;
              pushFailureCount += response.failureCount;

              response.responses.forEach((resp: any, idx: number) => {
                if (!resp.success && tokenChunk[idx]) {
                  const errorCode = (resp.error as any)?.code;
                  if (
                    errorCode === "messaging/invalid-registration-token" ||
                    errorCode === "messaging/registration-token-not-registered"
                  ) {
                    invalidTokens.push(tokenChunk[idx]);
                  }
                }
              });
            } catch (err) {
              console.error("❌ Failed to send FCM push chunk in broadcast:", err);
              pushFailureCount += tokenChunk.length;
            }
          }),
          MAX_CHUNK_CONCURRENCY
        );

        console.log(`✅ Broadcast FCM push sent across ${fcmChunks.length} chunk(s)`);
      }
    }

    // 5. Clean up invalid/unregistered tokens
    if (invalidTokens.length > 0) {
      await db.query(`DELETE FROM user_devices WHERE fcm_token = ANY($1)`, [invalidTokens]);
      console.log(`🗑️ Deleted ${invalidTokens.length} invalid tokens after broadcast`);
    }

    return {
      recipientCount: userIds.length,
      insertedCount,
      pushSuccessCount,
      pushFailureCount,
    };
  }
}
