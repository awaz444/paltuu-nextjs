# Paltuu Notification System Documentation

## Quick Start

### 1. Register Device Token (from Mobile App)

**Endpoint:** `POST /api/v1/notifications/device`

When the Expo app launches after login, immediately register the FCM token:

```typescript
// On app startup (e.g., in app._layout.tsx or root provider)
const response = await fetch('/api/v1/notifications/device', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fcm_token: expoPushToken, // From expo-notifications
    platform: 'ios' || 'android',
  }),
});
```

### 2. Trigger a Notification (from Backend)

**Example: User likes a post**

```typescript
import { SocialNotifications } from '@/lib/notifications';

// In your POST /api/v1/social/posts/[id]/like endpoint:
await SocialNotifications.onPostLiked(
  postAuthorId,      // Who gets notified
  likerId,            // Who did the action
  postId,             // Entity ID
  likerName,          // For template
  likerImageUrl,      // Optional rich notification
  postImageUrl        // Optional rich notification
);
```

### 3. Fetch Notifications (from Mobile App)

**Endpoint:** `GET /api/v1/notifications?limit=20&cursor=0&filter=all`

```typescript
const response = await fetch('/api/v1/notifications?limit=20', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const data = await response.json();
// {
//   notifications: [...],
//   unread_count: 5,
//   next_cursor: 20
// }
```

### 4. Get Unread Count (for Badge)

**Endpoint:** `GET /api/v1/notifications/unread-count`

```typescript
const response = await fetch('/api/v1/notifications/unread-count', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { unread_count } = await response.json();
// Use for bell badge in header
```

---

## Notification Types

### Social
- `social_post_like` - Someone liked your post
- `social_post_comment` - Someone commented on your post
- `social_comment_reply` - Someone replied to your comment
- `social_comment_like` - Someone liked your comment
- `social_new_follower` - Someone started following you
- `social_mention_post` - You were mentioned in a post
- `social_mention_comment` - You were mentioned in a comment
- `social_repost` - Someone reposted your post

### Adoptions
- `adoption_new_application` - New application for your pet
- `adoption_application_approved` - Your application was approved
- `adoption_application_rejected` - Your application was rejected
- `adoption_new_listing_match` - New rescue matching your preferences

### Bazaar
- `bazaar_order_confirmed` - Order confirmed
- `bazaar_payment_verified` - Payment verified
- `bazaar_order_shipped` - Order shipped
- `bazaar_order_delivered` - Order delivered
- `bazaar_new_vendor_order` - New order for your shop (vendor)
- `bazaar_abandoned_cart` - Cart reminder

### Pet Care
- `petcare_review_approved` - Your review was published
- `petcare_vet_verified` - Your credentials were verified

### System
- `system_broadcast` - Platform-wide announcement (via Firebase Topic)
- `system_platform_update` - Platform update announcement
- `system_lost_found_match` - Match found for lost/found pet

---

## API Endpoints

### 1. GET /api/v1/notifications

Fetch paginated notifications for the current user.

**Query Parameters:**
- `limit` (number, 1-50, default: 20)
- `cursor` (number, default: 0)
- `filter` (string: 'all', 'social', 'adoptions', 'orders')

**Response:**
```json
{
  "notifications": [
    {
      "notification_id": 123,
      "type": "social_post_like",
      "title": "Sara Ali",
      "body": "pawed your post",
      "entity_type": "social_posts",
      "entity_id": 456,
      "deep_link": "paltuu://social/post/456",
      "image_url": "https://...",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z",
      "sender": {
        "user_id": 789,
        "name": "Sara Ali",
        "profile_image_url": "https://..."
      }
    }
  ],
  "unread_count": 5,
  "next_cursor": 20
}
```

### 2. POST /api/v1/notifications/device

Register or update a device FCM token.

**Request Body:**
```json
{
  "fcm_token": "string (from expo-notifications)",
  "platform": "ios | android"
}
```

**Response:**
```json
{ "success": true }
```

### 3. PATCH /api/v1/notifications

Mark notifications as read.

**Request Body (one of):**

Option A: Mark single notification
```json
{ "notification_id": 123 }
```

Option B: Mark all as read
```json
{ "mark_all_read": true }
```

Option C: Mark by filter
```json
{ "filter": "social" }
```

