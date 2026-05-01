import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

type Product = any;

export const fetchBazaarProducts = createAsyncThunk<Product[], { admin?: boolean } | undefined>(
  'bazaarProducts/fetch',
  async (opts, thunkAPI) => {
    try {
      const query = opts?.admin ? '?admin=true' : '';
      const res = await fetch(`/api/v1/bazaar/products${query}`);
  const data = await res.json();
  // API may return { rows: [...], meta: {...} } or an array or { products: [...] }
  if (data?.rows && Array.isArray(data.rows)) return data.rows as Product[];
      const normalized = Array.isArray(data) ? data : (data?.products && Array.isArray(data.products) ? data.products : []);
      if (!Array.isArray(normalized) && !(data?.rows && Array.isArray(data.rows))) {
        // eslint-disable-next-line no-console
        console.warn('[bazaarProductsSlice] Unexpected API response shape', data);
      }
      return normalized as Product[];
    } catch (e) {
      return [];
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;
      if (state.bazaarProducts.loading) return false;
      return true;
    }
  }
);

const bazaarSlice = createSlice({
  name: 'bazaarProducts',
  initialState: {
    products: [] as Product[],
    loading: false,
    error: null as string | null,
  },
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.products.unshift(action.payload);
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const idx = state.products.findIndex((p: any) => p.product_id === action.payload.product_id || p.id === action.payload.id);
      if (idx !== -1) state.products[idx] = { ...state.products[idx], ...action.payload };
    },
    removeProduct(state, action: PayloadAction<string>) {
      state.products = state.products.filter((p: any) => String(p.product_id || p.id) !== String(action.payload));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBazaarProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBazaarProducts.fulfilled, (state, action) => { state.loading = false; state.products = action.payload; })
      .addCase(fetchBazaarProducts.rejected, (state) => { state.loading = false; state.error = 'Failed to load'; });
  }
});

export const { setProducts, addProduct, updateProduct, removeProduct } = bazaarSlice.actions;
export default bazaarSlice.reducer;
