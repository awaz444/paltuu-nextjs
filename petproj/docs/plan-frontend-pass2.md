# Frontend Guide — Pass 2 (Personalized Feed + A/B Experiment)

> For Person B. Pass 1 already gave you the admin tagging/moderation/settings APIs and the
> RN onboarding interest picker. **Pass 2 adds two things to wire up:**
> 1. The **"For You" tab** in the React Native app (one new feed mode).
> 2. An **A/B experiment console** in the Admin web UI (3 endpoints: dashboard, user list, move-user).
>
> Nothing from Pass 1 changed. No existing endpoint's response shape changed.

---

## 0. Auth (unchanged, recap)

- **User-facing** (`/api/v1/social/...`): send the logged-in user's JWT as
  `Authorization: Bearer <token>` (same as every other mobile call).
- **Admin** (`/api/v1/admin/social/...`): requires a user whose JWT/session has `role = 'admin'`.
  Web admin uses the NextAuth session cookie automatically; if you call from a tool, send the admin's
  Bearer token. Non-admins get `403 { "error": "Forbidden" }`.

---

## 1. The "For You" tab (React Native)

### What it is
A new ranked feed that mixes the normal feed signals (recency, engagement, who you follow) with
**what each user is interested in** (the tags they picked at onboarding + what they engage with).

### Endpoint

```
GET /api/v1/social/posts?mode=personalized&limit=20&cursor=0
Authorization: Bearer <user token>
```

**This is the ONLY change you need for the feed.** It's the same endpoint you already use for
`?mode=following` / `?mode=global` / `?mode=chronological` — just a new `mode` value.

### Request params
| param | default | notes |
|---|---|---|
| `mode` | — | use `personalized` |
| `limit` | `20` | max 50 |
| `cursor` | `0` | pagination offset; pass back the `next_cursor` you got |

### Response — **identical post shape to the other feed modes**

```jsonc
{
  "posts": [ /* same post objects as ?mode=following — reuse your existing post card */ ],
  "next_cursor": "20",          // string offset, or null when no more pages
  "has_more": true,
  "mode": "personalized",
  "experiment_bucket": "treatment"   // "control" | "treatment" — see §3
}
```

Each post object is **exactly what your current feed renderer already consumes** (`post_id`,
`user_id`, `content`, `media`, `author_name`, `author_image`, `like_count`, `is_liked`, `is_saved`,
`is_reposted`, `original_*` for reposts, `tagged_pets`, etc.). 

> Two extra numeric fields ride along on personalized posts — `base_score`, `score_affinity`,
> `relevance_score`. **Ignore them in the UI**; they're for ranking/debugging only.

### What you DON'T have to do
- No interest logic on the client — ranking is 100% server-side.
- No "cold start" handling — a brand-new user just gets a sensible popularity-based order
  automatically until they build up interests. The endpoint never errors for that.
- No bucket logic — the server decides control vs treatment (§3). You just render `posts`.

### Pagination (same pattern as today)
1. First load: `cursor=0`.
2. On scroll-end: if `has_more`, call again with `cursor = next_cursor`.
3. Stop when `has_more` is `false` / `next_cursor` is `null`.

### Quarantined posts
Posts an admin flags as "quarantined" are automatically hidden from this feed (and from `global`),
but still show in `following`. You don't filter anything — the server does.

---

## 2. Admin: A/B Experiment Console (web)

The experiment compares two groups of users:
- **control** — sees the current feed.
- **treatment** — sees the new personalized feed.

You'll build a small console with **3 screens/actions**.

### 2a. Results dashboard

```
GET /api/v1/admin/social/experiment?days=30
```

`days` (optional, default 30) = the look-back window.

**Response:**
```jsonc
{
  "window_days": 30,
  "control": {
    "users": 1240,
    "active_users": 410,
    "total_actions": 2950,
    "actions_per_active_user": 7.19,
    "impressions": 18800,
    "engagement_per_impression": 0.156
  },
  "treatment": {
    "users": 1255,
    "active_users": 502,
    "total_actions": 4310,
    "actions_per_active_user": 8.58,
    "impressions": 19500,
    "engagement_per_impression": 0.221
  },
  "lift_actions_per_active_user": 0.193   // treatment is +19.3% vs control; null if no control data
}
```