**Response:**
```json
{
  "success": true,
  "updated_count": 3
}
```

### 4. GET /api/v1/notifications/unread-count

Get unread notification count.

**Response:**
```json
{ "unread_count": 5 }
```

### 5. DELETE /api/v1/notifications?notification_id=123

Delete a notification.

**Response:**
```json
{ "success": true }
```

---

## Trigger Helpers

### Social
```typescript
import { SocialNotifications } from '@/lib/notifications';

// Post liked
await SocialNotifications.onPostLiked(
  postAuthorId, likerId, postId, likerName, likerImageUrl?, postImageUrl?
);

// Post commented
await SocialNotifications.onPostCommented(
  postAuthorId, commenterId, postId, commenterName, commentPreview, postImageUrl?
);

// Comment replied
await SocialNotifications.onCommentReplied(
  commentAuthorId, replierId, postId, replierName, postImageUrl?
);

// Comment liked
await SocialNotifications.onCommentLiked(
  commentAuthorId, likerId, postId, likerName, postImageUrl?
);

// New follower
await SocialNotifications.onNewFollower(
  followedUserId, followerId, followerName, followerImageUrl?
);

// Mentioned in post
await SocialNotifications.onMentionedInPost(
  mentionedUserId, mentionedBy, postId, mentionerName, postImageUrl?
);

// Mentioned in comment
await SocialNotifications.onMentionedInComment(
  mentionedUserId, mentionedBy, postId, mentionerName, postImageUrl?
);

// Reposted
await SocialNotifications.onPostReposted(
  originalAuthorId, reposterId, postId, reposterName, postImageUrl?
);
```

### Adoptions
```typescript
import { AdoptionNotifications } from '@/lib/notifications';

// Application submitted
await AdoptionNotifications.onApplicationSubmitted(
  petOwnerId, applicantId, applicationId, petName, applicantName, petImageUrl?
);

// Application approved
await AdoptionNotifications.onApplicationApproved(
  applicantId, applicationId, petName, petImageUrl?
);

// Application rejected
await AdoptionNotifications.onApplicationRejected(
  applicantId, applicationId, petName, petImageUrl?
);

// New listing match
await AdoptionNotifications.onNewListingMatch(
  interestedUserId, petId, petName, petImageUrl?
);
```

### Bazaar
```typescript
import { BazaarNotifications } from '@/lib/notifications';

// Order confirmed
await BazaarNotifications.onOrderConfirmed(
  buyerId, orderId, orderNumber?
);

// Payment verified
await BazaarNotifications.onPaymentVerified(
  buyerId, orderId, orderNumber?
);

// Order shipped
await BazaarNotifications.onOrderShipped(
  buyerId, orderId, trackingNumber?
);

// Order delivered
await BazaarNotifications.onOrderDelivered(
  buyerId, orderId
);

// New vendor order
await BazaarNotifications.onNewVendorOrder(
  vendorId, orderId, buyerName, orderCount?, buyerImageUrl?
);

// Abandoned cart
await BazaarNotifications.onAbandonedCart(userId);
```

### Pet Care
```typescript
import { PetCareNotifications } from '@/lib/notifications';

// Review approved
await PetCareNotifications.onReviewApproved(
  reviewerId, clinicId, clinicName, clinicImageUrl?
);

// Vet verified
await PetCareNotifications.onVetVerified(
  vetId, vetName
);
```

### System
```typescript
import { SystemNotifications } from '@/lib/notifications';

// Send broadcast (via Firebase Topic)
await SystemNotifications.sendBroadcast(
  title, body, deepLink?, imageUrl?
);

// Send platform update
await SystemNotifications.sendPlatformUpdate(
  title, description, deepLink?
);

// Lost & found match
await SystemNotifications.onLostFoundMatch(
  userId, matchId, petName, area, matchImageUrl?
);
```

---

## Environment Variables

```env
# Firebase Service Account (base64 encoded JSON)
FIREBASE_SERVICE_ACCOUNT=<base64-encoded-service-account-json>

# Example: To encode:
# cat firebase-key.json | base64 | pbcopy
```

---

## Deep Link Routes

Notification deep links follow this pattern: `paltuu://<module>/<action>/<id>`

