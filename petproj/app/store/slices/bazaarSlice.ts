import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getFeaturedProductIds } from '@/app/bazaar/curatedProducts';

export interface Product {
  product_id: number;
  title: string;
  slug: string;
  price: string;
  original_price?: string;
  image: string;
  collection_name: string;
  featured?: boolean;
  variants?: any[];
  rating?: number;
  reviewCount?: number;
}

export interface CategorySection {
  title: string;
  products: Product[];
  lastFetched: number;
  loading: boolean;
  error: string | null;
}

interface BazaarState {
  categories: Record<string, CategorySection>;
  globalLoading: boolean;
  lastGlobalFetch: number;
  cacheExpiry: number; // Cache TTL in milliseconds
}

const CACHE_TTL = 30 * 1000; // 30 seconds cache - Redis does the heavy caching
const INITIAL_SECTIONS = [
  'Trending',
  'Most Discounted',
  'Cat Food',
  'Dog Food',
  'Accessories & Grooming',
  'Housing'
];

const initialState: BazaarState = {
  categories: INITIAL_SECTIONS.reduce((acc, section) => {
    acc[section] = {
      title: section,
      products: [],
      lastFetched: 0,
      loading: false,
      error: null,
    };
    return acc;
  }, {} as Record<string, CategorySection>),
  globalLoading: false,
  lastGlobalFetch: 0,
  cacheExpiry: CACHE_TTL,
};

// Category configuration for API calls
const categoryConfigs = [
  {
    title: "Trending",
    slug: null,
    sortBy: 'trending',
    type: 'special',
    featuredKey: 'trending' as const,
  },
  {
    title: "Most Discounted",
    slug: null,
    sortBy: 'discount',
    type: 'special',
    featuredKey: 'discount' as const,
  },
  {
    title: "Cat Food",
    slug: 'food',
    categoryId: 1,
    subFilter: 'cat',
    featuredKey: 'catFood' as const,
  },
  {
    title: "Dog Food",
    slug: 'food',
    categoryId: 1,
    subFilter: 'dog',
    featuredKey: 'dogFood' as const,
  },
  {
    title: "Accessories & Grooming",
    slug: 'accessories',
    categoryId: 2,
    multiCategory: ['accessories', 'grooming'],
    featuredKey: 'accessoriesGrooming' as const,
  },
  {
    title: "Housing",
    slug: 'housing',
    categoryId: 4,
    featuredKey: 'housing' as const,
  },
];

// Async thunk to fetch products for a specific category
export const fetchCategoryProducts = createAsyncThunk(
  'bazaar/fetchCategoryProducts',
  async (categoryTitle: string, { rejectWithValue }) => {
    try {
      const categoryConfig = categoryConfigs.find(cat => cat.title === categoryTitle);
      if (!categoryConfig) {
        throw new Error(`Category configuration not found for: ${categoryTitle}`);
      }

      const params = new URLSearchParams();

      // Check if there are manually selected featured product IDs for this section
      const featuredIds = categoryConfig.featuredKey ? getFeaturedProductIds(categoryConfig.featuredKey) : null;

      if (featuredIds && featuredIds.length > 0) {
        // Use manually selected featured product IDs
        params.set('featuredIds', featuredIds.join(','));
        params.set('limit', String(Math.min(featuredIds.length, 10))); // Max 10 products per section
        params.set('admin', 'true'); // Ensure curated IDs bypass publish status
      } else {
        // Use automatic filtering based on category type
        params.set('page', '1');
        params.set('limit', '10'); // Only 10 products per category

        if (categoryConfig.sortBy === 'discount') {
          // For discounted section, let API automatically find most discounted products
          params.set('sortBy', 'discount');
        } else if (categoryConfig.sortBy === 'trending') {
          // For trending section, get featured products or newest
          params.set('sortBy', 'trending');
        } else {
          // For category-based sections (food, accessories, healthcare)
          if (categoryConfig.slug) {
            params.set('categorySlug', categoryConfig.slug);
          }

          // Add keyword filter for cat/dog food
          if (categoryConfig.subFilter) {
            params.set('keyword', categoryConfig.subFilter);
          }
        }
      }

      params.set('variants', 'true'); // Always fetch variants for pricing

      const res = await fetch(`/api/v1/bazaar/products?${params.toString()}`, { credentials: 'include' });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // Map compare_at_price to original_price for consistency
      const mappedProducts = (data.rows || []).map((p: any) => ({
        ...p,
        original_price: p.compare_at_price,
      }));

      return {
        categoryTitle,
        products: mappedProducts,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error fetching ${categoryTitle}:`, error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Async thunk to fetch all categories at once using batch endpoint
export const fetchAllBazaarCategories = createAsyncThunk(
  'bazaar/fetchAllCategories',
  async (forceRefresh: boolean = false, { getState, dispatch }) => {
    const state = getState() as { bazaar: BazaarState };
    const now = Date.now();

    // Check if we need to refresh (cache expired or force refresh)
    const cacheExpired = now - state.bazaar.lastGlobalFetch > state.bazaar.cacheExpiry;

    if (!forceRefresh && !cacheExpired && state.bazaar.lastGlobalFetch > 0) {
      // Return cached data if still valid
      return { cached: true, timestamp: now, categories: null };
    }

    // Use batch endpoint for faster loading
    const res = await fetch('/api/v1/bazaar/categories', { credentials: 'include' });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.status}`);
    }

    const data = await res.json();

    return {
      cached: false,
      timestamp: data.timestamp || now,
      categories: data.categories
    };
  }
);