**How to present it (suggested):** two columns (Control vs Treatment) with the rows above, and one
big headline: **"Personalized feed: {lift as %} engagement per user."** Green if positive, red if
negative, grey "not enough data yet" if `lift_actions_per_active_user` is `null`.

Glossary for the UI:
- **actions** = likes + comments + reposts + saves.
- **active_users** = users who did ≥1 action in the window.
- **actions_per_active_user** = the headline "are they engaging more?" number.
- **engagement_per_impression** = actions ÷ feed posts shown (fills in once people use For You).

> Numbers may be near-zero right after launch — impressions only accumulate once users open the
> For You tab. That's expected, not a bug.

### 2b. User list (who's in which arm)

```
GET /api/v1/admin/social/experiment/users?bucket=treatment&q=ali&days=30&limit=50&offset=0
```

All query params optional: `bucket` (`control`|`treatment` filter), `q` (name/username search),
`days` (engagement window), `limit` (max 100), `offset`.

**Response:**
```jsonc
{
  "users": [
    {
      "user_id": 42,
      "name": "Ali Khan",
      "social_username": "ali_k",
      "effective_bucket": "treatment",   // the arm this user is actually in
      "is_overridden": true,             // true = an admin set it; false = automatic even/odd
      "engagement_count": 23             // actions in the window
    }
  ],
  "limit": 50,
  "offset": 0,
  "window_days": 30
}
```

**UI:** a searchable, paginated table. Columns: name/username, arm (badge), "auto" vs "manual"
(`is_overridden`), engagement count. Add a per-row control to move them (2c).

### 2c. Move a user between arms

```
PATCH /api/v1/admin/social/experiment/users/:id
Content-Type: application/json

{ "bucket": "control" }      // "control" | "treatment" | "auto"
```

- `"control"` / `"treatment"` → pin the user to that arm (manual override).
- `"auto"` → remove the override; user returns to the automatic split.

**Response:**
```jsonc
{
  "success": true,
  "user_id": 42,
  "assignment": "control",        // what you sent
  "effective_bucket": "control"   // the arm they're now in
}
```

Errors: `400` invalid bucket / bad id, `404` user not found, `403` not admin.

**UI:** a 3-way toggle (Control / Treatment / Auto) per user, or bulk-select + apply. After success,
update the row's `effective_bucket` and `is_overridden` from the response.

---

## 3. How users get split into the two groups (context, no client work)

- By default the split is **automatic and even/odd by user id** — roughly half the users are in each
  arm, every existing user included, and nobody ever flips arms on their own.
- The `?mode=personalized` response tells you which arm the *current* user is in via
  `experiment_bucket`. **You usually don't need to show this** — it's there for debugging. The feed
  already looks right for whichever arm they're in (control gets the plain ranking, treatment gets
  personalization).
- Admins can override any user via 2c; that override wins over the automatic split.

You do **not** assign buckets from the client. Just render whatever `posts` come back.

---

## 4. Quick test checklist

- [ ] For You tab calls `?mode=personalized`, renders posts with the existing card, paginates via
      `next_cursor`.
- [ ] A user with onboarding interests sees on-interest posts ranked higher (vs `?mode=global`).
- [ ] Admin dashboard renders both arms + the lift headline; handles the `null` lift / zero-data case.
- [ ] Admin user list searches + filters by arm; "auto" vs "manual" badge reflects `is_overridden`.
- [ ] Moving a user (Control/Treatment/Auto) updates the row and persists on refresh.
- [ ] All admin screens show a sensible message on `403` (not an admin).

---

## 5. Not included (by decision)
- **"Time spent in app" metric** — skipped. The dashboard measures engagement (actions per user),
  which is the metric for judging the feed test. If we later want session-length, it needs a
  heartbeat ping from the RN app + a backend endpoint; not built.
