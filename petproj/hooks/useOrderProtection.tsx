"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getOrCreateGuestSessionId } from '@/utils/guest';

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

        // Server will check authentication via httpOnly cookies
        const sessionId = getOrCreateGuestSessionId();
        const params = new URLSearchParams();
        params.append('orderNumber', orderNumber);
        params.append('sessionId', sessionId);

        // Verify the order exists and belongs to current session/user
        const response = await fetch(`/api/v1/bazaar/orders?${params.toString()}`, {
          credentials: 'include',
        });

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

        // Server already validated that order belongs to current user/session
        // Just verify that the order session matches if guest
        if (sessionId && order.session_id && order.session_id !== sessionId) {
          setHasRedirected(true);
          router.push(redirectTo);
          return;
        }

        // Also verify that the cart is empty (order should clear the cart)
        const cartParams = new URLSearchParams();
        cartParams.append('sessionId', sessionId);

        const cartResponse = await fetch(`/api/v1/bazaar/cart?${cartParams.toString()}`, {
          credentials: 'include',
        });

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
