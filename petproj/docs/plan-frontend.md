# Feed Algorithm — Frontend Plan (Person B)

> **Parallel track:** Person A is building the DB migrations and all APIs.
> See `petproj/docs/plan-backend.md` for their work.
>
> **APIs you depend on (build UI with mocked data first; wire live when Person A confirms ready):**
> - `GET /api/v1/admin/social/content-tags` → tag list for picker + create-tag form
> - `GET /api/v1/admin/social/tagging-queue` → queue of untagged posts
> - `POST /api/v1/admin/social/posts/:id/tags` → submit tags on a post
> - `POST /api/v1/admin/social/content-tags` → admin creates a new tag on the fly
> - `GET /api/v1/social/content-tags` → tag list for RN onboarding picker
> - `POST /api/v1/social/interests` → save onboarding picks
> - `GET /api/v1/social/posts?mode=personalized` → For You tab feed
>
> **Expected shapes (confirm with Person A):**
> ```ts
> // GET /api/v1/admin/social/content-tags
> { categories: { species: Tag[], topic: Tag[], content_type: Tag[], mood: Tag[] } }
> // where Tag = { tag_id: number, slug: string, label: string }
>
> // GET /api/v1/admin/social/tagging-queue
> {
>   posts: [{
>     post_id: number, content: string, post_type: string,
>     created_at: string, hours_untagged: number,
>     media: [{ url: string, media_type: string }],
>     report_count: number
>   }],
>   total_untagged: number
> }
> ```
>
> **Communicate with Person A:** Tell them which API shapes you need before starting wiring.

---

## 1. Admin Tagging UI

### Location
`petproj/app/admin-panel/social/tagging/page.tsx`

Add this page to the existing `/admin-panel` layout. Add a "Social Tagging" link to the admin panel dashboard (`petproj/app/admin-panel/page.tsx`).

### Page layout

```
┌─────────────────────────────────────────────────────┐
│  Social Tagging Queue          [X untagged]  [⚠ Y SLA breach]  │
│  Filter: [All] [Media] [Text] [SLA breach]          │
├──────────────────┬──────────────────────────────────┤
│  POST PREVIEW    │  TAG PICKER                      │
│                  │                                  │
│  [image/video]   │  Primary tags (pick 1–3)         │
│                  │  ○ Cat  ○ Dog  ○ Bird ...        │
│  Caption text    │  ○ Training  ○ Grooming ...      │
│  shown here      │                                  │
│                  │  Secondary tags (optional)        │
│  Posted by:      │  □ Cute  □ Educational ...       │
│  @username       │                                  │
│  2h ago          │  [+ Create new tag]              │
│                  │                                  │
│                  │  [Save Tags]  [Skip]             │
├──────────────────┴──────────────────────────────────┤
│  ← Previous post                    Next post →     │
└─────────────────────────────────────────────────────┘
```

### Behavior

**Queue navigation:** Load posts one at a time (or paginated list on left, detail on right on wider screens). Default sort: oldest untagged first.

**Tag picker:**
- Tags grouped by category (species / topic / content_type / mood)
- Primary tags: radio-style multi-select, max 3, min 1 required to save
- Secondary tags: checkbox, no limit
- Tags fetched once on page load from `GET /api/v1/admin/social/content-tags`

**"Create new tag" flow:**
- Admin clicks "+ Create new tag"
- Inline form appears: label input + category dropdown (species/topic/content_type/mood)
- Submit calls `POST /api/v1/admin/social/content-tags`
- New tag appears in picker immediately (optimistic add to local tag list)
- Admin can then select the new tag on the current post

> **Why admin can create tags:** The ~30 seeded tags are defaults only.
> A post about "aquarium fish care" may not fit any seed tag perfectly.
> Admins should be able to add tags like `aquarium` or `fish-care` on the fly.
> Tags go live immediately for future posts too.

**Save Tags:**
- Calls `POST /api/v1/admin/social/posts/:id/tags` with selected tags
- On success: advance to next post in queue, decrement untagged count
- Show brief success toast

**Skip:** Move to next post without tagging. Post stays in queue.

**SLA badge:** If `hours_untagged > 4`, show orange warning badge on post card.

### Mock data (use while Person A's API isn't ready)

