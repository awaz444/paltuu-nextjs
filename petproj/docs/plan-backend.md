# Feed Algorithm — Backend Plan (Person A)

> **Parallel track:** Person B is building the Admin UI and React Native frontend.
> See `petproj/docs/plan-frontend.md` for their work.
>
> **Your APIs they depend on (must be ready before Person B can wire up live data):**
> - `GET /api/v1/admin/social/content-tags` → Admin tag picker + taxonomy manager
> - `GET /api/v1/admin/social/tagging-queue` → Admin tagging UI
> - `POST /api/v1/admin/social/posts/:id/tags` → Admin tag submit
> - `POST /api/v1/admin/social/posts/:id/reject` → Admin reject action
> - `GET /api/v1/admin/social/reports` → Admin report queue
> - `PATCH /api/v1/admin/social/reports/:id` → Dismiss / confirm report
> - `PATCH /api/v1/admin/social/posts/:id/moderate` → Set quarantine/hidden state
> - `GET /api/v1/admin/social/settings` → Feed weight + moderation settings
> - `PATCH /api/v1/admin/social/settings` → Update settings (versioned)
> - `GET /api/v1/social/content-tags` → RN onboarding picker
> - `POST /api/v1/social/interests` → RN onboarding save
> - `GET /api/v1/social/posts?mode=personalized` → RN For You tab
>
> **Communicate with Person B:** When each API is ready, share the exact request/response shape.

---

## 1. DB Migrations

File: `petproj/prisma/schema.prisma` + new migration via `prisma migrate dev`

### New tables

```prisma
model content_tags {
  tag_id            Int      @id @default(autoincrement())
  slug              String   @unique
  label             String
  category          String   // species | topic | content_type | mood
  parent_tag_id     Int?
  default_weight    Float    @default(1.0)
  keyword_aliases   String[] @default([])
  is_active         Boolean  @default(true)
  sort_order        Int      @default(0)
  post_content_tags post_content_tags[]
}

model post_content_tags {
  post_id   BigInt
  tag_id    Int
  role      String   @default("secondary")  // primary | secondary
  tagged_by Int?
  tagged_at DateTime @default(now())
  source    String   @default("admin")      // admin | auto (future)
  @@id([post_id, tag_id])
}

// Additive interest score per user per tag. Capped at 10.0 in app code.
// NOT EMA — intentionally additive so events are auditable and undoable.
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

// Full audit trail: every interest delta, including backfill and (Phase 2) undo
model user_interest_events {
  event_id         BigInt    @id @default(autoincrement())
  user_id          Int
  tag_id           Int
  post_id          BigInt?
  delta            Float
  event_type       String    // like | save | comment | repost | backfill | undo | not_interested
  reversible_until DateTime? // set for Phase 2 undo window
  created_at       DateTime  @default(now())
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

// A/B impression log — one row per post served per user
model feed_impression_logs {
  id                BigInt   @id @default(autoincrement())
  user_id           Int
  post_id           BigInt
  experiment_bucket String   // control | treatment
  score_base        Float
  score_affinity    Float
  score_final       Float
  position          Int
  created_at        DateTime @default(now())
}

// Versioned history of app_settings changes for rollback
model app_settings_versions {
  version_id     Int      @id @default(autoincrement())
  settings_key   String   @db.VarChar(100)
  settings_value Json
  created_by     Int
  created_at     DateTime @default(now())
}
```

### Extend `social_posts`

```sql
-- Tagging
ALTER TABLE social_posts ADD COLUMN tagging_status  VARCHAR(20) DEFAULT 'untagged';
ALTER TABLE social_posts ADD COLUMN primary_tag_id  INT NULL;      -- first primary tag, quick filter
ALTER TABLE social_posts ADD COLUMN tagged_at       TIMESTAMPTZ;
ALTER TABLE social_posts ADD COLUMN tagged_by       INT;

-- Moderation (replaces naive is_hidden-only approach)
ALTER TABLE social_posts ADD COLUMN moderation_state          VARCHAR(20) DEFAULT 'none';
-- none | quarantined | hidden
ALTER TABLE social_posts ADD COLUMN report_weighted_score     FLOAT DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN report_immunity_until     TIMESTAMPTZ;
ALTER TABLE social_posts ADD COLUMN suspicious_burst_at       TIMESTAMPTZ;
ALTER TABLE social_posts ADD COLUMN author_block_after_report BOOLEAN DEFAULT false;
```

