import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { getUserIdFromSession } from "@/utils/getUserFromSession";

//
// 🛒 Interfaces
//
export interface CartItem {
  id: string | number;
  title: string;
  qty: number;
  price: number;
  image?: string | null;
  code?: string | number | null;
  sku?: string | null;
  variantTitle?: string | null;
  attributes?: Array<{ name?: string; value?: string }> | null;
}

export interface CartState {
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

//
// 🔹 Fetch Cart
//
export const fetchCart = createAsyncThunk<
  CartItem[],
  void,
  { rejectValue: string }
>("cart/fetchCart", async (_, { rejectWithValue }) => {
  try {
    // Get userId from NextAuth session instead of localStorage
    const userId = await getUserIdFromSession();
    let guestToken: string | null = null;

    // Only use guest session if user is NOT logged in
    if (!userId && typeof window !== "undefined") {
      guestToken = localStorage.getItem("guest_session_id");
    }

    // Build query params - prefer userId over sessionId
    const params = new URLSearchParams();
    if (userId) {
      params.append("userId", userId);
    } else if (guestToken) {
      params.append("sessionId", guestToken);
    } else {
      // Neither userId nor sessionId available - return empty cart
      return [];
    }

    const res = await fetch(`/api/bazaar/cart?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch cart");
    }

    const data = await res.json();
    const apiItems = data?.items ?? data ?? [];

    const mapped = (apiItems || []).map((it: any): CartItem => ({
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

    return mapped;
  } catch (err: any) {
    return rejectWithValue(err.message ?? "Unknown error");
  }
});

//
// 🔹 Add to Cart
//
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
    variantTitle?: string | null;
    attributes?: Array<{ name?: string; value?: string }> | null;
  },
  { state: { cart: CartState }; rejectValue: string }
>("cart/addToCart", async (payload, { dispatch, rejectWithValue }) => {
  try {
    // Get userId from NextAuth session instead of localStorage
    const userId = await getUserIdFromSession();
    const sessionId = payload.sessionId;

    const requestBody = {
      productId: payload.productId,
      quantity: payload.quantity ?? 1,
      variantId: payload.variantId ?? null,
      ...(userId ? { userId } : { sessionId }),
    };

    // 🔹 1. Optimistically update Redux store instantly
    dispatch(
      addItem({
        id: payload.productId,
        title: payload.title ?? "Untitled",
        qty: payload.quantity ?? 1,
        price: payload.price ?? 0,
        image: payload.image ?? null,
        variantTitle: payload.variantTitle ?? null,
        attributes: payload.attributes ?? null,
      })
    );

    // 🔹 2. Perform real backend add
    const res = await fetch("/api/bazaar/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to add to cart");
    }

    // 🔹 3. Silent sync to ensure variant merging/accurate quantities
    setTimeout(() => {
      dispatch(fetchCart());
    }, 300); // small delay for backend consistency

    return true;
  } catch (err: any) {
    toast.error(err.message || "Failed to add to cart");
    return rejectWithValue(err.message || "Failed to add to cart");
  }
});


//
// 🔹 Update Cart Item
//
export const updateCartItem = createAsyncThunk<
  boolean,
  { cartItemId: string | number; quantity: number },
  { state: { cart: CartState }; rejectValue: string }
>("cart/updateCartItem", async (payload, { getState, dispatch, rejectWithValue }) => {
  const prevItems = getState().cart.items;
  try {
    const res = await fetch("/api/bazaar/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to update cart item");

    const updatedItems = prevItems.map((item) =>
      item.id === payload.cartItemId ? { ...item, qty: payload.quantity } : item
    );
    dispatch(setCartItems(updatedItems));

    return true;
  } catch (err: any) {
    toast.error(err.message || "Failed to update cart item");
    return rejectWithValue(err.message || "Failed to update cart item");
  }
});

//
// 🔹 Remove Cart Item
//
export const removeCartItem = createAsyncThunk<
  boolean,
  { cartItemId: string | number },
  { state: { cart: CartState }; rejectValue: string }
>("cart/removeCartItem", async (payload, { getState, dispatch, rejectWithValue }) => {
  const prevItems = getState().cart.items;

  try {
    const res = await fetch(`/api/bazaar/cart?cartItemId=${payload.cartItemId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${res.status}: Failed to remove cart item`
      );
    }

    await res.json().catch(() => ({})); // avoid crash on empty response

    const updatedItems = prevItems.filter((item) => item.id !== payload.cartItemId);
    dispatch(setCartItems(updatedItems));

    return true;
  } catch (err: any) {
    toast.error(err.message || "Failed to remove cart item");
    return rejectWithValue(err.message || "Failed to remove cart item");
  }
});

//
// 🧱 Slice
//
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
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
