/**
 * Hook to sync cart state with authentication changes
 * This should be used in components wrapped by both AuthProvider and Redux Provider
 */
"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/context/AuthContext";
import { resetCartState, fetchCart } from "@/app/store/slices/cartSlice";
import type { AppDispatch } from "@/app/store/store";

export function useCartSync() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useAuth();
  const prevAuthRef = useRef(isAuthenticated);
  const prevUserIdRef = useRef(user?.id);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const authChanged = prevAuthRef.current !== isAuthenticated;
    const userIdChanged = prevUserIdRef.current !== user?.id;

    // On initial mount, if user is already logged in, fetch their cart
    if (!hasInitialized.current && isAuthenticated && user?.id) {
      console.log('🔄 Initial cart fetch for logged-in user:', user.id);
      dispatch(fetchCart());
      hasInitialized.current = true;
      prevAuthRef.current = isAuthenticated;
      prevUserIdRef.current = user?.id;
      return;
    }

    // Only reset cart if auth state actually changed
    if (authChanged || userIdChanged) {
      console.log('🔄 Auth state changed, syncing cart...', {
        wasAuthenticated: prevAuthRef.current,
        isAuthenticated,
        prevUserId: prevUserIdRef.current,
        currentUserId: user?.id,
      });

      // Reset cart state and fetch new cart
      dispatch(resetCartState());

      // Small delay to ensure auth state is fully updated
      setTimeout(() => {
        dispatch(fetchCart());
      }, 100);

      // Update refs
      prevAuthRef.current = isAuthenticated;
      prevUserIdRef.current = user?.id;
      hasInitialized.current = true;
    }
  }, [isAuthenticated, user?.id, dispatch]);
}
