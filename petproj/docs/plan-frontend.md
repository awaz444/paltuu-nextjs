# Feed Algorithm — Frontend Plan (Person B)

> **Parallel track:** Person A is building the DB migrations and all APIs.
> See `petproj/docs/plan-backend.md` for their work.
>
> **APIs you depend on (build UI with mocked data first; wire live when Person A confirms ready):**
> - `GET /api/v1/admin/social/content-tags` → tag picker + taxonomy manager
> - `POST /api/v1/admin/social/content-tags` → create new tag on the fly
> - `PATCH /api/v1/admin/social/content-tags/:id` → edit tag
> - `GET /api/v1/admin/social/tagging-queue` → tagging queue
> - `POST /api/v1/admin/social/posts/:id/tags` → submit tags
> - `POST /api/v1/admin/social/posts/:id/reject` → reject post
> - `GET /api/v1/admin/social/reports` → report queue
> - `PATCH /api/v1/admin/social/reports/:id` → dismiss / confirm report
> - `PATCH /api/v1/admin/social/posts/:id/moderate` → force state change
> - `GET /api/v1/admin/social/settings` → current settings JSON
> - `PATCH /api/v1/admin/social/settings` → update settings
> - `GET /api/v1/social/content-tags` → tag list for RN onboarding
> - `POST /api/v1/social/interests` → save onboarding picks
> - `GET /api/v1/social/posts?mode=personalized` → For You tab
>
> **Expected shapes (confirm with Person A before wiring):**
> ```ts
> // GET /api/v1/admin/social/content-tags
> { categories: { species: Tag[], topic: Tag[], content_type: Tag[], mood: Tag[] } }
> // Tag = { tag_id: number, slug: string, label: string }
>
> // GET /api/v1/admin/social/tagging-queue
> {
>   posts: [{
>     post_id: number, content: string, post_type: string,
>     created_at: string, hours_untagged: number,
>     media: [{ url: string, media_type: string }],
>     report_count: number, hashtags: string[]
>   }],
>   total_untagged: number
> }
>
> // GET /api/v1/admin/social/reports
> {
>   reports: [{
>     report_id, post_id, post_preview, reason_code, report_weight,
>     post_weighted_score, post_report_count,
>     suspicious_burst_at, author_block_after_report,
>     reporter: { user_id, reporter_trust, trust_ceiling, lifetime_dismissals }
>   }]
> }
> ```
>
> **Communicate with Person A:** Share which shapes you need before wiring each section.

---

## 0. Admin Panel Hub Update

File: `petproj/app/admin-panel/page.tsx`

Add a **Social Moderation** hub card to the existing dashboard, linking to four sub-pages:

```
┌─────────────────────────────┐
│  Social Moderation          │
│  ─────────────────          │
│  🏷  Tagging Queue   [12]   │
│  ⚠   Report Queue    [3]    │
│  🗂  Tag Taxonomy           │
│  🔍  Post Browser           │
└─────────────────────────────┘
```

The numbers in brackets are live untagged / pending report counts fetched on dashboard load.

---

## 1. Admin Tagging UI

### Location
`petproj/app/admin-panel/social/tagging/page.tsx`

### Page layout

```
┌─────────────────────────────────────────────────────┐
│  Tagging Queue   [12 untagged]  [⚠ 3 SLA breach]   │
│  Filter: [All] [Media] [Text] [SLA breach]          │
├──────────────────┬──────────────────────────────────┤
│  POST PREVIEW    │  TAG PICKER                      │
│                  │                                  │
│  [image/video]   │  Primary tags (pick 1–3)         │
│                  │  ○ Cat  ○ Dog  ○ Bird ...        │
│  Caption text    │  ○ Training  ○ Grooming ...      │
│  shown here      │                                  │
│  #hashtags       │  Secondary tags (optional)        │
│  parsed as hints │  □ Cute  □ Educational ...       │
│                  │                                  │
│  Posted by:      │  [+ Create new tag]              │
│  @username 2h ago│                                  │
│  ⚠ 2 reports     │  [Save Tags]  [Reject]  [Skip]  │
├──────────────────┴──────────────────────────────────┤
│  ← Previous                          Next →         │
└─────────────────────────────────────────────────────┘
```

