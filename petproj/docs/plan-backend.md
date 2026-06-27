# Feed Algorithm — Backend Plan (Person A)

> **Parallel track:** Person B is building the Admin UI and React Native frontend.
> See `petproj/docs/plan-frontend.md` for their work.
>
> **Your APIs they depend on (must be ready before Person B can wire up live data):**
> - `GET /api/v1/admin/social/tagging-queue` → Admin tagging UI
> - `POST /api/v1/admin/social/posts/:id/tags` → Admin tag picker
> - `GET /api/v1/admin/social/content-tags` → Tag list for picker
> - `POST /api/v1/social/interests` → RN onboarding screen
> - `GET /api/v1/social/posts?mode=personalized` → RN For You tab
>
> **Communicate with Person B:** When each API is ready, tell them the exact request/response shape.

---

## 1. DB Migrations

File: `petproj/prisma/schema.prisma` + new migration via `prisma migrate dev`

### New tables

```prisma
model content_tags {
  tag_id           Int      @id @default(autoincrement())
  slug             String   @unique
  label            String
  category         String   // species | topic | content_type | mood
  default_weight   Float    @default(1.0)
  keyword_aliases  String[] @default([])
  is_active        Boolean  @default(true)
  sort_order       Int      @default(0)
  post_content_tags post_content_tags[]
}

model post_content_tags {
  post_id   BigInt
  tag_id    Int
  role      String   @default("secondary")  // primary | secondary
  tagged_by Int?
  tagged_at DateTime @default(now())
  @@id([post_id, tag_id])
}

// Additive interest score per user per tag. Capped at 10.0 in app code.
// NOT EMA — this is intentionally additive so events are auditable and undoable.
model user_interest_scores {
  user_id    Int
  tag_id     Int
  score      Float    @default(0)
  updated_at DateTime @default(now())
  @@id([user_id, tag_id])
}

// Onboarding picks — seeds user_interest_scores at +1.0 per tag
model user_interest_picks {
  user_id    Int
  tag_id     Int
  created_at DateTime @default(now())
  @@id([user_id, tag_id])
}

// Events queued while a post is untagged; processed on admin tag action
model pending_interest_events {
  id         BigInt   @id @default(autoincrement())
  user_id    Int
  post_id    BigInt
  event_type String   // like | save | comment | repost
  delta      Float
  created_at DateTime @default(now())
  @@index([post_id])
}
```

### Extend `social_posts`

```sql
ALTER TABLE social_posts ADD COLUMN tagging_status VARCHAR(20) DEFAULT 'untagged';
ALTER TABLE social_posts ADD COLUMN tagged_at TIMESTAMPTZ;
ALTER TABLE social_posts ADD COLUMN tagged_by INT;
```

