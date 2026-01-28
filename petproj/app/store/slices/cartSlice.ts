import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { getGuestSessionId, getOrCreateGuestSessionId } from "@/utils/guest";

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
  // Helper to map API response to CartItem
  const mapItems = (data: any): CartItem[] => {
    const apiItems = data?.items ?? data ?? [];
    return (apiItems || []).map((it: any): CartItem => ({
      id: it.cart_item_id ?? it.item_id ?? it.id,
      title: it.product_title ?? it.title ?? it.name ?? "Untitled",
      qty: it.quantity ?? 1,
      price: Number(it.effective_price ?? it.price ?? 0),
      image: it.image_url ?? it.image ?? null,
      code: it.product_code ?? it.sku ?? it.product_id ?? null,
      sku: it.variant_sku ?? it.sku ?? it.product_sku ?? it.product_code ?? null,
      variantTitle: it.variant_title ?? it.variant_name ?? it.variant?.title ?? null,
      attributes: it.attributes ?? it.variant_attributes ?? it.attributes_map ?? it.variant?.attributes ?? null,
    }));
  };

  try {
    // 1. Silent Auth Probe: Attempt fetch with credentials
    const res = await fetch('/api/bazaar/cart', {
      credentials: 'include',
    });

    // 2. Control Flow: specific handling for 401 (Unauthenticated)
    if (res.status === 401) {
      // Gracefully retry as guest without throwing an error
      const sessionId = getGuestSessionId() || getOrCreateGuestSessionId();
      if (sessionId) {
        const guestRes = await fetch(`/api/bazaar/cart?sessionId=${encodeURIComponent(sessionId)}`, {
          credentials: 'include',
        });
        
        if (guestRes.ok) {
          const data = await guestRes.json();
          return mapItems(data);
        }
      }
      // If guest fetch fails, fall through to localStorage logic below
    } 
    
    // 3. Success: Authenticated user
    else if (res.ok) {
      const data = await res.json();
      return mapItems(data);
    }

  } catch (error) {
    // Network errors fall through to localStorage fallback
  }

  // 4. Fallback: LocalStorage (Guest Cart)
  if (typeof window !== "undefined") {
    try {
      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart) {
        return JSON.parse(guestCart) as CartItem[];
      }
    } catch (e) {
      // silent
    }
  }

  return [];
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
    const sessionId = payload.sessionId;

    const requestBody = {
      productId: payload.productId,
      quantity: payload.quantity ?? 1,
      variantId: payload.variantId ?? null,
      sessionId, // Only send sessionId, server will extract userId from cookie
    };

    //console.log('📤 addToCart - Request body:', requestBody, '(server will check auth cookie)');

    const newItem: CartItem = {
      id: `${payload.productId}-${payload.variantId || 'no-variant'}`,
      title: payload.title ?? "Untitled",
      qty: payload.quantity ?? 1,
      price: payload.price ?? 0,
      image: payload.image ?? null,
      code: payload.productId,
      variantTitle: payload.variantTitle ?? null,
      attributes: payload.attributes ?? null,
    };

    // Try adding to server cart (works for both logged-in and guest users)
    // Server automatically detects auth from cookie
    try {
      //console.log('\ud83d\udcbe addToCart - Sending to server (auth auto-detected)...');

      // 🔹 1. Optimistically update Redux store
      dispatch(addItem(newItem));

      // 🔹 2. Store in database
      const res = await fetch("/api/bazaar/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add to cart");
      }

      // 🔹 3. Silent sync to ensure accurate quantities from server
      setTimeout(() => {
        dispatch(fetchCart());
      }, 300);

      toast.success('Added to cart!');
      return true;
    } catch (serverError) {
      //console.warn('⚠️ addToCart - Server request failed, falling back to localStorage:', serverError);
    }

    // Fallback: For guests or if server unavailable, store in localStorage only
    //console.log('💾 addToCart - Storing in localStorage (fallback)');

    if (typeof window !== "undefined") {
      try {
        const guestCart = localStorage.getItem('guest_cart');
        let cartItems: CartItem[] = guestCart ? JSON.parse(guestCart) : [];

        // Check if item already exists
        const existingItemIndex = cartItems.findIndex(
          item => item.code === payload.productId &&
                  (item.variantTitle || null) === (payload.variantTitle || null)
        );

        if (existingItemIndex !== -1) {
          // Update quantity
          cartItems[existingItemIndex].qty += payload.quantity ?? 1;
          //console.log('\u2795 Updated existing item quantity in guest cart');
        } else {
          // Add new item
          cartItems.push(newItem);
          //console.log('\u2795 Added new item to guest cart');
        }

        localStorage.setItem('guest_cart', JSON.stringify(cartItems));

        // Update Redux state
        dispatch(setCartItems(cartItems));

        toast.success('Added to cart!');
      } catch (e) {
        console.error('Failed to save guest cart to localStorage:', e);
        throw new Error('Failed to save cart');
      }
    }

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
    // Try updating on server first (server will check auth cookie)
    try {
      const res = await fetch("/api/bazaar/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (res.ok) {
        const updatedItems = prevItems.map((item) =>
          item.id === payload.cartItemId ? { ...item, qty: payload.quantity } : item
        );
        dispatch(setCartItems(updatedItems));
        return true;
      }
    } catch (serverError) {
      console.warn('⚠️ updateCartItem - Server request failed, using localStorage:', serverError);
    }

    // Fallback: update in localStorage
    if (typeof window !== "undefined") {
      const updatedItems = prevItems.map((item) =>
        item.id === payload.cartItemId ? { ...item, qty: payload.quantity } : item
      );
      localStorage.setItem('guest_cart', JSON.stringify(updatedItems));
      dispatch(setCartItems(updatedItems));
    }

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
    // Try removing from server first (server will check auth cookie)
    try {
      const res = await fetch(`/api/bazaar/cart?cartItemId=${payload.cartItemId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${res.status}: Failed to remove cart item`
        );
      }

      if (res.ok) {
        await res.json().catch(() => ({}));
        const updatedItems = prevItems.filter((item) => item.id !== payload.cartItemId);
        dispatch(setCartItems(updatedItems));
        return true;
      }
    } catch (serverError) {
      console.warn('⚠️ removeCartItem - Server request failed, using localStorage:', serverError);
    }

    // Fallback: remove from localStorage
    if (typeof window !== "undefined") {
      const updatedItems = prevItems.filter((item) => item.id !== payload.cartItemId);
      localStorage.setItem('guest_cart', JSON.stringify(updatedItems));
      dispatch(setCartItems(updatedItems));
    }

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
      // Clear guest cart from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem('guest_cart');
      }
    },
    // Force clear cart state and mark as needing refresh
    resetCartState(state) {
      state.items = [];
      state.lastFetched = null;
      state.loading = false;
      state.error = null;
      // Clear guest cart from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem('guest_cart');
      }
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
  resetCartState,
} = cartSlice.actions;

export default cartSlice.reducer;