```ts
const MOCK_TAGS = {
  species: [
    { tag_id: 1, slug: 'cat', label: 'Cat' },
    { tag_id: 2, slug: 'dog', label: 'Dog' },
  ],
  topic: [
    { tag_id: 8, slug: 'training', label: 'Training' },
    { tag_id: 9, slug: 'grooming', label: 'Grooming' },
  ],
  content_type: [],
  mood: []
};

const MOCK_QUEUE = {
  posts: [{
    post_id: 1, content: 'Look at my new kitten!',
    post_type: 'image', created_at: new Date().toISOString(),
    hours_untagged: 2,
    media: [{ url: 'https://placekitten.com/400/400', media_type: 'image' }],
    report_count: 0
  }],
  total_untagged: 12
};
```

---

## 2. React Native — Onboarding Interest Picker

### Location
`paltuu-reactnative/app/(auth)/interests.tsx`

Insert this screen into the auth flow after OTP verification (after `otp.tsx`). After interests are saved, navigate to main app.

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

- Fetch tags from `GET /api/v1/social/content-tags` on mount
- Show species first (most important for personalization), then topics
- Tap a card to toggle selected state (highlighted border)
- "Continue" is disabled until ≥1 tag selected
- On Continue: `POST /api/v1/social/interests` with `{ tagIds: number[] }` → navigate to `/(app)/`
- "Skip for now": navigate to `/(app)/` without posting — user gets global feed until they pick

### Navigation change

In `paltuu-reactnative/app/(auth)/otp.tsx` (or wherever auth flow ends), after successful auth:
- Check if `user_interest_picks` count = 0 (add a flag in the login/register response, or check on app launch)
- If zero picks: navigate to `/(auth)/interests`
- If picks exist: navigate to `/(app)/`

Simpler approach: always show interests screen on first login after register. Skip on subsequent logins.

### Mock data (use while Person A's API isn't ready)

```ts
const MOCK_CONTENT_TAGS = [
  { tag_id: 1, slug: 'cat', label: 'Cat', category: 'species' },
  { tag_id: 2, slug: 'dog', label: 'Dog', category: 'species' },
  { tag_id: 3, slug: 'bird', label: 'Bird', category: 'species' },
  { tag_id: 8, slug: 'training', label: 'Training', category: 'topic' },
  { tag_id: 9, slug: 'grooming', label: 'Grooming', category: 'topic' },
  { tag_id: 10, slug: 'funny', label: 'Funny', category: 'topic' },
];
```

---

## 3. React Native — Feed Tabs

### Location
`paltuu-reactnative/app/(app)/index.tsx`

Replace the current single-mode feed with two tabs.

### Current state
```ts
// Currently hardcoded:
socialApi.getFeed(pageParam, 20, 'global')
```

### Target state

```tsx
// Two tabs: For You | Following
const [activeTab, setActiveTab] = useState<'personalized' | 'following'>('personalized');

// Feed call changes based on tab:
const feedMode = activeTab === 'personalized' ? 'personalized' : 'following';
socialApi.getFeed(pageParam, 20, feedMode);
```

Tab bar at top of feed:
```
┌──────────────────────────────┐
│  [For You]  [Following]      │  ← tab bar
│  ─────────                   │  ← active underline
│                              │
│  ... posts ...               │
└──────────────────────────────┘
```

**Cold-start handling:** If user has no interest picks (check once on mount), show `mode=global` under the "For You" tab with a soft banner:

```
"Personalize your feed → Pick your interests"  [Go]
```

Tapping "Go" navigates to `/(auth)/interests` (or a modal version of the same screen).

**Following tab:** Already works — just pass `mode=following`. No change needed in the API.

---

## Handoff checklist from Person A

Before wiring live APIs, confirm these are ready:

- [ ] `GET /api/v1/admin/social/content-tags` — tag list shape confirmed
- [ ] `GET /api/v1/admin/social/tagging-queue` — queue shape confirmed
- [ ] `POST /api/v1/admin/social/posts/:id/tags` — accepts `{ tags: [{tag_id, role}] }`
- [ ] `POST /api/v1/admin/social/content-tags` — accepts `{ label, category, slug? }`
- [ ] `GET /api/v1/social/content-tags` — tag list for RN (same shape as admin version)
- [ ] `POST /api/v1/social/interests` — accepts `{ tagIds: number[] }`
- [ ] `GET /api/v1/social/posts?mode=personalized` — returns scored feed

---

## Build order (suggested)

1. **Admin tagging UI** — highest value; unblocks the whole personalization system
2. **RN interest picker** — can build with mocks immediately
3. **RN feed tabs** — simplest change; do last once both above are done
