// store/slices/marketplaceSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: string;
  original_price?: string;
  category: string;
  collection: string;
  image_url: string;
  inStock?: boolean;
  rating?: number;
  ratingCount?: number;
}

interface MarketplaceState {
  products: Product[];
  lastFetched: number | null; // optional, to track freshness
  meta: { total: number; page: number; limit: number } | null;
  loading: boolean;
  error: string | null;
  lastFilters: string | null;
  hasMore: boolean;
  currentPage: number;
}

const initialState: MarketplaceState = {
  products: [],
  lastFetched: null,
  meta: null,
  loading: false,
  error: null,
  lastFilters: null,
  hasMore: true,
  currentPage: 0,
};

// Async thunk to fetch products with optional filters + pagination
// NOW USING OPTIMIZED ENDPOINT for better performance!
export const fetchProducts = createAsyncThunk(
  'marketplace/fetchProducts',
  async (opts: { page?: number; limit?: number; filters?: any; append?: boolean }, { rejectWithValue }) => {
    try {
      const page = opts.page ?? 1;
      const limit = opts.limit ?? 24;
      const filters = opts.filters ?? {};
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      // Handle new filter parameters
      if (filters.categorySlug) params.set('categorySlug', String(filters.categorySlug));
      if (filters.sortBy) params.set('sortBy', String(filters.sortBy));

      // Send keyword only for text search (searches title and description)
      if (filters.keyword) {
        params.set('keyword', String(filters.keyword));
      }

      // Send petType as separate parameter (filters by category, NOT description)
      if (filters.petType) {
        params.set('petType', String(filters.petType));
      }

      // Legacy support for old filter format
      if (filters.category) params.set('category', String(filters.category));
      if (filters.collection) params.set('collection', String(filters.collection));

      // Request variants only when needed (for stock checking)
      params.set('variants', 'true');

      // 🚀 USING OPTIMIZED ENDPOINT (5-10x faster!)
      const endpoint = `/api/bazaar/products-optimized?${params.toString()}`;

      console.log(`[Marketplace] Fetching from: ${endpoint}`);
      const startTime = Date.now();

      const res = await fetch(endpoint);

      const responseTime = Date.now() - startTime;
      const cacheStatus = res.headers.get('x-cache') || 'N/A';
      const serverTime = res.headers.get('x-response-time') || `${responseTime}ms`;

      console.log(`[Marketplace] Response: ${responseTime}ms | Cache: ${cacheStatus} | Server: ${serverTime}`);

      if (!res.ok) {
        const text = await res.text();
        return rejectWithValue(text || 'Failed to fetch products');
      }
      const data = await res.json();
      return { data, append: !!opts.append, page };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const marketplaceSlice = createSlice({
  name: "marketplace",
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
      state.lastFetched = Date.now();
    },
    clearProducts(state) {
      state.products = [];
      state.lastFetched = null;
      state.meta = null;
      state.lastFilters = null;
      state.hasMore = true;
      state.currentPage = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProducts.pending, (state, _action) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.loading = false;
      const { data, append, page } = action.payload as any;
      const rows = Array.isArray(data.rows) ? data.rows : data;

      // Transform optimized endpoint response to Product format
      const transformed = (rows as any[]).map((product) => {
        // Optimized endpoint returns 'image' (first image) instead of 'images' array
        const imageUrl = product.image || product.images?.[0] || '/placeholder-product.jpg';

        // Handle variants if present
        const firstVariant = product.variants?.[0];
        const displayPrice = firstVariant?.price_override ?? product.price ?? 0;
        const originalPrice = product.compare_at_price || firstVariant?.compare_at_price;
        const hasStock = product.variants ?
          product.variants.some((v: any) => v.stock > 0) :
          true; // Assume in stock if no variants

        return {
          product_id: product.product_id,
          name: product.title || product.name,
          description: product.description || '',
          category: product.categories?.[0]?.name || 'Uncategorized',
          collection: product.collection_name || 'General',
          image_url: imageUrl,
          price: String(displayPrice),
          original_price: originalPrice ? String(originalPrice) : undefined,
          inStock: hasStock,
          rating: 0,
          ratingCount: 0,
        } as Product;
      });

      if (append) {
        state.products = [...state.products, ...transformed];
      } else {
        state.products = transformed;
      }

      state.meta = data.meta ?? { total: transformed.length, page, limit: 24 };
      state.currentPage = page;
      state.lastFetched = Date.now();

      // Update hasMore based on loaded products vs total
      if (state.meta) {
        const loadedCount = append ? state.products.length : transformed.length;
        state.hasMore = loadedCount < state.meta.total;
      } else {
        // Fallback: if no meta, check if we got less than requested limit
        state.hasMore = transformed.length >= (data.limit || 24);
      }

      // store lastFilters for simple TTL-based dedupe in UI
      // We don't read filters here; the caller should set lastFilters via action if needed
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || action.error.message || 'Failed to fetch products';
    });
  }
});

export const { setProducts, clearProducts } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