### Extend `users`

```sql
-- Moderation
ALTER TABLE users ADD COLUMN reporter_trust       FLOAT DEFAULT 1.0;
ALTER TABLE users ADD COLUMN lifetime_dismissals  INT   DEFAULT 0;
ALTER TABLE users ADD COLUMN trust_ceiling        FLOAT DEFAULT 1.0;
ALTER TABLE users ADD COLUMN last_dismissal_at    TIMESTAMPTZ;

-- Feed experiment
ALTER TABLE users ADD COLUMN feed_experiment_bucket    VARCHAR(20) DEFAULT 'control';
-- control | treatment
ALTER TABLE users ADD COLUMN feed_personalization_tier VARCHAR(20) DEFAULT 'cold_start';
-- cold_start | warming | personalized
```

### Extend `reports`

```sql
ALTER TABLE reports ADD COLUMN report_weight FLOAT;
-- computed at insert time and stored for audit; never recomputed retroactively
```

### Add constraint (raw SQL in migration — Prisma doesn't support CHECK natively)

```sql
ALTER TABLE user_interest_scores
  ADD CONSTRAINT score_cap CHECK (score >= 0 AND score <= 10);
```

---

## 2. Seed Content Taxonomy

Create `petproj/prisma/seed-content-tags.ts` and run once after migration.

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

Admins can add more tags at any time via the taxonomy manager UI.

---

## 3. Post Lifecycle Update

File: `petproj/app/api/v1/social/posts/route.ts` (POST handler)

On create, set `tagging_status = 'untagged'`. Posts go live immediately — no gate.

```ts
// In the INSERT for social_posts, add:
tagging_status: 'untagged'
```

---

## 4. Interest Scoring Library

New file: `petproj/lib/interestScoring.ts`

```ts
const MAX_INTEREST_SCORE = 10.0;

const EVENT_DELTAS: Record<string, number> = {
  like:    0.15,
  save:    0.25,
  comment: 0.20,
  repost:  0.30,
};

/**
 * Call from like/save/comment/repost handlers.
 * Queues to pending_interest_events if post is untagged.
 * Updates user_interest_scores directly if post is tagged.
 * Logs every delta to user_interest_events for audit.
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
    await db.user_interest_events.create({
      data: { user_id: userId, tag_id, post_id: postId, delta, event_type: eventType }
    });
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

  const userCaps: Record<number, number> = {};
  for (const event of pending) {
    const remaining = 1.5 - (userCaps[event.user_id] ?? 0);
    if (remaining <= 0) continue;
    const dampened = Math.min(event.delta * 0.5, remaining);
    userCaps[event.user_id] = (userCaps[event.user_id] ?? 0) + dampened;

    for (const tagId of primaryTagIds) {
      await upsertInterestScore(db, event.user_id, tagId, dampened);
      await db.user_interest_events.create({
        data: {
          user_id: event.user_id, tag_id: tagId,
          post_id: postId, delta: dampened, event_type: 'backfill'
        }
      });
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

Hook `recordEngagementEvent` into:
- `petproj/app/api/v1/posts/[id]/like/route.ts`
- `petproj/app/api/v1/posts/[id]/save/route.ts`
- `petproj/app/api/v1/social/comments/route.ts` (POST)
- `petproj/app/api/v1/posts/[id]/repost/route.ts`

---

## 5. Report Scoring Library (replaces naive DB trigger)

New file: `petproj/lib/reportScoring.ts`

Drop `trg_reports_insert` trigger. This library is called from `POST /posts/:id/report` after insert.

```ts
/**
 * Computes per-report weight: w_r = base × age_factor × trust × block_factor × severity
 * Updates report_weighted_score on the post and triggers auto-action if thresholds met.
 */
