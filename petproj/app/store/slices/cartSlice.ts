import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

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

// Fetch cart (initial load)
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const guestToken =
        typeof window !== "undefined"
          ? localStorage.getItem("guest_session_id")
          : null;
      const res = await fetch(`/api/bazaar/cart?sessionId=${guestToken ?? ""}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch cart");
      }
      const data = await res.json();
      const apiItems = data?.items ?? data ?? [];
      const mapped = (apiItems || []).map((it: any) => ({
        id: it.cart_item_id ?? it.item_id ?? it.id,
        title: it.product_title ?? it.title ?? it.name ?? "Untitled",
        qty: it.quantity ?? 1,
        price: Number(it.effective_price ?? it.price ?? 0),
        image: it.image_url ?? it.image ?? null,
        code: it.product_code ?? it.sku ?? it.product_id ?? null,
        sku:
          it.variant_sku ?? it.sku ?? it.product_sku ?? it.product_code ?? null,
        variantTitle:
          it.variant_title ?? it.variant_name ?? it.variant?.title ?? null,
        attributes:
          it.attributes ??
          it.variant_attributes ??
          it.attributes_map ??
          it.variant?.attributes ??
          null,
      }));
      return mapped as CartItem[];
    } catch (err: any) {
      return rejectWithValue(err.message ?? "Unknown error");
    }
  }
);

// Add to cart
export const addToCart = createAsyncThunk<
  boolean,
  {
    productId: number;
    quantity?: number;
    title?: string;
    price?: number;
    image?: string;
    sessionId: string;
    variantId?: number | null;
  },
  { state: { cart: CartState }; rejectValue: string }
>("cart/addToCart", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const res = await fetch("/api/bazaar/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to add to cart");
    }

    // Only update Redux after API confirms
    dispatch(
      addItem({
        id: payload.productId,
        title: payload.title ?? "Untitled",
        qty: payload.quantity ?? 1,
        price: payload.price ?? 0,
        image: payload.image ?? null,
      })
    );

    return true;
  } catch (err: any) {
    toast.error(err.message || "Failed to add to cart");
    return rejectWithValue(err.message || "Failed to add to cart");
  }
});

// Update cart item
export const updateCartItem = createAsyncThunk<
  boolean,
  { cartItemId: string | number; quantity: number },
  { state: { cart: CartState }; rejectValue: string }
>(
  "cart/updateCartItem",
  async (payload, { getState, rejectWithValue, dispatch }) => {
    const prevItems = getState().cart.items;
    try {
      const res = await fetch("/api/bazaar/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update cart item");

      // Update Redux only after success
      const updatedItems = prevItems.map((item) =>
        item.id === payload.cartItemId
          ? { ...item, qty: payload.quantity }
          : item
      );
      dispatch(setCartItems(updatedItems));

      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to update cart item");
      return rejectWithValue(err.message || "Failed to update cart item");
    }
  }
);

// Remove cart item
export const removeCartItem = createAsyncThunk<
  boolean,
  { cartItemId: string | number },
  { state: { cart: CartState }; rejectValue: string }
>(
  "cart/removeCartItem",
  async (payload, { getState, rejectWithValue, dispatch }) => {
    const prevItems = getState().cart.items;
    try {
      const res = await fetch(
        `/api/bazaar/cart?cartItemId=${payload.cartItemId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to remove cart item");

      // Update Redux only after success
      const updatedItems = prevItems.filter(
        (item) => item.id !== payload.cartItemId
      );
      dispatch(setCartItems(updatedItems));

      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to remove cart item");
      return rejectWithValue(err.message || "Failed to remove cart item");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Optimistic local state updates
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        existing.qty += action.payload.qty;
      } else {
        state.items.push(action.payload);
      }
      state.lastFetched = Date.now();
    },
    updateItemQuantity(
      state,
      action: PayloadAction<{ cartItemId: string | number; quantity: number }>
    ) {
      const { cartItemId, quantity } = action.payload;
      const item = state.items.find((i) => i.id === cartItemId);
      if (item) item.qty = quantity;
    },
    removeItem(state, action: PayloadAction<string | number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
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
      .addCase(
        fetchCart.fulfilled,
        (state, action: PayloadAction<CartItem[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.lastFetched = Date.now();
        }
      )
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to fetch cart";
      });
  },
});

export const {
  addItem,
  updateItemQuantity,
  removeItem,
  setCartItems,
  markStale,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;

export type { CartItem, CartState };
