/**
 * Helper functions for authentication in API routes
 */

import { getServerSession } from "next-auth/next";
import { authoptions } from "@/app/api/auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";

export interface AuthenticatedUser {
  user_id: string;
  email: string;
  role: string;
  name?: string;
}

/**
 * Get the authenticated user from the NextAuth session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authoptions);

  if (!session?.user) {
    return null;
  }

  const user = session.user as any;

  return {
    user_id: user.user_id?.toString() || user.id?.toString(),
    email: user.email,
    role: user.role || "guest",
    name: user.name,
  };
}

/**
 * Middleware helper to require authentication
 * Returns the user or sends an unauthorized response
 */
export async function requireAuth(): Promise<
  { user: AuthenticatedUser } | { response: NextResponse }
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      ),
    };
  }

  return { user };
}

/**
 * Check if user has admin role
 */
export async function requireAdmin(): Promise<
  { user: AuthenticatedUser } | { response: NextResponse }
> {
  const authResult = await requireAuth();

  if ("response" in authResult) {
    return authResult;
  }

  if (authResult.user.role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}