Add raw SQL check via migration (Prisma doesn't support CHECK constraints natively):

```sql
ALTER TABLE user_interest_scores ADD CONSTRAINT score_cap CHECK (score >= 0 AND score <= 10);
```

---

## 2. Seed Content Taxonomy

Create `petproj/prisma/seed-content-tags.ts` and run once after migration.

Seed ~30 tags:

| slug | label | category |
|------|-------|----------|
| cat | Cat | species |
| dog | Dog | species |
| bird | Bird | species |
| rabbit | Rabbit | species |
| fish | Fish | species |
| reptile | Reptile | species |
| other-animal | Other Animal | species |
| training | Training | topic |
| grooming | Grooming | topic |
| health | Health & Vet | topic |
| adoption | Adoption | topic |
| lost-found | Lost & Found | topic |
| funny | Funny | topic |
| milestone | Milestone | topic |
| diary | Diary | topic |
| photo | Photo | content_type |
| video | Video | content_type |
| text | Text Post | content_type |
| meme | Meme | content_type |
| cute | Cute | mood |
| educational | Educational | mood |
| question | Question | mood |
| rant | Rant | mood |

---

## 3. Post Lifecycle Update

File: `petproj/app/api/v1/social/posts/route.ts` (POST handler)

On create, add `tagging_status = 'untagged'` to the INSERT. No other change — posts go live immediately in all feeds.

```ts
// In the INSERT for social_posts, add:
tagging_status: 'untagged'
```

---

## 4. Interest Scoring Library

New file: `petproj/lib/interestScoring.ts`

```ts
const MAX_INTEREST_SCORE = 10.0;

// Deltas per event type (positive signals only — Phase 1)
const EVENT_DELTAS: Record<string, number> = {
  like:    0.15,
  save:    0.25,
  comment: 0.20,
  repost:  0.30,
};

/**
 * Call this from the like/save/comment/repost API handlers.
 * If post is untagged, queues to pending_interest_events.
 * If post is tagged, updates user_interest_scores directly.
 */
export async function recordEngagementEvent(
  db: PrismaClient,
  userId: number,
  postId: bigint,
  eventType: 'like' | 'save' | 'comment' | 'repost'
) {
  const delta = EVENT_DELTAS[eventType];
  const post = await db.social_posts.findUnique({
    where: { post_id: postId },
    select: { tagging_status: true }
  });

  if (!post || post.tagging_status !== 'tagged') {
    // Queue for backfill when admin tags this post
    await db.pending_interest_events.create({
      data: { user_id: userId, post_id: postId, event_type: eventType, delta }
    });
    return;
  }

  const primaryTags = await db.post_content_tags.findMany({
    where: { post_id: postId, role: 'primary' },
    select: { tag_id: true }
  });

  for (const { tag_id } of primaryTags) {
    await upsertInterestScore(db, userId, tag_id, delta);
  }
}

/**
 * Called by admin tag API after tagging a post.
 * Processes pending events within 72h window at 50% strength, cap 1.5 per user per post.
 */
export async function backfillInterestForPost(
  db: PrismaClient,
  postId: bigint,
  primaryTagIds: number[]
) {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const pending = await db.pending_interest_events.findMany({
    where: { post_id: postId, created_at: { gte: cutoff } }
  });

  // Group by user, enforce 1.5 cap per user per post
  const userCaps: Record<number, number> = {};
  for (const event of pending) {
    const remaining = 1.5 - (userCaps[event.user_id] ?? 0);
    if (remaining <= 0) continue;
    const dampened = Math.min(event.delta * 0.5, remaining);
    userCaps[event.user_id] = (userCaps[event.user_id] ?? 0) + dampened;

    for (const tagId of primaryTagIds) {
      await upsertInterestScore(db, event.user_id, tagId, dampened);
    }
  }

  await db.pending_interest_events.deleteMany({ where: { post_id: postId } });
}

async function upsertInterestScore(
  db: PrismaClient,
  userId: number,
  tagId: number,
  delta: number
) {
  await db.$executeRaw`
    INSERT INTO user_interest_scores (user_id, tag_id, score, updated_at)
    VALUES (${userId}, ${tagId}, LEAST(${delta}, ${MAX_INTEREST_SCORE}), NOW())
    ON CONFLICT (user_id, tag_id) DO UPDATE
    SET score = LEAST(user_interest_scores.score + ${delta}, ${MAX_INTEREST_SCORE}),
        updated_at = NOW()
  `;
}
```

Hook `recordEngagementEvent` into the existing handlers:
- `petproj/app/api/v1/posts/[id]/like/route.ts`
- `petproj/app/api/v1/posts/[id]/save/route.ts`
- `petproj/app/api/v1/social/comments/route.ts` (POST)
- `petproj/app/api/v1/posts/[id]/repost/route.ts`

---

## 5. Admin Tagging APIs

### 5a. Tagging queue

`petproj/app/api/v1/admin/social/tagging-queue/route.ts`

```
GET /api/v1/admin/social/tagging-queue?limit=20&offset=0&filter=all|media|text|sla_breach

Response:
{
  posts: [{
    post_id, content, post_type, created_at, hours_untagged,
    media: [{ url, media_type }],
    report_count
  }],
  total_untagged: number
}
```

Query: `WHERE tagging_status = 'untagged' ORDER BY created_at ASC`

SLA breach filter: `WHERE created_at < NOW() - INTERVAL '4 hours'`

### 5b. Apply tags

`petproj/app/api/v1/admin/social/posts/[id]/tags/route.ts`

```
POST /api/v1/admin/social/posts/:id/tags

Body: {
  tags: [{ tag_id: number, role: 'primary' | 'secondary' }]
  // Validation: 1-3 primaries required, at least 1 primary
}

Response: { success: true, tagged_at: string }
```

Handler steps:
1. Validate: at least 1 primary, max 3 primaries
2. Delete existing `post_content_tags` for this post (allow re-tagging)
3. Insert new `post_content_tags` rows
4. Update `social_posts`: `tagging_status='tagged'`, `tagged_at=NOW()`, `tagged_by=adminId`
5. Call `backfillInterestForPost(postId, primaryTagIds)` from `interestScoring.ts`
6. Insert into `admin_action_logs`: `{ action: 'tag_post', target_type: 'post', target_id: postId, admin_id }`

### 5c. Content tags CRUD

`petproj/app/api/v1/admin/social/content-tags/route.ts`

```
GET  /api/v1/admin/social/content-tags         Returns all active tags grouped by category
POST /api/v1/admin/social/content-tags         Create new tag
PATCH /api/v1/admin/social/content-tags/:id   Update label/aliases/weight
```

---

## 6. Onboarding Interests API

`petproj/app/api/v1/social/interests/route.ts`

```
POST /api/v1/social/interests
Auth: required

Body: { tagIds: number[] }

Action:
1. Upsert user_interest_picks for each tagId
2. Upsert user_interest_scores at +1.0 per tag (capped at MAX_INTEREST_SCORE)

Response: { success: true }
```

Also expose:
```
GET /api/v1/social/content-tags   Returns all active tags (for onboarding picker in RN)
```

> **Tag for Person B:** This endpoint is what the RN onboarding screen calls. Response shape for content-tags:
> `{ categories: { species: Tag[], topic: Tag[], content_type: Tag[], mood: Tag[] } }`
> where `Tag = { tag_id, slug, label }`.

---

## 7. Personalized Feed

File: `petproj/app/api/v1/social/posts/route.ts` (GET handler, `mode=personalized`)

Add a new SQL branch. Reuse the existing `scored` CTE, extend it with `A_norm_feed`.

```sql
-- New CTEs added before the scored CTE:

WITH
-- Existing: following_set, post_media ...

-- User's max interest score (denominator for normalization)
user_max_interest AS (
  SELECT COALESCE(MAX(score), 0) AS max_score
  FROM user_interest_scores
  WHERE user_id = $1
),

-- Average interest across primary tags on each post
post_affinity AS (
  SELECT
    pct.post_id,
    AVG(COALESCE(uis.score, 0)) AS avg_primary_interest
  FROM post_content_tags pct
  LEFT JOIN user_interest_scores uis
    ON uis.user_id = $1 AND uis.tag_id = pct.tag_id
  WHERE pct.role = 'primary'
  GROUP BY pct.post_id
),

-- Candidate score: 0.70 × base + 0.30 × A_norm_feed
-- A_norm_feed = avg_primary_interest / max_score (guaranteed [0,1])
-- Max candidate ≈ 0.748 (not 1.0 — scores are relative rankings)
scored AS (
  SELECT
    p.*,
    -- existing base score components ...
    (
      EXP(-EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 21600.0) * 0.4
      + LEAST(LOG(1 + p.like_count + p.comment_count * 2 + p.repost_count * 3) / 10.0, 0.4) * 0.4
      + CASE
          WHEN p.user_id = $1 THEN 0.4
          WHEN fs.following_id IS NOT NULL THEN 0.2
          ELSE 0.0
        END * 0.2
    ) AS base_score,
    CASE
      WHEN umi.max_score > 0 AND pa.avg_primary_interest IS NOT NULL
        THEN pa.avg_primary_interest / umi.max_score
      ELSE 0
    END AS a_norm_feed,
    -- Final candidate score
    0.70 * base_score + 0.30 * a_norm_feed AS relevance_score
  FROM social_posts p
  LEFT JOIN following_set fs ON fs.following_id = p.user_id
  LEFT JOIN post_affinity pa ON pa.post_id = p.post_id
  CROSS JOIN user_max_interest umi
  WHERE p.is_hidden = false AND p.is_deleted = false
)
```

> **Note for A/B (Phase 1b):** Control bucket = existing `mode=global` formula unchanged.
> Treatment = `mode=personalized` above. The two use the same `base_score` definition,
> so the experiment isolates only the affinity term.

---

## Handoff checklist to Person B

- [ ] DB migration run and schema confirmed
- [ ] `GET /api/v1/admin/social/content-tags` returns grouped tag list
- [ ] `GET /api/v1/admin/social/tagging-queue` returns posts with media URLs
- [ ] `POST /api/v1/admin/social/posts/:id/tags` works end-to-end (tags + backfill)
- [ ] `GET /api/v1/social/content-tags` returns tags for RN picker
- [ ] `POST /api/v1/social/interests` seeds scores correctly
- [ ] `GET /api/v1/social/posts?mode=personalized` returns scored feed
