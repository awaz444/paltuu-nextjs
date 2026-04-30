/**
 * Notifications Module
 * Central export for all notification-related utilities
 */

export { NotificationService } from "./NotificationService";
export {
  NotificationType,
  EntityType,
  getNotificationTemplate,
  buildDeepLink,
} from "./notificationTypes";
export {
  SocialNotifications,
  AdoptionNotifications,
  BazaarNotifications,
  PetCareNotifications,
  SystemNotifications,
} from "./notificationTriggers";
export { initializeFirebase, getMessaging, getFirebaseAdmin } from "./firebase";
