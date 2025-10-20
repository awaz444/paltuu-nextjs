"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import toast from "react-hot-toast";

interface CartProtectionOptions {
  redirectTo?: string;
  showMessage?: boolean;
}

export const useCartProtection = (options: CartProtectionOptions = {}) => {
  const { redirectTo = "/cart", showMessage = true } = options;
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "hasItems" | "redirecting">("checking");

  const hasShownToast = useRef(false); // ✅ track if toast was already shown

  useEffect(() => {
    let canceled = false;

    const checkCart = async () => {
      try {
        // Get user ID if logged in
        let userId: string | null = null;
        if (typeof window !== "undefined") {
          const userString = localStorage.getItem("user");
          if (userString) {
            try {
              const user = JSON.parse(userString);
              userId = user?.id || user?.user_id || null;
            } catch {}
          }
        }

        const params = new URLSearchParams();
        if (userId) {
          params.append("userId", userId);
        } else {
          const sessionId = getOrCreateGuestSessionId();
          params.append("sessionId", sessionId);
        }

        const res = await fetch(`/api/bazaar/cart?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch cart");

        const data = await res.json();
        const items = data?.items || data || [];

        if (!Array.isArray(items) || items.length === 0) {
          if (!canceled && showMessage && !hasShownToast.current) {
            toast.error("Your cart is empty. Please add items before checkout.");
            hasShownToast.current = true; // ✅ mark toast as shown
          }
          canceled = true;
          setStatus("redirecting");
          router.replace(redirectTo);
          return;
        }

        if (!canceled) setStatus("hasItems");
      } catch (error) {
        console.error("Cart check failed:", error);
        if (!canceled) {
          canceled = true;
          setStatus("redirecting");
          router.replace(redirectTo);
        }
      }
    };

    checkCart();
  }, [router, redirectTo, showMessage]);

  return { isChecking: status === "checking", hasItems: status === "hasItems" };
};
