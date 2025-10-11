"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateGuestSessionId } from '@/utils/guest';

interface CartProtectionOptions {
  redirectTo?: string;
  showMessage?: boolean;
}

export const useCartProtection = (options: CartProtectionOptions = {}) => {
  const { redirectTo = '/cart', showMessage = true } = options;
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasItems, setHasItems] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const checkCart = async () => {
      // Prevent multiple redirects
      if (hasRedirected) return;

      try {
        // ✅ Prioritize userId if user is logged in
        let userId: string | null = null;
        if (typeof window !== 'undefined') {
          const userString = localStorage.getItem('user');
          if (userString) {
            try {
              const user = JSON.parse(userString);
              userId = user?.id || user?.user_id || null;
            } catch (e) {
              console.error('Failed to parse user:', e);
            }
          }
        }

        const params = new URLSearchParams();
        if (userId) {
          params.append('userId', userId);
        } else {
          const sessionId = getOrCreateGuestSessionId();
          params.append('sessionId', sessionId);
        }

        const response = await fetch(`/api/bazaar/cart?${params.toString()}`);

        if (!response.ok) {
          // If cart API fails, redirect to cart page
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        }

        const data = await response.json();
        const cartItems = data?.items || data || [];

        if (!Array.isArray(cartItems) || cartItems.length === 0) {
          // Cart is empty, redirect
          if (showMessage) {
            alert('Your cart is empty. Please add items before proceeding to checkout.');
          }
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        }

        // Cart has items, allow access
        setHasItems(true);
      } catch (error) {
        console.error('Error checking cart:', error);
        setHasRedirected(true);
        router.push(redirectTo);
      } finally {
        setIsChecking(false);
      }
    };

    checkCart();
  }, [router, redirectTo, showMessage, hasRedirected]);

  return { isChecking, hasItems };
};