### Behavior

**Queue:** Default sort oldest-first. SLA breach tab shows posts untagged > 4h.

**Tag picker:**
- Grouped by category (species / topic / content_type / mood)
- Primary: multi-select, max 3, min 1 to enable Save
- Secondary: checkboxes, no limit
- Parsed `#hashtags` from caption shown as grey hint chips — clicking a hint pre-selects the closest matching tag if one exists
- Tag list fetched once on page load from `GET /api/v1/admin/social/content-tags`

**"Create new tag" flow:**
- Inline form: label input + category dropdown
- Slug auto-generated from label (lowercased, hyphenated)
- `POST /api/v1/admin/social/content-tags` → new tag added to local list immediately (optimistic)
- Admin can select it on the current post right away
- Tags go live for all future posts and future tagging sessions

**Save:** `POST /api/v1/admin/social/posts/:id/tags` → advance to next post, decrement count, show success toast.

**Reject:** `POST /api/v1/admin/social/posts/:id/reject` → confirm dialog ("Are you sure? This will hide the post.") → advance to next post.

**Skip:** Moves to next post. Post stays in queue.

**SLA badge:** Orange if `hours_untagged > 4`, red if `> 24`.

### Mock data (use while Person A's API isn't ready)

```ts
const MOCK_TAGS = {
  species: [
    { tag_id: 1, slug: 'cat', label: 'Cat' },
    { tag_id: 2, slug: 'dog', label: 'Dog' },
    { tag_id: 3, slug: 'bird', label: 'Bird' },
  ],
  topic: [
    { tag_id: 8, slug: 'training', label: 'Training' },
    { tag_id: 9, slug: 'grooming', label: 'Grooming' },
    { tag_id: 10, slug: 'funny', label: 'Funny' },
  ],
  content_type: [{ tag_id: 18, slug: 'photo', label: 'Photo' }],
  mood: [{ tag_id: 20, slug: 'cute', label: 'Cute' }]
};

const MOCK_QUEUE = {
  posts: [{
    post_id: 1, content: 'Look at my new kitten!',
    post_type: 'image', created_at: new Date().toISOString(),
    hours_untagged: 2,
    media: [{ url: 'https://placekitten.com/400/400', media_type: 'image' }],
    report_count: 0, hashtags: ['kitten', 'cats']
  }],
  total_untagged: 12
};
```

---

## 2. Admin Report Queue UI

### Location
`petproj/app/admin-panel/social/reports/page.tsx`

