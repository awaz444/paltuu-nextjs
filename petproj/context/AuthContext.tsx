"use client";

import React, { createContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface User {
  id: string;
  user_id: string; // For backward compatibility
  name?: string;
  email: string;
  profile_image_url?: string;
  role?: string;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Derive user from session - no localStorage needed
  const user: User | null = session?.user
    ? {
        id: (session.user as any).user_id || (session.user as any).id,
        user_id: (session.user as any).user_id || (session.user as any).id,
        name: session.user.name || undefined,
        email: session.user.email || "",
        profile_image_url: session.user.image || undefined,
        role: (session.user as any).role || "guest",
      }
    : null;

  const isAuthenticated = status === "authenticated";

  // Handle role-based redirects on authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      const path = typeof window !== "undefined" ? window.location.pathname : "";

      // Only redirect from login page
      if (path === "/login") {
        try {
          const role = user.role;
          if (role === "shop admin") {
            router.push("/shop-panel");
          } else if (role === "shelter admin") {
            router.push("/rescue-panel");
          } else if (role === "vet") {
            router.push("/vet-panel");
          } else {
            router.push("/browse-pets");
          }
        } catch (error) {
          console.error("Redirect error:", error);
        }
      }

      // Clear guest session when user logs in
      if (typeof window !== "undefined") {
        localStorage.removeItem("guest_session_id");
      }
    }
  }, [isAuthenticated, user, router]);

  const refreshUser = async () => {
    try {
      // Trigger session refresh from server
      await update();
      console.log("✅ User session refreshed");
    } catch (error) {
      console.error("Failed to refresh user session:", error);
    }
  };

  const logout = async () => {
    console.log("Logout started");

    try {
      // Clear any remaining localStorage items
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("guest_session_id");
        sessionStorage.clear();
      }

      // Use NextAuth signOut for all users
      await nextAuthSignOut({
        callbackUrl: "/login",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Force cleanup and redirect on error
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/login";
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
