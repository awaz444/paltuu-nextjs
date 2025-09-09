import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string | number;
  title: string;
  qty: number;
  price: number;
  image?: string | null;
  code?: string | number | null;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error?: string | null;
  lastFetched?: number | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const guestToken = typeof window !== 'undefined' ? localStorage.getItem('guest_session_id') : null;
    const res = await fetch(`/api/bazaar/cart?sessionId=${guestToken ?? ''}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch cart');
    }
    const data = await res.json();
    const apiItems = data?.items ?? data ?? [];
    const mapped = (apiItems || []).map((it: any) => ({
      id: it.cart_item_id ?? it.item_id ?? it.id,
      title: it.product_title ?? it.title ?? it.name ?? 'Untitled',
      qty: it.quantity ?? 1,
      price: Number(it.effective_price ?? it.price ?? 0),
      image: it.image_url ?? it.image ?? null,
  code: it.product_code ?? it.sku ?? it.product_id ?? null,
  // explicit sku (prefer variant sku, then item sku, then product sku)
  sku: it.variant_sku ?? it.sku ?? it.product_sku ?? it.product_code ?? null,
  // variant title (if API provides a human-readable variant title) and attributes
  variantTitle: it.variant_title ?? it.variant_name ?? it.variant?.title ?? null,
  attributes: it.attributes ?? it.variant_attributes ?? it.attributes_map ?? it.variant?.attributes ?? null,
    }));
    return mapped as CartItem[];
  } catch (err: any) {
    return rejectWithValue(err.message ?? 'Unknown error');
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async (payload: { sessionId?: string | null, productId?: number, variantId?: number | null, quantity?: number }, { dispatch, rejectWithValue }) => {
  try {
    const res = await fetch('/api/bazaar/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Failed to add to cart');
    }
    // refresh cart
    dispatch(fetchCart());
    return true;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to add to cart');
  }
});

export const updateCartItem = createAsyncThunk('cart/updateCartItem', async (payload: { cartItemId: string | number, quantity: number }, { dispatch, rejectWithValue }) => {
  try {
    const res = await fetch('/api/bazaar/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Failed to update cart item');
    }
    dispatch(fetchCart());
    return true;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to update cart item');
  }
});

export const removeCartItem = createAsyncThunk('cart/removeCartItem', async (payload: { cartItemId: string | number }, { dispatch, rejectWithValue }) => {
  try {
    const res = await fetch(`/api/bazaar/cart?cartItemId=${payload.cartItemId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Failed to remove cart item');
    }
    dispatch(fetchCart());
    return true;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to remove cart item');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.lastFetched = Date.now();
    },
    markStale(state) {
      state.lastFetched = null;
    },
    clearCart(state) {
      state.items = [];
      state.lastFetched = Date.now();
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? 'Failed to fetch cart';
      });
  },
});

export const { setCartItems, markStale, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

export type { CartItem, CartState };
