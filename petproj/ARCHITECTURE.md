# MDX Blog System Architecture

## 📊 System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTENT LAYER                             │
│                     (File-Based Storage)                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │     /content/blogs/*.mdx                  │
        │  ┌─────────────────────────────────────┐  │
        │  │  Frontmatter (YAML)                 │  │
        │  │  - title, slug, description         │  │
        │  │  - category, tags, author           │  │
        │  │  - date, featuredImage              │  │
        │  └─────────────────────────────────────┘  │
        │  ┌─────────────────────────────────────┐  │
        │  │  Content (Markdown)                 │  │
        │  │  - Headings (H2, H3)                │  │
        │  │  - Paragraphs, lists                │  │
        │  │  - Blockquotes, code                │  │
        │  │  - Internal links                   │  │
        │  └─────────────────────────────────────┘  │
        └───────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UTILITY LAYER                               │
│                      /lib/mdx.ts                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │  Read     │   │  Parse    │   │  Compile  │
        │  Files    │   │  Front-   │   │  MDX      │
        │           │   │  matter   │   │           │
        └───────────┘   └───────────┘   └───────────┘
                │               │               │
                └───────────────┼───────────────┘
                                ▼
                    ┌───────────────────────┐
                    │  BlogMetadata[]       │
                    │  - All blog metadata  │
                    │  - Sorted by date     │
                    │  - Reading time calc  │
                    └───────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
└─────────────────────────────────────────────────────────────────┘
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │ /blogs       │ │ /blogs/    │ │ Components │
        │ (Listing)    │ │ [slug]     │ │            │
        └──────────────┘ └────────────┘ └────────────┘
                │               │               │
                ▼               ▼               ▼
        ┌──────────────┐ ┌────────────┐ ┌────────────┐
        │ Server       │ │ Server     │ │ BlogCard   │
        │ Component    │ │ Component  │ │            │
        │ - Fetch data │ │ - Generate │ │ - Display  │
        │ - Get cats   │ │   metadata │ │   preview  │
        └──────────────┘ │ - Compile  │ └────────────┘
                │        │   MDX      │
                ▼        └────────────┘
        ┌──────────────┐        │
        │ Client       │        ▼
        │ Component    │ ┌────────────┐
        │ - Filter     │ │ Rendered   │
        │ - Search     │ │ Blog Post  │
        │ - Display    │ │ - Hero     │
        └──────────────┘ │ - Content  │
                         │ - Sidebar  │
                         │ - Related  │
                         └────────────┘
```

## 🔄 Data Flow

### Blog Listing Page (`/blogs`)

```
1. User visits /blogs
   │
   ▼
2. Server Component (page.tsx)
   │
   ├─► getAllBlogsMetadata()
   │   └─► Returns BlogMetadata[]
   │
   ├─► getAllCategories()
   │   └─► Returns string[]
   │
   ▼
3. Pass data to Client Component
   │
   ▼
4. BlogsPageClient.tsx
   │
   ├─► State: selectedCategory, searchQuery
   │
   ├─► Filter blogs by category
   │
   ├─► Filter blogs by search
   │
   ▼
5. Render BlogCard for each blog
   │
   ▼
6. User sees filtered blog grid
```

### Individual Blog Page (`/blogs/[slug]`)

```
1. Build Time
   │
   ├─► generateStaticParams()
   │   └─► getAllBlogSlugs()
   │       └─► Creates static pages for all blogs
   │
   ▼
2. User visits /blogs/some-slug
   │
   ▼
3. Server Component (page.tsx)
   │
   ├─► generateMetadata()
   │   └─► getBlogBySlug(slug)
   │       └─► Returns metadata for SEO
   │
   ├─► getBlogBySlug(slug)
   │   │
   │   ├─► Read MDX file
   │   ├─► Parse frontmatter
   │   ├─► Compile MDX to React
   │   └─► Calculate reading time
   │
   ├─► getRelatedBlogs(slug)
   │   └─► Returns related posts
   │
   ▼
4. Render blog post
   │
   ├─► Hero section
   ├─► Breadcrumbs
   ├─► MDX content
   ├─► Author card
   ├─► Related posts
   └─► CTA section
   │
   ▼
5. User sees complete blog post
```

## 🗂️ File Organization

```
petproj/
│
├── content/                    # Content Layer
│   └── blogs/
│       ├── _TEMPLATE.mdx       # Template for new blogs
│       ├── blog-1.mdx          # Blog post 1
│       ├── blog-2.mdx          # Blog post 2
│       └── ...
│
├── lib/                        # Utility Layer
│   └── mdx.ts                  # MDX utilities
│       ├── getAllBlogSlugs()
│       ├── getBlogMetadata()
│       ├── getAllBlogsMetadata()
│       ├── getBlogBySlug()
│       ├── getBlogsByCategory()
│       ├── getBlogsByTag()
│       ├── searchBlogs()
│       ├── getAllCategories()
│       ├── getAllTags()
│       ├── getRelatedBlogs()
│       └── formatDate()
│
├── app/                        # Presentation Layer
│   └── blogs/
│       ├── page.tsx            # Server: Fetch data
│       ├── BlogsPageClient.tsx # Client: Filter & display
│       └── [slug]/
│           └── page.tsx        # Dynamic blog page
│
└── components/                 # UI Components
    └── blog/
        └── BlogCard.tsx        # Blog preview card
```

## 🎯 Component Responsibilities

### Server Components (RSC)
- **Purpose**: Data fetching, SEO metadata
- **Location**: `app/blogs/page.tsx`, `app/blogs/[slug]/page.tsx`
- **Responsibilities**:
  - Fetch blog metadata
  - Generate SEO tags
  - Compile MDX content
  - Pass data to client components

### Client Components
- **Purpose**: Interactivity, filtering
- **Location**: `app/blogs/BlogsPageClient.tsx`
- **Responsibilities**:
  - Handle user input (search, filters)
  - Client-side state management
  - Dynamic UI updates

### Utility Functions
- **Purpose**: Data processing
- **Location**: `lib/mdx.ts`
- **Responsibilities**:
  - File system operations
  - Frontmatter parsing
  - MDX compilation
  - Data transformation

## 🔐 Type Safety

```typescript
// Core Interface
interface BlogMetadata {
    title: string;
    slug: string;
    description: string;
    category: string;
    featuredImage: string;
    author: string;
    date: string;
    tags: string[];
    readTime?: string;
}

// Extended Interface
interface BlogPost extends BlogMetadata {
    content: string;
}
```

## 🚀 Build Process

```
1. Developer creates MDX file
   │
   ▼
2. Next.js build starts
   │
   ├─► generateStaticParams()
   │   └─► Discovers all blog slugs
   │
   ├─► For each slug:
   │   │
   │   ├─► generateMetadata()
   │   │   └─► Creates SEO tags
   │   │
   │   └─► Render page
   │       └─► Compile MDX
   │           └─► Generate HTML
   │
   ▼
3. Static HTML files created
   │
   ▼
4. Deploy to production
   │
   ▼
5. User requests page
   │
   └─► Instant load (pre-rendered)
```

## 📊 Performance Characteristics

```
┌─────────────────────┬──────────────┬──────────────┐
│ Operation           │ When         │ Performance  │
├─────────────────────┼──────────────┼──────────────┤
│ Read MDX files      │ Build time   │ One-time     │
│ Parse frontmatter   │ Build time   │ One-time     │
│ Compile MDX         │ Build time   │ One-time     │
│ Generate metadata   │ Build time   │ One-time     │
│ Serve blog page     │ Runtime      │ Instant      │
│ Filter/search       │ Client-side  │ Instant      │
└─────────────────────┴──────────────┴──────────────┘
```

## 🎨 Styling Architecture

```
Global Styles
    │
    ├─► Tailwind CSS (utility classes)
    │
    ├─► Custom CSS (blog.module.css)
    │   └─► Prose styles for MDX content
    │
    └─► Design Tokens
        ├─► Primary color: #a03048
        ├─► Font: Montserrat
        └─► Responsive breakpoints
```

## 🔍 SEO Architecture

```
Blog Post
    │
    ├─► HTML Meta Tags
    │   ├─► <title>
    │   ├─► <meta name="description">
    │   └─► <meta name="keywords">
    │
    ├─► Open Graph Tags
    │   ├─► og:title
    │   ├─► og:description
    │   ├─► og:image
    │   ├─► og:type (article)
    │   └─► og:url
    │
    ├─► Twitter Card Tags
    │   ├─► twitter:card
    │   ├─► twitter:title
    │   ├─► twitter:description
    │   └─► twitter:image
    │
    ├─► JSON-LD Schema
    │   └─► Article structured data
    │
    └─► Semantic HTML
        ├─► <article>
        ├─► <header>
        ├─► <h1>, <h2>, <h3>
        └─► <time>
```

---

This architecture provides:
- ✅ **Scalability**: Easy to add new blogs
- ✅ **Performance**: Static generation
- ✅ **SEO**: Comprehensive optimization
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Developer Experience**: Simple content creation