export async function scoreReport(db: PrismaClient, reportId: bigint, postId: bigint) {
  const report  = await db.reports.findUnique({ where: { report_id: reportId } });
  const post    = await db.social_posts.findUnique({ where: { post_id: postId } });
  const reporter = await db.users.findUnique({ where: { user_id: report.reporter_id } });
  const settings = await getReportSettings(db);

  // Age factor
  const accountAgeDays = daysSince(reporter.created_at);
  const a_r = accountAgeDays < 7 ? 0.0 : accountAgeDays < 30 ? 0.5 : 1.0;

  // Trust (use effective ceiling)
  const tau_eff = Math.min(reporter.reporter_trust, reporter.trust_ceiling);

  // Block factor (author blocking reporter does NOT zero out the report)
  const reporterBlockedAuthor = await db.user_blocks.findFirst({
    where: { blocker_id: report.reporter_id, blocked_id: post.user_id }
  });
  const authorBlockedReporter = await db.user_blocks.findFirst({
    where: { blocker_id: post.user_id, blocked_id: report.reporter_id }
  });
  const b_r = reporterBlockedAuthor ? 0.5 : 1.0;
  // authorBlockedReporter: b_r stays 1.0 — author cannot silence via block

  // Severity
  const s_r = ['ANIMAL_ABUSE', 'HATE_SPEECH'].includes(report.reason_code) ? 1.5 : 1.0;

  const w_r = 1.0 * a_r * tau_eff * b_r * s_r;

  // Store computed weight on the report row
  await db.reports.update({ where: { report_id: reportId }, data: { report_weight: w_r } });

  // Accumulate on post
  const newScore = (post.report_weighted_score ?? 0) + w_r;
  await db.social_posts.update({
    where: { post_id: postId },
    data: { report_weighted_score: newScore }
  });

  // Preemptive block detection
  if (authorBlockedReporter) {
    const blockTimestamp = authorBlockedReporter.created_at;
    const windowHours = settings.preemptive_block_window_hours ?? 48;
    if (daysSince(blockTimestamp) * 24 < windowHours) {
      await db.social_posts.update({
        where: { post_id: postId },
        data: { author_block_after_report: true }
      });
    }
  }

  await evaluateAutoAction(db, postId, newScore, settings);
}

async function evaluateAutoAction(db, postId, score, settings) {
  const post = await db.social_posts.findUnique({ where: { post_id: postId } });

  // Never auto-quarantine if immunity active
  if (post.report_immunity_until && post.report_immunity_until > new Date()) return;

  // Grace window: post must be older than quarantine_grace_hours
  const graceHours = settings.quarantine_grace_hours ?? 1;
  if (hoursSince(post.created_at) < graceHours) return;

  const reports = await db.reports.findMany({ where: { target_id: postId, target_type: 'post' } });

  // Brigading checks — block auto-action if any fire
  const burstWindow = new Date(Date.now() - (settings.report_burst_window_minutes ?? 30) * 60000);
  const recentCount = reports.filter(r => r.created_at > burstWindow).length;
  if (recentCount >= (settings.report_burst_count ?? 5)) {
    await db.social_posts.update({ where: { post_id: postId }, data: { suspicious_burst_at: new Date() } });
    await priorityQueue(db, postId, 'suspicious_burst');
    return;
  }

  const minAge = settings.min_account_age_days ?? 7;
  // (fetch reporter account ages via join — simplified here)
  const newAccountFraction = await getNewAccountFraction(db, reports, minAge);
  if (newAccountFraction > 0.5) { await priorityQueue(db, postId, 'new_account_cluster'); return; }

  const lowTrustFraction = reports.filter(r => r.report_weight < 0.5).length / reports.length;
  if (lowTrustFraction > 0.6) { await priorityQueue(db, postId, 'low_trust_cluster'); return; }

  const trustedReports = reports.filter(r => (r.report_weight ?? 0) >= 0.8);
  if (trustedReports.length < (settings.min_trusted_reports_for_auto ?? 3)) {
    if (trustedReports.length >= 1) await priorityQueue(db, postId, 'insufficient_trusted');
    return;
  }

  // Severity fast-lane: one trusted aged report on ANIMAL_ABUSE/HATE_SPEECH can quarantine
  const fastLaneReasons = settings.severity_fast_lane_reasons ?? ['ANIMAL_ABUSE', 'HATE_SPEECH'];
  const fastLaneThreshold = settings.severity_fast_lane_threshold ?? 4.0;
  const fastLaneEligible = reports.some(r =>
    fastLaneReasons.includes(r.reason_code) &&
    (r.report_weight ?? 0) >= 0.8 &&
    !post.suspicious_burst_at
  );
  if (fastLaneEligible && score >= fastLaneThreshold) {
    await quarantinePost(db, postId);
    return;
  }

  // Standard threshold
  if (score >= (settings.auto_quarantine_weighted_threshold ?? 10)) {
    await quarantinePost(db, postId);
  }
}

