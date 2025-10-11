import { NextRequest, NextResponse } from "next/server";
import { safeRedis } from "../../../../utils/redis";

const CACHE_TTL_SEC = 300; // 5 minutes

/**
 * BATCH CATEGORIES ENDPOINT
 * Fetches all bazaar categories in a single optimized request
 * Uses Redis caching to minimize load times
 */

interface CategoryConfig {
  title: string;
  slug?: string | null;
  sortBy?: string;
  type?: string;
  featuredKey: string;
  subFilter?: string;
  categoryId?: number;
  multiCategory?: string[];
}

const categoryConfigs: CategoryConfig[] = [
  {
    title: "Trending",
    slug: null,
    sortBy: 'trending',
    type: 'special',
    featuredKey: 'trending',
  },
  {
    title: "Most Discounted",
    slug: null,
    sortBy: 'discount',
    type: 'special',
    featuredKey: 'discount',
  },
  {
    title: "Cat Food",
    slug: 'food',
    categoryId: 1,
    subFilter: 'cat',
    featuredKey: 'catFood',
  },
  {
    title: "Dog Food",
    slug: 'food',
    categoryId: 1,
    subFilter: 'dog',
    featuredKey: 'dogFood',
  },
  {
    title: "Accessories & Grooming",
    slug: 'accessories',
    categoryId: 2,
    multiCategory: ['accessories', 'grooming'],
    featuredKey: 'accessoriesGrooming',
  },
  {
    title: "Healthcare",
    slug: 'healthcare',
    categoryId: 4,
    featuredKey: 'healthcare',
  },
];

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Check cache first
    const cacheKey = 'bazaar:all-categories:v1';

    try {
      const cachedData = await safeRedis.get(cacheKey);
      if (cachedData) {
        const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        console.info(`[Batch Cache HIT] ${cacheKey} (${Date.now() - startTime}ms)`);
        return NextResponse.json(parsed, {
          status: 200,
          headers: {
            'X-Cache': 'HIT',
            'X-Response-Time': `${Date.now() - startTime}ms`,
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
          }
        });
      }
    } catch (e) {
      console.warn('[Batch Cache] Read failed:', e);
    }

    console.info('[Batch Cache MISS] Fetching all categories...');

    // Import featured product IDs
    const { getFeaturedProductIds } = await import('@/app/bazaar/curatedProducts');

    // Fetch all categories in parallel
    const fetchPromises = categoryConfigs.map(async (categoryConfig) => {
      const params = new URLSearchParams();

      // Check if there are manually selected featured product IDs for this section
      const featuredIds = getFeaturedProductIds(categoryConfig.featuredKey as any);

      if (featuredIds && featuredIds.length > 0) {
        params.set('featuredIds', featuredIds.join(','));
        params.set('limit', String(Math.min(featuredIds.length, 10)));
      } else {
        params.set('page', '1');
        params.set('limit', '10');

        if (categoryConfig.sortBy === 'discount') {
          params.set('sortBy', 'discount');
        } else if (categoryConfig.sortBy === 'trending') {
          params.set('sortBy', 'trending');
        } else {
          if (categoryConfig.slug) {
            params.set('categorySlug', categoryConfig.slug);
          }
          // Use petType filter for pet-specific categories (not keyword search)
          if (categoryConfig.subFilter) {
            params.set('petType', categoryConfig.subFilter);
          }
        }
      }

      params.set('variants', 'true');

      // Use relative URL for internal API calls (works in both dev and production)
      const url = `/api/bazaar/products-optimized?${params.toString()}`;

      // Get the request URL to build absolute URL for fetch
      const protocol = req.nextUrl.protocol;
      const host = req.nextUrl.host;
      const absoluteUrl = `${protocol}//${host}${url}`;

      try {
        const res = await fetch(absoluteUrl, {
          cache: 'no-store',
          next: { revalidate: 0 },
          headers: {
            'X-Internal-Request': 'true',
            'Content-Type': 'application/json'
          }
        });        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        // Map compare_at_price to original_price for consistency
        const mappedProducts = (data.rows || []).map((p: any) => ({
          ...p,
          original_price: p.compare_at_price,
        }));

        return {
          title: categoryConfig.title,
          products: mappedProducts,
          error: null,
        };
      } catch (error) {
        console.error(`Error fetching ${categoryConfig.title}:`, error);
        return {
          title: categoryConfig.title,
          products: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const results = await Promise.all(fetchPromises);

    // Format response
    const response = {
      categories: results.reduce((acc, cat) => {
        acc[cat.title] = {
          title: cat.title,
          products: cat.products,
          lastFetched: Date.now(),
          loading: false,
          error: cat.error,
        };
        return acc;
      }, {} as Record<string, any>),
      timestamp: Date.now(),
    };

    // Cache response
    try {
      const serialized = JSON.stringify(response);
      await safeRedis.set(cacheKey, serialized, 'EX', CACHE_TTL_SEC);
      console.info(`[Batch Cache] Stored (${(serialized.length / 1024).toFixed(2)} KB) in ${Date.now() - startTime}ms`);
    } catch (e) {
      console.warn('[Batch Cache] Write failed:', e);
    }

    const totalTime = Date.now() - startTime;
    console.info(`[Batch Perf] TOTAL time: ${totalTime}ms`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'X-Response-Time': `${totalTime}ms`,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (err) {
    console.error('[Batch Error]', err);
    return NextResponse.json(
      { error: "Failed to fetch categories", message: (err as Error).message },
      { status: 500 }
    );
  }
}
