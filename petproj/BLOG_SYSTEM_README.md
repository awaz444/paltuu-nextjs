# MDX-Based Blog System for Paltuu.pk

## 📁 File Structure

```
petproj/
├── content/
│   └── blogs/
│       ├── essential-pet-care-tips-summer.mdx
│       ├── best-nutrition-for-growing-puppies.mdx
│       ├── why-adopt-dont-shop.mdx
│       ├── cat-grooming-basics.mdx
│       ├── dog-training-commands.mdx
│       └── understanding-vet-visits.mdx
├── lib/
│   └── mdx.ts                          # MDX utility functions
├── app/
│   └── blogs/
│       ├── page.tsx                    # Server component (fetches data)
│       ├── BlogsPageClient.tsx         # Client component (UI + filtering)
│       └── [slug]/
│           ├── page.tsx                # Dynamic blog post page
│           └── blog.module.css         # Blog post styles
└── components/
    └── blog/
        └── BlogCard.tsx                # Blog card component
```

## 🎯 Key Features

### 1. File-Based Content Management
- Each blog post is a `.mdx` file in `/content/blogs/`
- No database required
- Easy to version control
- Simple content updates

### 2. Frontmatter Metadata
Each MDX file contains YAML frontmatter with:
- `title`: Blog post title
- `slug`: URL-friendly identifier
- `description`: SEO meta description
- `category`: Blog category
- `featuredImage`: Hero image URL
- `author`: Author name
- `date`: Publication date (YYYY-MM-DD)
- `tags`: Array of SEO tags

### 3. Dynamic Rendering
- Server-side MDX compilation
- Automatic static generation for all blog posts
- SEO-optimized metadata generation
- JSON-LD structured data

### 4. Advanced Features
- **Reading time calculation**: Automatic estimation
- **Related posts**: Based on category matching
- **Search & filter**: Client-side filtering by category and search query
- **Tag system**: SEO-optimized tags for each post
- **Internal linking**: Natural integration with Paltuu ecosystem

## 📝 Creating a New Blog Post

### Step 1: Create MDX File

Create a new file in `/content/blogs/` with the slug as filename:

```bash
content/blogs/your-blog-slug.mdx
```

### Step 2: Add Frontmatter

```mdx
---
title: "Your Blog Title Here"
slug: "your-blog-slug"
description: "A compelling description for SEO and social sharing"
category: "Pet Care"
featuredImage: "https://images.unsplash.com/photo-xxxxx"
author: "Your Name"
date: "2024-06-15"
tags: ["tag-one", "tag-two", "tag-three", "pakistan-specific"]
---
```

### Step 3: Write Content

Use standard Markdown syntax:

```mdx
Your introduction paragraph goes here.

## Main Heading

Content under the heading with **bold text** and *italic text*.

### Subheading

- Bullet point one
- Bullet point two
- Bullet point three

## Another Section

> This is a blockquote for important callouts

### Numbered List

1. First item
2. Second item
3. Third item

## Internal Linking

Mention keywords like "adoption", "vet", "grooming", "food", or "accessories" to naturally link to Paltuu's core sections.

Example: "Find certified vets on Paltuu's vet listings" or "Browse quality pet food on Paltuu's marketplace".
```

## 🎨 Styling

The blog system uses existing Paltuu design:
- **Font**: Montserrat (unchanged)
- **Primary Color**: #a03048 (unchanged)
- **Typography**: Tailwind Typography plugin
- **Layout**: Responsive grid system

## 🔍 SEO Features

### Automatic SEO Implementation

1. **Dynamic Metadata**
   - Title tags with site branding
   - Meta descriptions from frontmatter
   - Keywords from tags array

2. **Open Graph Tags**
   - Facebook/LinkedIn sharing optimization
   - Featured image integration
   - Article type specification

3. **Twitter Cards**
   - Summary with large image
   - Optimized for Twitter sharing

4. **JSON-LD Schema**
   - Article structured data
   - Author information
   - Publication dates
   - Keywords

5. **Canonical URLs**
   - Prevents duplicate content issues
   - SEO-friendly URL structure

## 📊 MDX Utility Functions

Located in `/lib/mdx.ts`:

### Core Functions

```typescript
// Get all blog slugs
getAllBlogSlugs(): string[]

// Get metadata for a single blog
getBlogMetadata(slug: string): BlogMetadata | null

// Get all blogs metadata (sorted by date)
getAllBlogsMetadata(): BlogMetadata[]

// Get full blog with compiled MDX content
getBlogBySlug(slug: string): Promise<{metadata, content} | null>

// Filter blogs by category
getBlogsByCategory(category: string): BlogMetadata[]

// Filter blogs by tag
getBlogsByTag(tag: string): BlogMetadata[]

// Search blogs
searchBlogs(query: string): BlogMetadata[]

// Get all unique categories
getAllCategories(): string[]

// Get all unique tags
getAllTags(): string[]

// Get related blogs (same category)
getRelatedBlogs(slug: string, limit?: number): BlogMetadata[]

// Format date for display
formatDate(dateString: string): string
```