async function quarantinePost(db, postId) {
  await db.social_posts.update({
    where: { post_id: postId },
    data: { moderation_state: 'quarantined' }
  });
  // TODO: send push notification to author
}
```

---

## 6. Admin Tagging APIs

### 6a. Tagging queue

`petproj/app/api/v1/admin/social/tagging-queue/route.ts`

```
GET /api/v1/admin/social/tagging-queue?limit=20&offset=0&filter=all|media|text|sla_breach

Response: {
  posts: [{
    post_id, content, post_type, created_at, hours_untagged,
    media: [{ url, media_type }],
    report_count,
    hashtags: string[]
  }],
  total_untagged: number
}
```

Query: `WHERE tagging_status = 'untagged' ORDER BY created_at ASC`
SLA breach: `WHERE created_at < NOW() - INTERVAL '4 hours'`

### 6b. Apply tags

`petproj/app/api/v1/admin/social/posts/[id]/tags/route.ts`

```
POST /api/v1/admin/social/posts/:id/tags
Body: { tags: [{ tag_id: number, role: 'primary' | 'secondary' }] }
```

Handler steps:
1. Validate: ≥1 primary, max 3 primaries
2. Delete existing `post_content_tags` (allow re-tagging)
3. Insert new rows (set `source='admin'`)
4. Set `primary_tag_id` = first primary tag_id
5. Update `social_posts`: `tagging_status='tagged'`, `tagged_at=NOW()`, `tagged_by=adminId`
6. Call `backfillInterestForPost(postId, primaryTagIds)`
7. Log to `admin_action_logs`: `action: 'tag_post'`

### 6c. Reject post

`petproj/app/api/v1/admin/social/posts/[id]/reject/route.ts`

```
POST /api/v1/admin/social/posts/:id/reject
Body: { reason: string }
Action: set moderation_state='hidden', log to admin_action_logs action='reject_post'
```

### 6d. Content tags CRUD

`petproj/app/api/v1/admin/social/content-tags/route.ts`

```
GET   /api/v1/admin/social/content-tags          All active tags grouped by category
POST  /api/v1/admin/social/content-tags          Create new tag { label, category, slug?, keyword_aliases? }
PATCH /api/v1/admin/social/content-tags/:id      Update label / aliases / default_weight / is_active
```

---

## 7. Report Queue APIs

`petproj/app/api/v1/admin/social/reports/route.ts`

```
GET /api/v1/admin/social/reports?status=pending&sort=priority

