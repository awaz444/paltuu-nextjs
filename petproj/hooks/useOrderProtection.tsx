"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getOrCreateGuestSessionId } from '@/utils/guest';
import { getUserIdFromSession } from '@/utils/getUserFromSession';

interface OrderProtectionOptions {
  redirectTo?: string;
  showMessage?: boolean;
}

export const useOrderProtection = (options: OrderProtectionOptions = {}) => {
  const { redirectTo = '/marketplace', showMessage = true } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [isValidOrder, setIsValidOrder] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const checkOrder = async () => {
      // Prevent multiple redirects
      if (hasRedirected) return;

      try {
        const orderNumber = searchParams.get('orderNumber');

        if (!orderNumber) {
          // No order number in URL, redirect
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        }

        // Get userId from session instead of localStorage
        const userId = await getUserIdFromSession();
        let sessionId: string | null = null;

        // Only get session ID if not logged in
        if (!userId) {
          sessionId = getOrCreateGuestSessionId();
        }

        // Build params for order verification
        const params = new URLSearchParams();
        params.append('orderNumber', orderNumber);
        if (userId) {
          params.append('userId', userId);
        } else if (sessionId) {
          params.append('sessionId', sessionId);
        }

        // Verify the order exists and belongs to current session/user
        const response = await fetch(`/api/bazaar/orders?${params.toString()}`);

        if (!response.ok) {
          // Order not found or API error
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        }

        const data = await response.json();
        const order = Array.isArray(data) ? data[0] : data;

        if (!order || !order.order_number) {
          // Invalid order data
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        }

        // Additional check: Verify that the order belongs to the current session/user
        if (userId && order.user_id && order.user_id !== parseInt(userId)) {
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        }

        if (!userId && sessionId && order.session_id && order.session_id !== sessionId) {
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        }

        // Also verify that the cart is empty (order should clear the cart)
        const cartParams = new URLSearchParams();
        if (userId) {
          cartParams.append('userId', userId);
        } else if (sessionId) {
          cartParams.append('sessionId', sessionId);
        }

        const cartResponse = await fetch(`/api/bazaar/cart?${cartParams.toString()}`);

        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          const cartItems = cartData?.items || cartData || [];

          // If cart still has items, this might be an invalid access
          if (Array.isArray(cartItems) && cartItems.length > 0) {
            setHasRedirected(true);
            router.push('/checkout');
            return;
          }
        }

        // Order is valid and cart is empty, allow access
        setIsValidOrder(true);
      } catch (error) {
        console.error('Error checking order:', error);
        setHasRedirected(true);
        router.push(redirectTo);
      } finally {
        setIsChecking(false);
      }
    };

    checkOrder();
  }, [router, redirectTo, showMessage, searchParams, hasRedirected]);

  return { isChecking, isValidOrder };
};
