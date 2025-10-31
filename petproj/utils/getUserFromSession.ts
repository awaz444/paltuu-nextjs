/**
 * Utility to get user ID from NextAuth session (client-side)
 * This replaces localStorage.getItem("user") pattern
 */

import { getSession } from "next-auth/react";

export async function getUserIdFromSession(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const session = await getSession();
    if (session?.user) {
      const userId = (session.user as any).user_id || (session.user as any).id;
      return userId ? String(userId) : null;
    }
    return null;
  } catch (error) {
    console.error("Failed to get user from session:", error);
    return null;
  }
}

/**
 * Synchronous version for components that already have session from useSession hook
 */
export function getUserIdFromSessionData(session: any): string | null {
  if (!session?.user) return null;
  const userId = session.user.user_id || session.user.id;
  return userId ? String(userId) : null;
}