// Helper function to check if category data is fresh
export const isCategoryFresh = (categorySection: CategorySection, cacheExpiry: number): boolean => {
  const now = Date.now();
  return now - categorySection.lastFetched < cacheExpiry;
};

const bazaarSlice = createSlice({
  name: 'bazaar',
  initialState,
  reducers: {
    // Clear specific category cache
    clearCategoryCache: (state, action: PayloadAction<string>) => {
      const categoryTitle = action.payload;
      if (state.categories[categoryTitle]) {
        state.categories[categoryTitle].lastFetched = 0;
        state.categories[categoryTitle].products = [];
      }
    },

    // Clear all cache
    clearAllCache: (state) => {
      Object.keys(state.categories).forEach(key => {
        state.categories[key].lastFetched = 0;
        state.categories[key].products = [];
      });
      state.lastGlobalFetch = 0;
    },

    // Update cache expiry time
    setCacheExpiry: (state, action: PayloadAction<number>) => {
      state.cacheExpiry = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle individual category fetch
      .addCase(fetchCategoryProducts.pending, (state, action) => {
        const categoryTitle = action.meta.arg;
        if (state.categories[categoryTitle]) {
          state.categories[categoryTitle].loading = true;
          state.categories[categoryTitle].error = null;
        }
      })
      .addCase(fetchCategoryProducts.fulfilled, (state, action) => {
        const { categoryTitle, products, timestamp } = action.payload;
        if (state.categories[categoryTitle]) {
          state.categories[categoryTitle].products = products;
          state.categories[categoryTitle].lastFetched = timestamp;
          state.categories[categoryTitle].loading = false;
          state.categories[categoryTitle].error = null;
        }
      })
      .addCase(fetchCategoryProducts.rejected, (state, action) => {
        const categoryTitle = action.meta.arg;
        if (state.categories[categoryTitle]) {
          state.categories[categoryTitle].loading = false;
          state.categories[categoryTitle].error = action.payload as string || 'Failed to fetch products';
        }
      })

      // Handle global fetch
      .addCase(fetchAllBazaarCategories.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(fetchAllBazaarCategories.fulfilled, (state, action) => {
        state.globalLoading = false;
        if (!action.payload.cached) {
          state.lastGlobalFetch = action.payload.timestamp;

          // Update all categories with batch data
          if (action.payload.categories) {
            Object.keys(action.payload.categories).forEach(categoryTitle => {
              const categoryData = action.payload.categories![categoryTitle];
              if (state.categories[categoryTitle]) {
                state.categories[categoryTitle] = categoryData;
              }
            });
          }
        }
      })
      .addCase(fetchAllBazaarCategories.rejected, (state) => {
        state.globalLoading = false;
      });
  },
});

export const { clearCategoryCache, clearAllCache, setCacheExpiry } = bazaarSlice.actions;
export default bazaarSlice.reducer;