## 🚀 How It Works

### Blog Listing Page (`/blogs`)

1. **Server Component** (`page.tsx`):
   - Fetches all blog metadata using `getAllBlogsMetadata()`
   - Fetches all categories using `getAllCategories()`
   - Passes data to client component

2. **Client Component** (`BlogsPageClient.tsx`):
   - Handles category filtering
   - Handles search functionality
   - Renders blog cards

### Individual Blog Page (`/blogs/[slug]`)

1. **Static Generation**:
   - `generateStaticParams()` creates pages for all blog slugs
   - Pre-renders all blog posts at build time

2. **Metadata Generation**:
   - `generateMetadata()` creates SEO tags dynamically
   - Uses frontmatter data for all metadata

3. **Content Rendering**:
   - Fetches blog using `getBlogBySlug()`
   - Compiles MDX to React components
   - Renders with Tailwind Typography styles

## 🏷️ Tag Strategy

### Best Practices

1. **Lowercase with hyphens**: `pet-care-tips`
2. **Specific, not generic**: Avoid "pets", "animals"
3. **Include location**: `karachi-vets`, `pakistan-adoption`
4. **Action-oriented**: `how-to-train-puppy`
5. **Problem-solving**: `prevent-heatstroke`

### Example Tags

```yaml
tags: 
  - "summer-pet-care"
  - "heatstroke-prevention"
  - "pet-safety-pakistan"
  - "karachi-summer-pets"
  - "hot-weather-tips"
```

## 🔗 Internal Linking

### Automatic Detection

The system detects these keywords and suggests linking:

- **adoption** → `/rescue-pets`
- **vet/veterinarian** → `/pet-care`
- **food/nutrition** → `/marketplace`
- **grooming** → `/pet-care`
- **training** → `/pet-care`
- **accessories** → `/marketplace`

### Manual Linking

Add natural mentions in your content:

```mdx
Find certified veterinarians on Paltuu's vet listings.

Browse quality pet food on Paltuu's marketplace.

Explore adoptable pets on Paltuu's rescue pets section.
```

## 📱 Responsive Design

- **Mobile**: Single column, optimized touch targets
- **Tablet**: 2-column grid
- **Desktop**: 3-column grid with sticky sidebar

## ⚡ Performance

- **Lazy loading**: Images load on scroll
- **Static generation**: Pre-rendered at build time
- **Optimized images**: Next.js Image component
- **Code splitting**: Automatic by Next.js

## 🎯 Categories

Available categories (from existing content):
- Pet Care
- Health
- Nutrition
- Grooming
- Training
- Adoption Stories

## 📈 Analytics Ready

The system is ready for analytics integration:
- Unique blog post IDs (slugs)
- Category tracking
- Tag tracking
- Reading time metrics

## 🔄 Migration from Old System

The old `data.ts` file is no longer used. All content is now in MDX files. The existing 6 blog posts have been migrated to:

1. `essential-pet-care-tips-summer.mdx`
2. `best-nutrition-for-growing-puppies.mdx`
3. `why-adopt-dont-shop.mdx`
4. `cat-grooming-basics.mdx`
5. `dog-training-commands.mdx`
6. `understanding-vet-visits.mdx`

## 🛠️ Maintenance

### Adding a Blog
1. Create new `.mdx` file in `/content/blogs/`
2. Add frontmatter
3. Write content
4. Deploy (automatic static generation)

### Updating a Blog
1. Edit the `.mdx` file
2. Update frontmatter if needed
3. Deploy

### Deleting a Blog
1. Remove the `.mdx` file
2. Deploy

## 📦 Dependencies

```json
{
  "@next/mdx": "^latest",
  "@mdx-js/loader": "^latest",
  "@mdx-js/react": "^latest",
  "@types/mdx": "^latest",
  "gray-matter": "^latest",
  "reading-time": "^latest",
  "rehype-highlight": "^latest",
  "rehype-slug": "^latest",
  "rehype-autolink-headings": "^latest"
}
```

## 🎓 Best Practices

1. **Consistent Frontmatter**: Always include all required fields
2. **SEO-Friendly Slugs**: Use lowercase with hyphens
3. **Quality Images**: Use high-resolution featured images
4. **Descriptive Tags**: 5-10 specific, relevant tags
5. **Internal Links**: Naturally mention Paltuu services
6. **Reading Time**: Aim for 3-7 minute reads
7. **Structured Content**: Use headings (H2, H3) for organization
8. **Pakistan Context**: Include local references when relevant

## 🚨 Important Notes

- **No Database**: All content is file-based
- **Build Time**: Blogs are generated at build time
- **Git Friendly**: Easy to track changes and collaborate
- **Type Safe**: Full TypeScript support
- **SEO Optimized**: Automatic metadata generation
- **Design Preserved**: All existing styles maintained