Response: {
  reports: [{
    report_id, post_id, post_preview, reason_code, report_weight,
    post_weighted_score, post_report_count,
    suspicious_burst_at, author_block_after_report,
    reporter: { user_id, reporter_trust, trust_ceiling, lifetime_dismissals }
  }]
}
```

Sort: burst-flagged and `author_block_after_report` posts pinned first, then by `report_weighted_score DESC`.

`petproj/app/api/v1/admin/social/reports/[id]/route.ts`

```
PATCH /api/v1/admin/social/reports/:id
Body: { action: 'dismiss' | 'confirm_hide' | 'warn_reporter' }
```

On **dismiss**:
- Set `reports.status = 'dismissed'`
- Set `social_posts.moderation_state = 'none'`
- Set `social_posts.report_immunity_until = NOW() + 48h`
- Set `social_posts.report_weighted_score = 0`
- Decay reporter trust: `reporter_trust = MAX(0.25, reporter_trust × 0.95)`
- Increment `lifetime_dismissals`, set `last_dismissal_at = NOW()`
- Recompute `trust_ceiling` (see logic below)
- Log `admin_action_logs`: `action: 'resolve_report'`

On **confirm_hide**:
- Set `reports.status = 'actioned'`
- Set `social_posts.moderation_state = 'hidden'`
- Boost reporter trust: `reporter_trust = MIN(trust_ceiling, reporter_trust × 1.08 + 0.03)`
- Log `admin_action_logs`: `action: 'hide_post'`

**Trust ceiling recomputation** (call after every dismiss):
```ts
function recomputeTrustCeiling(lifetimeDismissals: number, lastDismissalAt: Date): number {
  if (lifetimeDismissals === 0) return 1.0;
  if (lifetimeDismissals >= 2)  return 0.9; // permanent
  // exactly 1 dismissal: soft recovery over 180 days
  const daysSince = (Date.now() - lastDismissalAt.getTime()) / 86400000;
  return Math.min(1.0, 0.9 + 0.1 * (1 - Math.pow(0.5, daysSince / 180)));
}
```

Store computed ceiling in `users.trust_ceiling` for fast reads.

---

## 8. Moderation State API

`petproj/app/api/v1/admin/social/posts/[id]/moderate/route.ts`

```
PATCH /api/v1/admin/social/posts/:id/moderate
Body: { state: 'none' | 'quarantined' | 'hidden' }
Action: update moderation_state, log admin_action_logs action='moderate_post'
```

Feed SQL must filter: `AND (moderation_state IS NULL OR moderation_state != 'quarantined')`
for `mode=global` and `mode=personalized`. Following feed shows quarantined posts (still visible to followers).

---

## 9. Admin Settings API (versioned)

`petproj/app/api/v1/admin/social/settings/route.ts`

```
GET  /api/v1/admin/social/settings
PATCH /api/v1/admin/social/settings
Body: { key: string, value: object }
```

On PATCH:
1. If `key` is a feed weight key, validate weights sum to `1.0 ± 0.01`
2. Snapshot old value to `app_settings_versions` with `created_by = adminId`
3. Update `app_settings`

Expose rollback: `POST /api/v1/admin/social/settings/rollback` with `{ version_id }`.

Default settings to seed:

```json
{
  "auto_quarantine_weighted_threshold": 10,
  "severity_fast_lane_threshold": 4.0,
  "severity_fast_lane_reasons": ["ANIMAL_ABUSE", "HATE_SPEECH"],
  "report_burst_count": 5,
  "report_burst_window_minutes": 30,
  "min_account_age_days": 7,
  "min_trusted_reports_for_auto": 3,
  "quarantine_grace_hours": 1,
  "report_immunity_hours": 48,
  "preemptive_block_window_hours": 48,
  "feed_weight_base": 0.70,
  "feed_weight_affinity": 0.30,
  "cold_start_interaction_threshold": 10
}
```

---

## 10. Onboarding Interests API

`petproj/app/api/v1/social/interests/route.ts`

```
POST /api/v1/social/interests
Auth: required
Body: { tagIds: number[] }
Action:
  1. Upsert user_interest_picks
  2. Upsert user_interest_scores at +1.0 per tag (capped)
  3. Log to user_interest_events: event_type='onboarding'
  4. Set users.feed_personalization_tier = 'warming'
