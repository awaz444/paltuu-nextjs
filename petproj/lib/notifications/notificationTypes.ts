/**
 * Paltuu Notification Types and Templates
 * Every notification must have one of these types
 */

export enum NotificationType {
  // Social
  SOCIAL_POST_LIKE = "social_post_like",
  SOCIAL_POST_COMMENT = "social_post_comment",
  SOCIAL_COMMENT_REPLY = "social_comment_reply",
  SOCIAL_COMMENT_LIKE = "social_comment_like",
  SOCIAL_NEW_FOLLOWER = "social_new_follower",
  SOCIAL_MENTION_POST = "social_mention_post",
  SOCIAL_MENTION_COMMENT = "social_mention_comment",
  SOCIAL_REPOST = "social_repost",

  // Adoptions
  ADOPTION_NEW_APPLICATION = "adoption_new_application",
  ADOPTION_APPLICATION_APPROVED = "adoption_application_approved",
  ADOPTION_APPLICATION_REJECTED = "adoption_application_rejected",
  ADOPTION_NEW_LISTING_MATCH = "adoption_new_listing_match",

  // Bazaar
  BAZAAR_ORDER_CONFIRMED = "bazaar_order_confirmed",
  BAZAAR_ORDER_SHIPPED = "bazaar_order_shipped",
  BAZAAR_ORDER_DELIVERED = "bazaar_order_delivered",
  BAZAAR_PAYMENT_VERIFIED = "bazaar_payment_verified",
  BAZAAR_NEW_VENDOR_ORDER = "bazaar_new_vendor_order",
  BAZAAR_ABANDONED_CART = "bazaar_abandoned_cart",

  // Pet Care
  PETCARE_REVIEW_APPROVED = "petcare_review_approved",
  PETCARE_VET_VERIFIED = "petcare_vet_verified",

  // System
  SYSTEM_BROADCAST = "system_broadcast",
  SYSTEM_PLATFORM_UPDATE = "system_platform_update",
  SYSTEM_LOST_FOUND_MATCH = "system_lost_found_match",
}

export enum EntityType {
  SOCIAL_POST = "social_posts",
  SOCIAL_COMMENT = "social_comments",
  ADOPTION_APPLICATION = "adoption_applications",
  ADOPTION_PET = "pets",
  BAZAAR_ORDER = "bazaar_orders",
  BAZAAR_PRODUCT = "bazaar_products",
  CLINIC = "clinics",
  VET = "vets",
  LOST_FOUND = "lost_and_found_posts",
}

interface NotificationTemplate {
  type: NotificationType;
  title: string | ((data: Record<string, any>) => string);
  body: string | ((data: Record<string, any>) => string);
  deepLinkPattern: string;
  icon?: string;
}

const TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  // ──── Social ──────────────────────────────────────────────────────────
  [NotificationType.SOCIAL_POST_LIKE]: {
    type: NotificationType.SOCIAL_POST_LIKE,
    title: (data) => data.sender_name || "Someone",
    body: "pawed your post",
    deepLinkPattern: "paltuu://social/post/{entity_id}",
  },
  [NotificationType.SOCIAL_POST_COMMENT]: {
    type: NotificationType.SOCIAL_POST_COMMENT,
    title: (data) => data.sender_name || "Someone",
    body: (data) => `commented: "${data.preview || ''}"`,
    deepLinkPattern: "paltuu://social/post/{entity_id}",
  },
  [NotificationType.SOCIAL_COMMENT_REPLY]: {
    type: NotificationType.SOCIAL_COMMENT_REPLY,
    title: (data) => data.sender_name || "Someone",
    body: "replied to your comment",
    deepLinkPattern: "paltuu://social/post/{entity_id}",
  },
  [NotificationType.SOCIAL_COMMENT_LIKE]: {
    type: NotificationType.SOCIAL_COMMENT_LIKE,
    title: (data) => data.sender_name || "Someone",
    body: "pawed your comment",
    deepLinkPattern: "paltuu://social/post/{entity_id}",
  },
  [NotificationType.SOCIAL_NEW_FOLLOWER]: {
    type: NotificationType.SOCIAL_NEW_FOLLOWER,
    title: (data) => data.sender_name || "Someone",
    body: "started following you",
    deepLinkPattern: "paltuu://profile/{sender_id}",
  },
  [NotificationType.SOCIAL_MENTION_POST]: {
    type: NotificationType.SOCIAL_MENTION_POST,
    title: (data) => data.sender_name || "Someone",
    body: "mentioned you in a post",
    deepLinkPattern: "paltuu://social/post/{entity_id}",
  },
  [NotificationType.SOCIAL_MENTION_COMMENT]: {
    type: NotificationType.SOCIAL_MENTION_COMMENT,
    title: (data) => data.sender_name || "Someone",
    body: "mentioned you in a comment",
    deepLinkPattern: "paltuu://social/post/{entity_id}",
  },
  [NotificationType.SOCIAL_REPOST]: {
    type: NotificationType.SOCIAL_REPOST,
    title: (data) => data.sender_name || "Someone",
    body: "reposted your post",
    deepLinkPattern: "paltuu://social/post/{entity_id}",
  },

  // ──── Adoptions ───────────────────────────────────────────────────────
  [NotificationType.ADOPTION_NEW_APPLICATION]: {
    type: NotificationType.ADOPTION_NEW_APPLICATION,
    title: "New Application",
    body: (data) => `${data.sender_name || 'Someone'} applied to adopt ${data.pet_name || 'a pet'}`,
    deepLinkPattern: "paltuu://adoptions/applications/{entity_id}",
  },
  [NotificationType.ADOPTION_APPLICATION_APPROVED]: {
    type: NotificationType.ADOPTION_APPLICATION_APPROVED,
    title: "Application Approved 🎉",
    body: (data) => `Your application for ${data.pet_name || 'the pet'} was approved!`,
    deepLinkPattern: "paltuu://adoptions/applications/{entity_id}",
  },
  [NotificationType.ADOPTION_APPLICATION_REJECTED]: {
    type: NotificationType.ADOPTION_APPLICATION_REJECTED,
    title: "Application Status Update",
    body: (data) => `Your application for ${data.pet_name || 'the pet'} was not approved`,
    deepLinkPattern: "paltuu://adoptions/applications/{entity_id}",
  },
  [NotificationType.ADOPTION_NEW_LISTING_MATCH]: {
    type: NotificationType.ADOPTION_NEW_LISTING_MATCH,
    title: "New Match Found",
    body: "A new rescue matching your preferences was listed",
    deepLinkPattern: "paltuu://adoptions/{entity_id}",
  },

  // ──── Bazaar ──────────────────────────────────────────────────────────
  [NotificationType.BAZAAR_ORDER_CONFIRMED]: {
    type: NotificationType.BAZAAR_ORDER_CONFIRMED,
    title: "Order Confirmed",
    body: (data) => `Order #${data.entity_id || 'your'} confirmed`,
    deepLinkPattern: "paltuu://bazaar/orders/{entity_id}",
  },
  [NotificationType.BAZAAR_ORDER_SHIPPED]: {
    type: NotificationType.BAZAAR_ORDER_SHIPPED,
    title: "Order Shipped",
    body: "Your order is on the way!",
    deepLinkPattern: "paltuu://bazaar/orders/{entity_id}",
  },
  [NotificationType.BAZAAR_ORDER_DELIVERED]: {
    type: NotificationType.BAZAAR_ORDER_DELIVERED,
    title: "Order Delivered",
    body: "Your order has been delivered",
    deepLinkPattern: "paltuu://bazaar/orders/{entity_id}",
  },
  [NotificationType.BAZAAR_PAYMENT_VERIFIED]: {
    type: NotificationType.BAZAAR_PAYMENT_VERIFIED,
    title: "Payment Verified",
    body: (data) => `Payment verified for order #${data.entity_id || 'your'}`,
    deepLinkPattern: "paltuu://bazaar/orders/{entity_id}",
  },
  [NotificationType.BAZAAR_NEW_VENDOR_ORDER]: {
    type: NotificationType.BAZAAR_NEW_VENDOR_ORDER,
    title: "New Order",
    body: "You received a new order for your shop",
    deepLinkPattern: "paltuu://bazaar/vendor/orders/{entity_id}",
  },
  [NotificationType.BAZAAR_ABANDONED_CART]: {
    type: NotificationType.BAZAAR_ABANDONED_CART,
    title: "Your Cart",
    body: "You left some items behind!",
    deepLinkPattern: "paltuu://bazaar/cart",
  },

  // ──── Pet Care ────────────────────────────────────────────────────────
  [NotificationType.PETCARE_REVIEW_APPROVED]: {
    type: NotificationType.PETCARE_REVIEW_APPROVED,
    title: "Review Published",
    body: (data) => `Your review for ${data.clinic_name || 'the clinic'} is live`,
    deepLinkPattern: "paltuu://petcare/{entity_id}",
  },
  [NotificationType.PETCARE_VET_VERIFIED]: {
    type: NotificationType.PETCARE_VET_VERIFIED,
    title: "Credentials Verified",
    body: "Your credentials are verified. You're live on the panel!",
    deepLinkPattern: "paltuu://vet-panel",
  },

  // ──── System ──────────────────────────────────────────────────────────
  [NotificationType.SYSTEM_BROADCAST]: {
    type: NotificationType.SYSTEM_BROADCAST,
    title: "Paltuu Update",
    body: "Check out what's new",
    deepLinkPattern: "paltuu://home",
  },
  [NotificationType.SYSTEM_PLATFORM_UPDATE]: {
    type: NotificationType.SYSTEM_PLATFORM_UPDATE,
    title: "Platform Update",
    body: "Paltuu just got better! See what's new",
    deepLinkPattern: "paltuu://home",
  },
  [NotificationType.SYSTEM_LOST_FOUND_MATCH]: {
    type: NotificationType.SYSTEM_LOST_FOUND_MATCH,
    title: "Possible Match Found",
    body: (data) => `Possible match for ${data.pet_name || 'your pet'} near ${data.area || 'your area'}`,
    deepLinkPattern: "paltuu://lost-found/{entity_id}",
  },
};

/**
 * Get notification template and render title/body with data
 */
export function getNotificationTemplate(
  type: NotificationType,
  data: Record<string, any> = {}
) {
  const template = TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const title = typeof template.title === "function" ? template.title(data) : template.title;
  const body = typeof template.body === "function" ? template.body(data) : template.body;
  const deepLink = template.deepLinkPattern.replace(
    /{(\w+)}/g,
    (match, key) => String(data[key] || "")
  );

  return {
    title,
    body,
    deepLink,
    type,
  };
}

/**
 * Build deep link from pattern and entity data
 */
export function buildDeepLink(
  type: NotificationType,
  entityData: Record<string, any>
): string {
  const template = TEMPLATES[type];
  if (!template) return "";

  return template.deepLinkPattern.replace(
    /{(\w+)}/g,
    (match, key) => String(entityData[key] || "")
  );
}
