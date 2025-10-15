"use client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Handles delayed navigation to allow animations to finish before route change.
 */
export const useSmoothNavigate = (delay: number = 300) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const smoothPush = useCallback(
    (href: string) => {
      if (isNavigating) return; // prevent double clicks
      setIsNavigating(true);

      // Dispatch a custom event so other components (like PageTransition) can listen
      window.dispatchEvent(new Event("pageTransitionStart"));

      setTimeout(() => {
        router.push(href);
        setIsNavigating(false);
      }, delay);
    },
    [router, delay, isNavigating]
  );

  return { smoothPush, isNavigating };
};