Response: { success: true }

GET /api/v1/social/content-tags
Response: { categories: { species: Tag[], topic: Tag[], content_type: Tag[], mood: Tag[] } }
where Tag = { tag_id, slug, label }
```

---

## 11. Personalized Feed

File: `petproj/app/api/v1/social/posts/route.ts` (GET handler)

Add `mode=personalized`. Filter out quarantined posts. Reuse existing CTEs, extend with affinity.

```sql
-- Add to existing CTE chain:

user_max_interest AS (
  SELECT COALESCE(MAX(score), 0.01) AS max_score
  FROM user_interest_scores
  WHERE user_id = $viewer_id
),

post_affinity AS (
  SELECT
    pct.post_id,
    COALESCE(AVG(uis.score) FILTER (WHERE pct.role = 'primary'), 0) AS avg_primary_interest,
    COUNT(*) FILTER (WHERE pct.role = 'primary') AS primary_count
  FROM post_content_tags pct
  LEFT JOIN user_interest_scores uis
    ON uis.tag_id = pct.tag_id AND uis.user_id = $viewer_id
  GROUP BY pct.post_id
  HAVING COUNT(*) FILTER (WHERE pct.role = 'primary') BETWEEN 1 AND 3
),

scored AS (
  SELECT
    p.*,
    -- existing base components unchanged
    ( EXP(-EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 21600.0) * 0.4
      + LEAST(LOG(1 + p.like_count + p.comment_count * 2 + p.repost_count * 3) / 10.0, 0.4) * 0.4
      + CASE
          WHEN p.user_id = $viewer_id        THEN 0.4
          WHEN fs.following_id IS NOT NULL   THEN 0.2
          ELSE 0.0
        END * 0.2
    ) AS base_score,
    CASE
      WHEN pa.avg_primary_interest IS NOT NULL
        THEN pa.avg_primary_interest / umi.max_score
      ELSE 0
    END AS a_norm_feed,
    -- Phase 1 MVP candidate: max ≈ 0.748 (not 1.0 — scores are relative rankings)
    0.70 * base_score + 0.30 * a_norm_feed AS relevance_score
  FROM social_posts p
  LEFT JOIN following_set fs ON fs.following_id = p.user_id
  LEFT JOIN post_affinity pa ON pa.post_id = p.post_id
  CROSS JOIN user_max_interest umi
  WHERE p.is_hidden = false
    AND p.is_deleted = false
    AND (p.moderation_state IS NULL OR p.moderation_state != 'quarantined')
)
```

> **A/B note:** Control = existing `mode=global` formula (base only). Treatment = `mode=personalized` above.
> Same `base_score` definition in both — experiment isolates the affinity term only.

Phase 1: `ORDER BY relevance_score DESC LIMIT 20` — no application-layer MMR yet.

---

## Handoff checklist to Person B

- [ ] DB migration run + schema confirmed
- [ ] `GET /api/v1/admin/social/content-tags` → grouped tag list
- [ ] `GET /api/v1/admin/social/tagging-queue` → posts with hashtags + media
- [ ] `POST /api/v1/admin/social/posts/:id/tags` → tags + backfill working
- [ ] `POST /api/v1/admin/social/posts/:id/reject` → sets hidden state
- [ ] `GET /api/v1/admin/social/reports` → sorted with burst flags
- [ ] `PATCH /api/v1/admin/social/reports/:id` → dismiss/confirm updates trust correctly
- [ ] `PATCH /api/v1/admin/social/posts/:id/moderate` → sets moderation_state
- [ ] `GET/PATCH /api/v1/admin/social/settings` → returns + updates settings JSON
- [ ] `GET /api/v1/social/content-tags` → tag list for RN
- [ ] `POST /api/v1/social/interests` → seeds scores + sets tier
- [ ] `GET /api/v1/social/posts?mode=personalized` → returns scored + quarantine-filtered feed
