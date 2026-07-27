/**
 * Notification Triggers
 * Helper functions for triggering notifications from different modules
 * Each module should call these when their respective events happen
 */

import { NotificationService } from "./NotificationService";
import {
  NotificationType,
  EntityType,
  getNotificationTemplate,
} from "./notificationTypes";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SOCIAL TRIGGERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const SocialNotifications = {
  /**
   * Someone liked a post
   * Call: SocialNotifications.onPostLiked(postAuthorId, likerId, postId, authorName)
   */
  async onPostLiked(
    postAuthorId: number,
    likerId: number,
    postId: number,
    likerName: string,
    authorImageUrl?: string,
    postImageUrl?: string,
    postCaption?: string
  ) {
    return NotificationService.createAndSend({
      userId: postAuthorId,
      senderId: likerId,
      type: NotificationType.SOCIAL_POST_LIKE,
      entityType: EntityType.SOCIAL_POST,
      entityId: postId,
      imageUrl: postImageUrl,
      customData: {
        sender_name: likerName,
        preview: postCaption,
      },
    });
  },

  /**
   * Someone commented on a post
   */
  async onPostCommented(
    postAuthorId: number,
    commenterId: number,
    postId: number,
    commenterName: string,
    commentPreview: string,
    postImageUrl?: string,
    commentId?: number
  ) {
    return NotificationService.createAndSend({
      userId: postAuthorId,
      senderId: commenterId,
      type: NotificationType.SOCIAL_POST_COMMENT,
      entityType: EntityType.SOCIAL_POST,
      entityId: postId,
      commentId,
      imageUrl: postImageUrl,
      customData: {
        sender_name: commenterName,
        preview: commentPreview.substring(0, 100),
      },
    });
  },

  /**
   * Someone replied to a comment — the target is the recipient's own comment
   * (parentCommentId), so tapping the notification re-roots on "your comment"
   * with the new reply visible underneath, not on the reply itself.
   */
  async onCommentReplied(
    commentAuthorId: number,
    replierId: number,
    postId: number,
    replierName: string,
    replyPreview?: string,
    postImageUrl?: string,
    parentCommentId?: number
  ) {
    return NotificationService.createAndSend({
      userId: commentAuthorId,
      senderId: replierId,
      type: NotificationType.SOCIAL_COMMENT_REPLY,
      entityType: EntityType.SOCIAL_POST,
      entityId: postId,
      commentId: parentCommentId,
      imageUrl: postImageUrl,
      customData: {
        sender_name: replierName,
        preview: replyPreview?.substring(0, 100),
      },
    });
  },

  /**
   * Someone liked a comment
   */
  async onCommentLiked(
    commentAuthorId: number,
    likerId: number,
    postId: number,
    likerName: string,
    postImageUrl?: string,
    commentText?: string,
    commentId?: number
  ) {
    return NotificationService.createAndSend({
      userId: commentAuthorId,
      senderId: likerId,
      type: NotificationType.SOCIAL_COMMENT_LIKE,
      entityType: EntityType.SOCIAL_POST,
      entityId: postId,
      commentId,
      imageUrl: postImageUrl,
      customData: {
        sender_name: likerName,
        preview: commentText,
      },
    });
  },

  /**
   * Someone started following user
   */
  async onNewFollower(
    followedUserId: number,
    followerId: number,
    followerName: string,
    followerImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: followedUserId,
      senderId: followerId,
      type: NotificationType.SOCIAL_NEW_FOLLOWER,
      entityType: EntityType.SOCIAL_POST,
      imageUrl: followerImageUrl,
      customData: {
        sender_name: followerName,
        sender_id: followerId,
      },
    });
  },

  /**
   * Someone requested to follow a private account
   */
  async onFollowRequested(
    targetUserId: number,
    requesterId: number,
    requesterName: string,
    requesterImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: targetUserId,
      senderId: requesterId,
      type: NotificationType.SOCIAL_FOLLOW_REQUEST,
      entityType: EntityType.SOCIAL_POST,
      imageUrl: requesterImageUrl,
      customData: {
        sender_name: requesterName,
        sender_id: requesterId,
      },
    });
  },

  /**
   * A private account accepted a follow request
   */
  async onFollowRequestAccepted(
    requesterId: number,
    accepterId: number,
    accepterName: string,
    accepterImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: requesterId,
      senderId: accepterId,
      type: NotificationType.SOCIAL_FOLLOW_REQUEST_ACCEPTED,
      entityType: EntityType.SOCIAL_POST,
      imageUrl: accepterImageUrl,
      customData: {
        sender_name: accepterName,
        sender_id: accepterId,
      },
    });
  },

  /**
   * User was mentioned in a post
   */
  async onMentionedInPost(
    mentionedUserId: number,
    mentionedBy: number,
    postId: number,
    mentionerName: string,
    postImageUrl?: string,
    preview?: string
  ) {
    return NotificationService.createAndSend({
      userId: mentionedUserId,
      senderId: mentionedBy,
      type: NotificationType.SOCIAL_MENTION_POST,
      entityType: EntityType.SOCIAL_POST,
      entityId: postId,
      imageUrl: postImageUrl,
      customData: {
        sender_name: mentionerName,
        preview: preview?.substring(0, 100),
      },
    });
  },

  /**
   * User was mentioned in a comment
   */
  async onMentionedInComment(
    mentionedUserId: number,
    mentionedBy: number,
    postId: number,
    mentionerName: string,
    postImageUrl?: string,
    preview?: string,
    commentId?: number
  ) {
    return NotificationService.createAndSend({
      userId: mentionedUserId,
      senderId: mentionedBy,
      type: NotificationType.SOCIAL_MENTION_COMMENT,
      entityType: EntityType.SOCIAL_POST,
      entityId: postId,
      commentId,
      imageUrl: postImageUrl,
      customData: {
        sender_name: mentionerName,
        preview: preview?.substring(0, 100),
      },
    });
  },

  /**
   * Someone reposted your post
   */
  async onPostReposted(
    originalAuthorId: number,
    reposterId: number,
    postId: number,
    reposterName: string,
    postImageUrl?: string,
    postCaption?: string
  ) {
    return NotificationService.createAndSend({
      userId: originalAuthorId,
      senderId: reposterId,
      type: NotificationType.SOCIAL_REPOST,
      entityType: EntityType.SOCIAL_POST,
      entityId: postId,
      imageUrl: postImageUrl,
      customData: {
        sender_name: reposterName,
        preview: postCaption,
      },
    });
  },

  /**
   * Transcoding complete — notify the video owner
   */
  async onVideoReady(
    authorId: number,
    postId: number,
    videoUrl?: string,
    thumbnailUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: authorId,
      senderId: null, // System notification
      type: NotificationType.SOCIAL_VIDEO_READY,
      entityType: EntityType.SOCIAL_POST,
      entityId: postId,
      imageUrl: thumbnailUrl || videoUrl,
    });
  },
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADOPTION TRIGGERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const AdoptionNotifications = {
  /**
   * New adoption application received (notify pet owner)
   */
  async onApplicationSubmitted(
    petOwnerId: number,
    applicantId: number,
    applicationId: number,
    petName: string,
    applicantName: string,
    petImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: petOwnerId,
      senderId: applicantId,
      type: NotificationType.ADOPTION_NEW_APPLICATION,
      entityType: EntityType.ADOPTION_APPLICATION,
      entityId: applicationId,
      imageUrl: petImageUrl,
      customData: {
        sender_name: applicantName,
        pet_name: petName,
      },
    });
  },

  /**
   * Application approved
   */
  async onApplicationApproved(
    applicantId: number,
    applicationId: number,
    petName: string,
    petImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: applicantId,
      type: NotificationType.ADOPTION_APPLICATION_APPROVED,
      entityType: EntityType.ADOPTION_APPLICATION,
      entityId: applicationId,
      imageUrl: petImageUrl,
      customData: {
        pet_name: petName,
      },
    });
  },

  /**
   * Application rejected
   */
  async onApplicationRejected(
    applicantId: number,
    applicationId: number,
    petName: string,
    petImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: applicantId,
      type: NotificationType.ADOPTION_APPLICATION_REJECTED,
      entityType: EntityType.ADOPTION_APPLICATION,
      entityId: applicationId,
      imageUrl: petImageUrl,
      customData: {
        pet_name: petName,
      },
    });
  },

  /**
   * New rescue listing that matches user preferences
   */
  async onNewListingMatch(
    interestedUserId: number,
    petId: number,
    petName: string,
    petImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: interestedUserId,
      type: NotificationType.ADOPTION_NEW_LISTING_MATCH,
      entityType: EntityType.ADOPTION_PET,
      entityId: petId,
      imageUrl: petImageUrl,
      customData: {
        pet_name: petName,
      },
    });
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BAZAAR TRIGGERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const BazaarNotifications = {
  /**
   * Order confirmed (notify buyer)
   */
  async onOrderConfirmed(
    buyerId: number,
    orderId: number,
    orderNumber?: string
  ) {
    return NotificationService.createAndSend({
      userId: buyerId,
      type: NotificationType.BAZAAR_ORDER_CONFIRMED,
      entityType: EntityType.BAZAAR_ORDER,
      entityId: orderId,
      customData: {
        entity_id: orderId,
        order_number: orderNumber || orderId,
      },
    });
  },

  /**
   * Payment verified
   */
  async onPaymentVerified(
    buyerId: number,
    orderId: number,
    orderNumber?: string
  ) {
    return NotificationService.createAndSend({
      userId: buyerId,
      type: NotificationType.BAZAAR_PAYMENT_VERIFIED,
      entityType: EntityType.BAZAAR_ORDER,
      entityId: orderId,
      customData: {
        entity_id: orderId,
        order_number: orderNumber || orderId,
      },
    });
  },

  /**
   * Order shipped
   */
  async onOrderShipped(
    buyerId: number,
    orderId: number,
    trackingNumber?: string
  ) {
    return NotificationService.createAndSend({
      userId: buyerId,
      type: NotificationType.BAZAAR_ORDER_SHIPPED,
      entityType: EntityType.BAZAAR_ORDER,
      entityId: orderId,
      customData: {
        tracking_number: trackingNumber,
      },
    });
  },

  /**
   * Order delivered
   */
  async onOrderDelivered(buyerId: number, orderId: number) {
    return NotificationService.createAndSend({
      userId: buyerId,
      type: NotificationType.BAZAAR_ORDER_DELIVERED,
      entityType: EntityType.BAZAAR_ORDER,
      entityId: orderId,
    });
  },

  /**
   * New order for vendor
   */
  async onNewVendorOrder(
    vendorId: number,
    orderId: number,
    buyerName: string,
    orderCount: number = 1,
    buyerImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: vendorId,
      type: NotificationType.BAZAAR_NEW_VENDOR_ORDER,
      entityType: EntityType.BAZAAR_ORDER,
      entityId: orderId,
      imageUrl: buyerImageUrl,
      customData: {
        buyer_name: buyerName,
        order_count: orderCount,
      },
    });
  },

  /**
   * Abandoned cart reminder (2+ hours after last activity)
   */
  async onAbandonedCart(userId: number) {
    return NotificationService.createAndSend({
      userId,
      type: NotificationType.BAZAAR_ABANDONED_CART,
      entityType: EntityType.BAZAAR_PRODUCT,
    });
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PET CARE TRIGGERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const PetCareNotifications = {
  /**
   * Review approved
   */
  async onReviewApproved(
    reviewerId: number,
    clinicId: number,
    clinicName: string,
    clinicImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId: reviewerId,
      type: NotificationType.PETCARE_REVIEW_APPROVED,
      entityType: EntityType.CLINIC,
      entityId: clinicId,
      imageUrl: clinicImageUrl,
      customData: {
        clinic_name: clinicName,
      },
    });
  },

  /**
   * Vet credentials verified
   */
  async onVetVerified(vetId: number, vetName: string) {
    return NotificationService.createAndSend({
      userId: vetId,
      type: NotificationType.PETCARE_VET_VERIFIED,
      entityType: EntityType.VET,
      entityId: vetId,
      customData: {
        vet_name: vetName,
      },
    });
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTEM TRIGGERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const SystemNotifications = {
  /**
   * Platform-wide broadcast (sent via Firebase Topic, not per-user)
   */
  async sendBroadcast(
    title: string,
    body: string,
    deepLink?: string,
    imageUrl?: string
  ) {
    return NotificationService.sendTopicNotification(
      "all_users",
      title,
      body,
      deepLink,
      imageUrl
    );
  },

  /**
   * Platform update announcement
   */
  async sendPlatformUpdate(
    title: string,
    description: string,
    deepLink?: string
  ) {
    return NotificationService.sendTopicNotification(
      "all_users",
      title || "Platform Update",
      description || "Paltuu just got better! See what's new",
      deepLink || "paltuu://home"
    );
  },

  /**
   * Lost & found match notification
   */
  async onLostFoundMatch(
    userId: number,
    matchId: number,
    petName: string,
    area: string,
    matchImageUrl?: string
  ) {
    return NotificationService.createAndSend({
      userId,
      type: NotificationType.SYSTEM_LOST_FOUND_MATCH,
      entityType: EntityType.LOST_FOUND,
      entityId: matchId,
      imageUrl: matchImageUrl,
      customData: {
        pet_name: petName,
        area: area,
      },
    });
  },
};
