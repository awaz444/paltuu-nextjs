SEO & GEO Master Plan
Current State — What You Have
Asset	Status
robots.ts	Allows all crawlers, sitemap linked
sitemap.ts	Exists but only covers 6 static pages + blogs — missing all dynamic pet/vet/product pages
Blog system	Infrastructure ready, 7 posts exist
Metadata	Only blogs and marketplace product pages have proper Open Graph/metadata
Key pages (pets, vets)	All "use client" — invisible to crawlers
Structured data	Zero JSON-LD anywhere
Google Analytics	GA4 integrated
Google Search Console	Not confirmed — needs verification
Phase 1 — Critical Fixes (Do These First)
1. Fix the Sitemap — Your #1 ranking blocker

Your sitemap only has 6 pages. Google doesn't know your vet pages, pet pages, or products exist.

Update app/sitemap.ts to dynamically include:

All /browse-pets/[pet_id] pages (fetch from your DB/API)
All /pet-care/[vet-id] pages
All /marketplace/[product_id] pages

2. Convert Vet & Pet detail pages to SSR

/pet-care/[vet-id]/page.tsx and /browse-pets/[pet_id]/page.tsx are "use client" — Google's crawler sees blank pages. The fix:


// Server parent (no "use client") fetches data, adds generateMetadata()
// Client child handles interactive UI (modals, forms, carousel)
This is the same pattern already working in /marketplace/[product_id]/page.tsx — just replicate it.

3. Add generateMetadata() to pet and vet pages

Each pet should have:

Title: "Adopt [Pet Name] — [Breed] in [City] | Paltuu.pk"
Description: AI-generated or template-based summary
OpenGraph image: pet's photo
Each vet should have:

Title: "Dr. [Name] — Vet in [City] | Paltuu.pk"
Keywords: vet + city name
Phase 2 — GEO (Generative Engine Optimization)
GEO = getting cited by ChatGPT, Gemini, Perplexity, Claude when someone asks about pets in Pakistan. These AIs pull from:

Well-structured, factual content pages
Blogs with clear authorship and entities
Schema.org structured data
What to add:

a. Organization JSON-LD (in app/layout.tsx):


{
  "@type": "Organization",
  "name": "Paltuu",
  "url": "https://paltuu.pk",
  "description": "Pakistan's first pet adoption and pet care platform",
  "areaServed": "PK",
  "sameAs": ["your Instagram", "your Facebook"]
}
b. Product JSON-LD on each marketplace/product page (already partially there, just needs JSON-LD)

c. LocalBusiness JSON-LD on each vet page:


{
  "@type": "Veterinarian",
  "name": "Dr. X",
  "address": { city, country: "PK" },
  "telephone": "...",
  "priceRange": "PKR"
}
d. Article JSON-LD on each blog post (already has good metadata, needs the JSON-LD layer)

Phase 3 — Keyword Strategy
Target keywords mapped to pages:

Keyword	Page to Rank	Current Status
paltu / paltuu	Homepage	You own this — just need GSC verification
pet adoption pakistan	/browse-pets	Page is CSR — invisible to Google
adopt dogs pakistan	/browse-pets	Same
adopt cats pakistan	/browse-pets	Same
cat food pakistan	/marketplace?category=cat-food	No metadata
dog food pakistan	/marketplace?category=dog-food	No metadata
cat litter pakistan	/marketplace?category=litter	No metadata
vet karachi / lahore	/pet-care/[vet-id]	CSR — invisible
Fix: Adding pakistan to all keyword targeting is the right move. Searchers in Pakistan use city names + pakistan heavily.

Phase 4 — First 3 Blog Posts to Write
These are chosen to target your exact keywords while being genuinely useful (which is what Google and AI engines reward):

Blog 1: "How to Adopt a Dog or Cat in Pakistan (2025 Guide)"

Target keywords: pet adoption pakistan, adopt dog pakistan, adopt cat pakistan, paltu, paltuu
What to cover: step-by-step process, mention Paltuu's platform, shelters in Karachi/Lahore/Islamabad, legal considerations, what to prepare
Internal links: /browse-pets, /rescue-pets, /pet-care
Why: This is the highest-intent keyword for your core business. Someone searching this is ready to adopt.
Blog 2: "Best Cat Food Brands Available in Pakistan (2025)"

Target keywords: cat food pakistan, best cat food, cats, cat food brands
What to cover: top 5-8 brands available in Pakistan (Royal Canin, Whiskas, etc.), wet vs dry, price ranges in PKR, where to buy
Internal links: /marketplace?category=cat-food
Why: High purchase intent, connects to your marketplace even while Bazaar is paused, keeps you ranking for the category
Blog 3: "Best Dog Food Brands in Pakistan — Complete Guide"

Target keywords: dog food pakistan, dog food, dogs, dog food brands
What to cover: same structure as cat food post but for dogs, include large breed vs small breed options, price in PKR
Internal links: /marketplace?category=dog-food
Why: Mirrors the cat food post, doubles your coverage on high-intent purchase keywords
Format for all three: 1200-1800 words, include H2/H3 subheadings, a quick-answer intro paragraph (targets featured snippets and AI citations), city-specific callouts (Karachi, Lahore, Islamabad), and a CTA to Paltuu.

Phase 5 — Technical Checklist
 Submit sitemap to Google Search Console at search.google.com/search-console
 Verify domain ownership in GSC (add the HTML tag to layout.tsx metadata)
 Add canonical tags to all pages that don't have them
 Add hreflang="en-PK" to layout for Pakistani English targeting
 Set up next/image alt text properly on all product/pet images (currently missing on many)
 Add breadcrumb JSON-LD on nested pages (/pet-care/[vet-id], /browse-pets/[pet_id])
 Set up Google Business Profile for Paltuu (helps local search)
 Add social media profiles to Organization JSON-LD (sameAs array) to boost entity recognition by AI engines
On the App Launch
When the app launches, add:

App store links in layout metadata (apple-itunes-app and google-play-app meta tags)
A landing page at /app with proper metadata targeting paltuu app, pet app pakistan
Deep link schema (WebSite JSON-LD with potentialAction: SearchAction) so Google can link directly into the app