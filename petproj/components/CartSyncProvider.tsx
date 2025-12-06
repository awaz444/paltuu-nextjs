"use client";

import { useCartSync } from "@/hooks/useCartSync";

/**
 * Component that synchronizes cart state with authentication changes
 * Must be rendered inside both AuthProvider and Redux Provider
 */
export default function CartSyncProvider({ children }: { children: React.ReactNode }) {
  // This hook monitors auth changes and syncs cart accordingly
  useCartSync();

  return <>{children}</>;
}
