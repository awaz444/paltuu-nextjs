# 📱 Paltuu Social — React Native Implementation Guide

Welcome! The backend for the Instagram-equivalent social media module is fully deployed. This document outlines your implementation roadmap, API endpoints, performance requirements, and real-time integration steps.

---

## 🛠 Tech Stack Recommendations
To achieve zero-latency and smooth UI/UX (Instagram quality), implement the following:

- **State Management:** `@tanstack/react-query` (Best for cursor pagination and optimistic updates)
- **Image Caching:** `react-native-fast-image` (Crucial for smooth feed scrolling)
- **Image Upload:** `react-native-image-resizer` (Compress images locally to WebP before uploading)
- **Animations:** `react-native-reanimated` (For double-tap to like, transitions)
- **Real-Time:** `socket.io-client` (Connects to our persistent WebSocket server)

---

## 📊 Phase-Wise Implementation Roadmap

### Phase 1: Core Feed & Interactions (MVP)
- Implement `FlatList` with cursor pagination using `onEndReached`.
- Connect the Feed API using `react-native-fast-image` for media.
- Implement Like/Unlike, Comments (threaded), and Follow/Unfollow.
- Build optimistic UI updates (e.g., immediately show +1 Like before API returns).

### Phase 2: Performance & Polish (Zero-Latency)
- Implement progressive image loading using the provided `blurhash` strings.
- Add local video buffering/caching.
- Implement localized multi-image carousels in posts.
- Debounce spam-prone actions (like multiple fast taps on Like button).

### Phase 3: Real-Time Layer & Notifications
- Connect to the WebSocket server using `socket.io-client`.
- Listen for live like, comment, and follower events.
- Build a dedicated notifications center.

---

## 📡 API Endpoints Spec for Mobile

*Base URL: `https://your-api-domain.com/api/v1/social`*

### 1. The Feed
- **Endpoint:** `GET /posts?limit=20&mode=following&cursor={score}`
- **Modes Available:**
  - `following` (Default - Algorithmic feed based on relevance)
  - `global` (Explore page - Algorithmic feed from all users)
  - `chronological` (Newest-first feed)
- **Response Format:**
  ```json
  {
    "posts": [...],
    "next_cursor": "string or null",
    "has_more": true,
    "mode": "algorithmic"
  }
  ```
- **💡 Implementation Note:** Always pass the `next_cursor` as the `cursor` param in the subsequent request to fetch Page 2, 3, etc.

### 2. Interactions (Likes, Comments, Reposts)
- **Like/Unlike (Toggle):** `POST /posts/:id/like`
- **Add Comment:** `POST /posts/:id/comments`
  - Body: `{ "content": "Nice pet!" }`
- **Get Comments (Paginated):** `GET /posts/:id/comments?limit=20&cursor={timestamp}`
- **Repost:** `POST /posts/:id/repost`

### 3. Media Upload (AWS S3 & CloudFront CDN)
To create a post with images or videos:
1. Hit **`POST /upload`** with `multipart/form-data` containing the files under the field name `files`.
2. Grab the returned media array:
   ```json
   {
     "media": [
       { "url": "...", "thumbnail_url": "...", "blurhash": "...", "media_type": "image" }
     ]
   }
   ```
3. Send a **`POST /posts`** payload containing the standard data:
   - Body: `{ "content": "Post body", "post_type": "original", "media": [...] }`

### 4. Profiles & Network
- **User Profile:** `GET /profile/:userId`
- **Toggle Follow:** `POST /follow/:userId`
- **Followers List:** `GET /users/:userId/followers?cursor={id}`
- **Following List:** `GET /users/:userId/following?cursor={id}`

---

## ⚡ Performance Guidelines

### 1. FlatList Best Practices
Never pass inline arrays. Wrap items in `React.memo` and use the following performance props on your FlatList:
```jsx
removeClippedSubviews={true}
maxToRenderPerBatch={10}
windowSize={5}
initialNumToRender={6}
```

### 2. Image Optimization (BlurHash)
The API provides a 30-character CSS-compatible `blurhash`. Use a library like `react-native-blurhash` or a colored placeholder view to display an instant fallback while `FastImage` finishes downloading the asset.

---

## 🔴 Real-Time Integration (Socket.io)

**Server URL:** `ws://localhost:3001` (Replace with your server IP for staging/production)

When a user initializes the app, establish a persistent connection:
```javascript
import { io } from 'socket.io-client';

const socket = io('YOUR_WEBSOCKET_URL', {
  auth: { userId: 'USER_ID_HERE' }
});
```

### Events to Listen For (Server -> Client)
1. **`notification:new`** — Triggers a push notification or updates notification badge.
2. **`post:liked`** — Contains `{ postId, like_count }`.
3. **`post:commented`** — Contains `{ postId, comment }`.

### Events to Emit (Client -> Server)
- **`post:join`** (Param: `postId`) — Subscribes mobile app to real-time events for that specific post when the viewer expands it.
- **`post:leave`** (Param: `postId`) — Unsubscribes when viewer navigates away.

---
🚀 *Let's build a lightning-fast experience! If you find any data discrepancies, reach out directly.*
