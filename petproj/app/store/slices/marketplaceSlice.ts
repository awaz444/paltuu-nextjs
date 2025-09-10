// store/slices/marketplaceSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
}

const initialState: MarketplaceState = {
  products: [],
  lastFetched: null,
};

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
    },
  },
});

export const { setProducts, clearProducts } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
