# Paltuu Blog Authoring Guide

How to write and ship a blog post that actually ranks. This is the working
reference; `_TEMPLATE.mdx` is the copy-paste starting point.

Read the **Hard rules** section at minimum — those are enforced by the build or
will silently break your post's SEO.

---

## Hard rules (break these and the post fails or disappears)

### 1. The filename MUST equal the frontmatter `slug`

```
content/blogs/winter-pet-care-tips-pakistan.mdx
                ↑ must match ↓
slug: "winter-pet-care-tips-pakistan"
```

The route is generated from the **filename**, but the canonical URL, sitemap
entry, and every internal link are generated from the **frontmatter slug**. If
they disagree, the post goes live at one URL while telling Google the real
version lives at another URL that returns 404 — the article becomes invisible.

This happened to the cat feeding guide and cost it its entire indexation.
The build now fails loudly on a mismatch, so you'll catch it locally, but don't
rely on the guard — name the file correctly the first time.

**Never rename a published post's slug** without adding a 301 in
`next.config.mjs` → `redirects()`. Changing a slug without a redirect throws
away every backlink and all accumulated ranking history.

### 2. `featuredImage` must be a live URL

It is used three times: the hero image (it's the LCP element), the `og:image`
for social shares, and the `image` in the Article JSON-LD. A dead URL breaks all
three at once.

**Verify before committing:**

```bash
curl -o /dev/null -w "%{http_code}\n" "<your featuredImage URL>"
```

Anything other than `200` is a bug. Three published posts shipped with 404
images because nobody ran this.

- Dimensions: **1200×630** (this is what the OG tags declare)
- Prefer self-hosting in S3/Cloudinary over hotlinking Unsplash. Hotlinked
  images are a third party's decision to break.

### 3. `category` must be one of exactly these six

```
Pet Care | Health | Nutrition | Grooming | Training | Adoption Stories
```

Case-sensitive and exact. The category drives the related-posts sidebar, the
`/blogs?category=` filter, and `articleSection` in the schema. A typo creates an
orphan category containing one post.

### 4. `date` is `YYYY-MM-DD` and must not be in the future

It becomes `datePublished` in the schema and `lastModified` in the sitemap.
A future date tells Google the post doesn't exist yet.

### 5. Don't set `readTime` or `readingTime` in frontmatter

It's computed from the content automatically. Some older posts have it — those
values are ignored dead weight. Leave it out.

---

## Frontmatter

```yaml
---
title: "Winter Pet Care Tips for Dogs & Cats in Pakistan"
slug: "winter-pet-care-tips-pakistan"
description: "From Murree's cold snaps to Karachi's chilly nights, learn how to keep your dog or cat warm, healthy, and safe during Pakistan's winter months."
category: "Pet Care"
featuredImage: "https://images.unsplash.com/photo-1551308075-d5f542da6386?auto=format&fit=crop&q=80&w=1200"
author: "Paltuu Team"
date: "2026-07-31"
tags: ["winter-pet-care-pakistan", "cold-weather-dogs", "cat-winter-safety", "hypothermia-pets", "senior-pet-care"]
---
```

| Field | Rule |
|---|---|
| `title` | **Keep under ~50 characters.** See the title-length warning below. |
| `slug` | lowercase, hyphens, no dates, no stop words. Must equal filename. |
| `description` | 150–160 chars. This is your SERP snippet — write it as ad copy, not a summary. Include the target keyword. |
| `category` | One of the six above, exactly. |
| `featuredImage` | Live 1200×630 URL. Verify with curl. |
| `author` | Real name, or "Paltuu Team". |
| `date` | `YYYY-MM-DD`, not in the future. |
| `updated` | Optional. `YYYY-MM-DD`, set only when refreshing a published post — becomes `dateModified`. |
| `tags` | 5–8, lowercase, hyphen-separated, specific. |

### ⚠️ Title length

The blog route appends `| Paltuu` (8 characters) to every title. Google shows
~60 characters, so **keep titles under ~50 characters** — your title plus the
suffix should read sensibly when cut at 60 chars.

### Tags

Tags become `keywords` in the metadata and power the `/blogs?tag=` filter.

- Good: `puppy-training-tips`, `karachi-pet-adoption`, `tick-fever-dogs`
- Bad: `pets`, `animals`, `tips`, `guide` — too generic to filter on

---

## Content requirements

### Length: 1,200–2,000 words

The 500-word floor in the old template is too low. Our two thinnest posts
(`understanding-vet-visits` at 630 words, `why-adopt-dont-shop` at 880) are our
weakest performers. Below ~1,200 words you're not competitive for anything
worth ranking for.

Length is a symptom, not the goal — hit the word count by covering the topic
completely, not by padding.

### Structure

- **One H1** — auto-generated from `title`. Never write an H1 in the body.
- Body headings start at **H2**. Don't skip levels (no H2 → H4).
- Put the target keyword in the first 100 words, naturally.
- Open with the answer, then elaborate. Don't bury the payoff under 300 words
  of throat-clearing — both readers and AI search engines take the top.
- Short paragraphs (2–4 sentences). Use lists and tables for scannable facts.

### Internal links: minimum 5

Currently posts range from 0 to 22 internal links. Zero-link posts are dead
ends that leak nothing back into the site. Every post needs at least five
contextual links:

- `/browse-pets` — adoptable pets
- `/pet-care` — vet listings
- `/marketplace` — pet products
- `/lost-and-found` — lost pet reports
- 1–2 sibling blog posts on related topics

Link on descriptive anchor text (`adopt a cat in Lahore`), never `click here`.

### In-body images: 2–3 per post

**No published post currently has a single in-body image.** This is one of our
biggest content gaps. Break up long sections with relevant images and write
real alt text describing the image — not the keyword you want to rank for.

### Pakistan context is the moat

Generic pet advice is infinitely available and ranks nowhere. What we can
uniquely offer:

- Real cities: Karachi, Lahore, Islamabad, Murree, Faisalabad
- Local climate: monsoon, 45°C summers, Karachi humidity
- Brands actually sold here: Royal Canin, Pedigree, Whiskas, Brit Care
- PKR pricing, local vet availability, local breed prevalence

Every post should be identifiably about Pakistan within the first paragraph.

### Add an FAQ section

End with 3–5 real questions in H3s with direct answers, under a `##
Frequently Asked Questions` heading. These are what get quoted by AI search
and what qualify for FAQ rich results.

No special MDX syntax needed — the build parses any `## Frequently Asked
Questions` section (### question + answer text, matching every published
post's existing format) and emits matching `FAQPage` schema automatically.
Keep answers as plain text/lists; don't nest another heading inside an
answer, or the parser will treat it as the next question.

---

## Before you publish

Check for **keyword cannibalization** first. If an existing post already
targets your keyword, you'll split your own rankings rather than adding to
them. We already have three posts fighting over "adopt dog Pakistan".

```bash
# Does something already cover this?
grep -ril "your target keyword" content/blogs/
```

If yes: expand the existing post instead of writing a new one.

### Checklist

- [ ] Filename exactly equals frontmatter `slug`
- [ ] `featuredImage` returns `200` (curl it)
- [ ] `category` is one of the six valid values
- [ ] `date` is `YYYY-MM-DD` and not in the future
- [ ] Title under ~50 characters
- [ ] Description is 150–160 chars and reads like ad copy
- [ ] 5–8 specific tags
- [ ] 1,200+ words
- [ ] One H1 (auto), body starts at H2, no skipped levels
- [ ] Target keyword in the first 100 words
- [ ] At least 5 internal links with descriptive anchor text
- [ ] 2–3 in-body images with real alt text
- [ ] Pakistan-specific context throughout
- [ ] FAQ section with 3–5 questions
- [ ] No cannibalization of an existing post
- [ ] `npm run build` passes locally

### Verify locally

```bash
npm run build
```

The build fails on slug mismatches. Then check your post at
`localhost:3000/blogs/<your-slug>` and confirm the hero image renders — a
broken hero means a broken `og:image` too.

---

## After publishing

- New posts enter `/sitemap.xml` automatically on the next deploy. No manual step.
- Link to the new post from 1–2 existing related posts. A post with no inbound
  internal links takes far longer to get indexed.

### Updating an existing post

Refreshing beats republishing. Google rewards freshness on "best X in Pakistan"
queries, and an established URL keeps its history.

Add an `updated: "YYYY-MM-DD"` field to frontmatter when you meaningfully
refresh a post — it becomes `dateModified` in the schema (falls back to
`date` when absent). Don't bump `date` itself on a refresh; that fakes a
publish date and throws away the post's original age signal.