Supported routes:
- `paltuu://social/post/{id}` - Post detail
- `paltuu://profile/{user_id}` - User profile
- `paltuu://bazaar/orders/{id}` - Order detail
- `paltuu://bazaar/vendor/orders/{id}` - Vendor order
- `paltuu://bazaar/cart` - Cart
- `paltuu://bazaar` - Marketplace
- `paltuu://adoptions/applications/{id}` - Adoption application
- `paltuu://adoptions/{id}` - Pet detail
- `paltuu://lost-found/{id}` - Lost/found detail
- `paltuu://petcare/{id}` - Clinic detail
- `paltuu://vet-panel` - Vet panel
- `paltuu://home` - Home

---

## Rules & Best Practices

### 1. Never Notify Self
The system automatically skips self-notifications. If `senderId === userId`, the notification is silently dropped.

### 2. Always Include Deep Links
The template system automatically generates deep links. Never send a notification without one—the frontend needs it for navigation.

### 3. Batch High-Volume Notifications
If a post gets 50 likes in 10 seconds, don't send 50 pushes. Instead:
1. Queue the likes
2. After 10 seconds, aggregate: "Sara and 49 others pawed your post"
3. Send one notification

_Note: This batching logic is NOT in NotificationService. You must implement it in your endpoints._

### 4. Respect Quiet Hours
For non-urgent notifications (abandoned cart, recommendations), check the user's timezone:

```typescript
const userTimezone = await getUserTimezone(userId);
const localHour = getLocalHour(userTimezone);
if (localHour < 7 || localHour > 22) return; // Skip during quiet hours
```

### 5. Token Hygiene
The system automatically deletes invalid FCM tokens. Monitor your logs:
- ✅ "FCM push sent to X/Y devices"
- 🗑️ "Deleted X invalid FCM tokens"

### 6. Error Handling
NotificationService returns `null` on error. Always check:

```typescript
const result = await SocialNotifications.onPostLiked(...);
if (!result) {
  console.error("Failed to send notification");
  // Continue anyway—don't fail the entire request
}
```

### 7. Firebase Topics
For system-wide broadcasts, use Firebase Topics instead of per-user notifications:

```typescript
await SystemNotifications.sendBroadcast(
  "🎉 Eid Bazaar is Live!",
  "Get 20% off all cat food",
  "paltuu://bazaar"
);
```

This sends to the `all_users` topic without creating database rows.

---

## Monitoring & Metrics

### Metrics to Track
- Notifications sent (per type)
- Delivery success rate
- Failed tokens cleaned up
- Unread notifications per user
- Notification engagement (read vs. not read)

### Query Examples

```sql
-- Total notifications sent
SELECT type, COUNT(*) as count
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- Unread notifications by user
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE is_read = false
GROUP BY user_id
ORDER BY unread_count DESC;

-- Registered devices per platform
SELECT device_platform, COUNT(*) as count
FROM user_devices
GROUP BY device_platform;

-- Stale tokens (not updated in 30 days)
SELECT COUNT(*) FROM user_devices
WHERE updated_at < NOW() - INTERVAL '30 days';
```

---

## Troubleshooting

### Firebase Not Initializing
- Check that `FIREBASE_SERVICE_ACCOUNT` is set and valid base64
- Verify the service account has Messaging permissions
- Check console logs for specific Firebase errors

### Notifications Not Received
1. Device token registered? Check `user_devices` table
2. User has permissions? Check FCM topic subscription
3. Token valid? System logs show deleted invalid tokens
4. Network connectivity? Check backend FCM logs

### High FCM Failure Rate
1. Review deleted token logs
2. Check if tokens are expiring frequently
3. Ensure Expo app is properly configured
4. Verify notification permissions on device

---

## Next Steps

1. **Environment Setup**: Add `FIREBASE_SERVICE_ACCOUNT` to `.env`
2. **Mobile Integration**: Call `POST /api/v1/notifications/device` on app launch
3. **Endpoint Integration**: Add trigger calls to each module (see IMPLEMENTATION_GUIDE.ts)
4. **Testing**: Verify notifications in development
5. **Monitoring**: Set up metrics dashboard

---

## Support

For questions or issues:
1. Check IMPLEMENTATION_GUIDE.ts for code examples
2. Review the NotificationService source code
3. Check Firebase Admin SDK docs: https://firebase.google.com/docs/reference/admin/node
