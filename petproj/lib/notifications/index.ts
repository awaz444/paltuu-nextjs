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
  ExpressVetNotifications,
} from "./notificationTriggers";
export { initializeFirebase, getMessaging, getFirebaseAdmin } from "./firebase";