### Page layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Report Queue    [8 pending]   [⚡ 2 priority]                   │
│  Filter: [All] [Priority] [Burst flagged] [Animal abuse / Hate] │
├────────────────────────────────────────────────────────────────  │
│  POST PREVIEW          REPORT DETAILS           ACTIONS          │
│                                                                  │
│  [image]               Reason: ANIMAL_ABUSE     [Dismiss]        │
│  Caption: "..."        Weighted score: 8.4      [Quarantine]     │
│                        Raw reports: 6           [Confirm Hide]   │
│  ⚡ PRIORITY           Reporter trust: 0.92                      │
│  🚨 Burst flagged      Account age: 45d                          │
│  🔒 Author pre-blocked                                           │
│                        Trust breakdown:                          │
│                        r1: weight 1.5 (trusted)                  │
│                        r2: weight 0.75 (7–30d)                   │
│                        r3: weight 0.0 (new acct)                 │
└──────────────────────────────────────────────────────────────────┘
```

### Behavior

**Sorting:** Burst-flagged and `author_block_after_report` posts pinned top (1h review SLA badge). Then sorted by `post_weighted_score DESC`.

**Priority badge conditions:**
- ⚡ Priority: `report_weight >= 0.8` on any single report
- 🚨 Burst: `suspicious_burst_at` is set
- 🔒 Pre-blocked: `author_block_after_report = true`
- 🐾 Fast-lane: reason is `ANIMAL_ABUSE` or `HATE_SPEECH`

**Actions:**
- **Dismiss** → `PATCH /api/v1/admin/social/reports/:id { action: 'dismiss' }` — restores post, grants 48h immunity, decays reporter trust. Show updated trust value in toast.
- **Quarantine** → `PATCH /api/v1/admin/social/posts/:id/moderate { state: 'quarantined' }` — removes from For You / global, still visible to followers.
- **Confirm Hide** → `PATCH /api/v1/admin/social/reports/:id { action: 'confirm_hide' }` — full hide, boosts reporter trust.

**Reporter trust display:** Show `reporter_trust` and `lifetime_dismissals` per reporter in the breakdown. After each Dismiss action, show inline: "Reporter trust: 0.95 → 0.90".

**Settings tab** (within the reports page, not a separate page):
- Shows current JSON config from `GET /api/v1/admin/social/settings`
- Editable fields: weighted threshold, burst count/window, grace window, fast-lane threshold, immunity hours
- Save calls `PATCH /api/v1/admin/social/settings` — show validation error if feed weights don't sum to 1.0
- Show version history: "Last changed by [admin] at [time]" with one-click rollback

### Mock data

```ts
const MOCK_REPORTS = {
  reports: [{
    report_id: 1, post_id: 42,
    post_preview: { content: 'Suspicious post', media_url: null },
    reason_code: 'ANIMAL_ABUSE', report_weight: 1.5,
    post_weighted_score: 8.4, post_report_count: 6,
    suspicious_burst_at: null, author_block_after_report: true,
    reporter: { user_id: 99, reporter_trust: 0.92, trust_ceiling: 1.0, lifetime_dismissals: 0 }
  }]
};
```

---

## 3. Admin Taxonomy Manager

### Location
`petproj/app/admin-panel/social/tags/page.tsx`

### Layout

```
┌──────────────────────────────────────────┐
│  Tag Taxonomy              [+ New Tag]   │
│                                          │
│  Species                                 │
│  ──────                                  │
│  Cat      [edit] [deactivate]            │
│  Dog      [edit] [deactivate]            │
│  Hamster  [edit] [deactivate]            │
│                                          │
│  Topic                                   │
│  ──────                                  │
│  Training  [edit] [deactivate]           │
│  ...                                     │
└──────────────────────────────────────────┘
```

### Behavior

- Tags grouped by category, sorted by `sort_order`
- **Edit:** inline form — change label, add/remove `keyword_aliases`, adjust `default_weight`
- **Deactivate:** sets `is_active = false` via `PATCH /api/v1/admin/social/content-tags/:id` — deactivated tags are hidden from the tagging picker but stay on posts already tagged with them
- **New Tag:** modal form — label (required), category (required), slug (auto from label, editable), keyword aliases (comma-separated), default weight (default 1.0)
- Tags are live immediately after creation

---

## 4. Admin Post Browser

### Location
`petproj/app/admin-panel/social/posts/page.tsx`

### Layout

Simple paginated table with search + filters:

```
┌────────────────────────────────────────────────────────────┐
│  Post Browser   [Search by content or @username]           │
│  Filter: [All] [Untagged] [Quarantined] [Hidden]           │
├────────────────────────────────────────────────────────────┤
│  Post ID │ Preview │ Tags │ Status │ Reports │ Actions     │
│  42      │ "Cute…" │ cat  │ tagged │ 2       │ [Edit tags] │
│                                               │ [Hide]     │
│                                               │ [Restore]  │
└────────────────────────────────────────────────────────────┘
```

### Behavior

- **Edit tags:** opens the same tag picker from the tagging queue — calls `POST /api/v1/admin/social/posts/:id/tags`
- **Hide / Restore:** `PATCH /api/v1/admin/social/posts/:id/moderate { state: 'hidden' | 'none' }`
- Moderation history for each post sourced from `admin_action_logs` (show last 5 actions inline)
- Status column shows `moderation_state` with color: none=green, quarantined=orange, hidden=red

---

## 5. React Native — Onboarding Interest Picker

### Location
`paltuu-reactnative/app/(auth)/interests.tsx`

Insert after OTP verification (`otp.tsx`). On complete, navigate to `/(app)/`.

### Screen layout

```
┌──────────────────────────────┐
│   What do you love?          │
│   Pick your interests        │
│                              │
│   🐱 Cats    🐶 Dogs         │
│   🐦 Birds   🐇 Rabbits      │
│   🐟 Fish    🦎 Reptiles     │
│                              │
│   ── Topics ──               │
│   Training  Grooming         │
│   Health    Adoption         │
│   Funny     Diary            │
│                              │
│   [Continue]  (min 1 pick)   │
│   [Skip for now]             │
└──────────────────────────────┘
```

### Behavior

- Fetch from `GET /api/v1/social/content-tags` on mount
- Species shown first, then topics
- Tap to toggle (highlighted border = selected)
- Continue disabled until ≥1 selected
- On Continue: `POST /api/v1/social/interests` with `{ tagIds }` → `/(app)/`
- Skip: navigate to `/(app)/` — user sees global feed with personalization prompt banner

### Navigation

In `otp.tsx` (after successful auth), check `has_interest_picks` flag from login/register response.
- `false` → navigate to `/(auth)/interests`
- `true` → navigate to `/(app)/`

Simpler: always show interests after register, skip on login if picks exist.

### Mock data

```ts
const MOCK_CONTENT_TAGS = [
  { tag_id: 1, slug: 'cat', label: 'Cat', category: 'species' },
  { tag_id: 2, slug: 'dog', label: 'Dog', category: 'species' },
  { tag_id: 8, slug: 'training', label: 'Training', category: 'topic' },
  { tag_id: 10, slug: 'funny', label: 'Funny', category: 'topic' },
];
```

---

## 6. React Native — Feed Tabs

### Location
`paltuu-reactnative/app/(app)/index.tsx`

### Current state
```ts
socialApi.getFeed(pageParam, 20, 'global')  // hardcoded
```

### Target state

```tsx
const [activeTab, setActiveTab] = useState<'personalized' | 'following'>('personalized');
const feedMode = activeTab === 'personalized' ? 'personalized' : 'following';
socialApi.getFeed(pageParam, 20, feedMode);
```

```
┌──────────────────────────────┐
│  [For You]  [Following]      │
│  ─────────                   │
│  ... posts ...               │
└──────────────────────────────┘
```

**Cold-start:** If user has no interest picks, show `mode=global` under For You with a soft banner:

```
"Personalize your feed — Pick your interests"  [Go →]
```

"Go" navigates to `/(auth)/interests` or opens it as a modal.

**Following tab:** Pass `mode=following`. No API change needed.

**Author UX on post publish:** Non-blocking toast appears after posting: *"Your post is live! We're categorizing it to improve recommendations."* — no waiting, no hidden state.

---

## Handoff checklist from Person A

- [ ] `GET /api/v1/admin/social/content-tags` — grouped shape confirmed
- [ ] `POST /api/v1/admin/social/content-tags` — returns new tag with `tag_id`
- [ ] `PATCH /api/v1/admin/social/content-tags/:id` — edit confirmed
- [ ] `GET /api/v1/admin/social/tagging-queue` — includes `hashtags[]`
- [ ] `POST /api/v1/admin/social/posts/:id/tags` — backfill confirmed working
- [ ] `POST /api/v1/admin/social/posts/:id/reject` — sets `hidden` state
- [ ] `GET /api/v1/admin/social/reports` — burst flags + trust breakdown in response
- [ ] `PATCH /api/v1/admin/social/reports/:id` — trust updated on dismiss/confirm
- [ ] `PATCH /api/v1/admin/social/posts/:id/moderate` — moderation_state updates correctly
- [ ] `GET/PATCH /api/v1/admin/social/settings` — versioned, sum-to-1.0 validated
- [ ] `GET /api/v1/social/content-tags` — RN shape confirmed
- [ ] `POST /api/v1/social/interests` — seeds scores + sets personalization tier
- [ ] `GET /api/v1/social/posts?mode=personalized` — quarantine-filtered, scored feed

---

## Build order (suggested)

1. **Admin tagging UI** — unblocks personalization; can mock APIs from day 1
2. **Admin report queue** — replaces naive trigger; safety-critical
3. **RN interest picker** — build with mocks in parallel with above
4. **Admin taxonomy manager** — straightforward CRUD, do alongside or after report queue
5. **Admin post browser** — lowest urgency; useful but not blocking
6. **RN feed tabs** — last; depends on personalized mode being live
