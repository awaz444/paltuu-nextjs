"use client";

import React, { createContext, useState, useEffect, ReactNode, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { clearGuestSessionId } from "@/utils/guest";

interface User {
  id?: string;
  user_id?: string; // For backward compatibility
  name?: string;
  email: string;
  profile_image_url?: string; // ✅ consistent naming
  role?: string;
  method: "google" | "api" | null;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profile_image_url?: string;
  }) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isHydrating: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isHydratingState, setIsHydratingState] = useState(true);
  const isHydrating = useRef(false);
  const hasHydrated = useRef(false);

  // Debug: Log state changes
  useEffect(() => {
    // console.log("🔄 Auth state changed:", { isAuthenticated, user: user?.email, method: user?.method });
  }, [isAuthenticated, user]);

  // Function to validate token exists and is valid (checks server since httpOnly cookies can't be read client-side)
  const validateToken = async () => {
    if (typeof window === "undefined") return false;

    try {
      // Verify token with server (server can read httpOnly cookies)
      let retries = 2;
      while (retries > 0) {
        try {
          const response = await fetch("/api/v1/auth/verify", {
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          if (!response.ok) {
            // console.log("❌ Server validation failed:", response.status);
            return false;
          }

          const data = await response.json();
          const isValid = data.valid === true;
          // console.log("✅ Server validation result:", isValid);
          return isValid;
        } catch (fetchError) {
          retries--;
          if (retries === 0) throw fetchError;
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        }
      }
      return false;
    } catch (e) {
      console.error("Token validation error:", e);
      return false;
    }
  };

  // Initial token hydration - verify with server since httpOnly cookies can't be read client-side
  useEffect(() => {
    if (typeof window === "undefined" || hasHydrated.current || isHydrating.current) return;

    const hydrateUser = async () => {
      if (isHydrating.current) return;
      isHydrating.current = true;
      setIsHydratingState(true);

      try {
        // console.log("🔍 Attempting to hydrate user from server...");

        // Call server to verify token (server can read httpOnly cookies)
        const verifyResponse = await fetch("/api/v1/auth/verify", {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!verifyResponse.ok) {
          // console.log("⚠️ No valid token found on server");
          hasHydrated.current = true;
          return;
        }

        const { valid, user: tokenUser } = await verifyResponse.json();
        if (valid && tokenUser) {
          const hydratedUser: User = {
            id: tokenUser.id,
            email: tokenUser.email,
            name: tokenUser.name,
            role: tokenUser.role,
            profile_image_url: tokenUser.profile_image_url,
            method: "api"
          };
          setUser(hydratedUser);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Failed to hydrate user from server:", e);
      } finally {
        isHydrating.current = false;
        hasHydrated.current = true;
        setIsHydratingState(false);
      }
    };

    hydrateUser();
  }, []); // Run only once on mount

  useEffect(() => {
    // console.log("🔎 useSession status:", status);
    // console.log("🔎 NextAuth session.user:", session?.user);

    if (status === "authenticated" && session?.user) {
    const googleUserId = (session.user as any).user_id || (session.user as any).id;

    // Only update if we don't have a user yet, or if this is a fresh Google login
    if (!user || user.method !== "google") {
      // First, try to fetch the user's database profile
      const fetchDatabaseProfile = async () => {
        const googleUser: User = {
          id: googleUserId,
          name: session.user.name || undefined,
          email: session.user.email || "",
          role: (session.user as any).role || "guest",
          profile_image_url: session.user.image || "/default-avatar.png",
          method: "google",
        };

        setUser(googleUser);
        setIsAuthenticated(true);
        return googleUser;
      };

        fetchDatabaseProfile().then((finalUser) => {
          // Clear guest session cookie (cart sync will be handled by useCartSync hook)
          try {
            clearGuestSessionId();
            // console.log('✅ User logged in via Google - guest session cleared');
          } catch (e) {
            console.error('Error clearing guest session on login:', e);
          }

        // Redirect shop/shelter to panels after login - check for callback URL first
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl');

          if (callbackUrl && callbackUrl !== '/auth' && callbackUrl !== '/login') {
            router.push(decodeURIComponent(callbackUrl));
          } else {
            const role = finalUser.role;
            if (role === "shop admin") router.push("/shop-panel");
            else if (role === "shelter admin") router.push("/rescue-panel");
            else if (role === "vet") router.push("/vet-panel");
            else if (role === "admin") router.push("/admin-panel");
            else router.push("/browse-pets");
          }
        } catch {}
      });
    }
  }
}, [status, session]);

  // Update hydrating state when session status changes
  useEffect(() => {
    if (status !== "loading") {
      setIsHydratingState(false);
    }
  }, [status]);


  const login = async (userData: {
    id: string;
    name: string;
    email: string;
    role: string;
    profile_image_url?: string;
  }) => {
    const userWithMethod: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      profile_image_url: userData.profile_image_url || "/default-avatar.png",
      method: "api",
    };

    setUser(userWithMethod);
    setIsAuthenticated(true);

    try {
      clearGuestSessionId();
    } catch (e) {
      console.error('Error clearing guest session on login:', e);
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl');

      if (callbackUrl && callbackUrl !== '/auth' && callbackUrl !== '/login') {
        router.push(decodeURIComponent(callbackUrl));
      } else if (userWithMethod.role === "shop admin") {
        router.push("/shop-panel");
      } else if (userWithMethod.role === "shelter admin") {
        router.push("/rescue-panel");
      } else if (userWithMethod.role === "vet") {
        router.push("/vet-panel");
      } else if (userWithMethod.role === "admin") {
        router.push("/admin-panel");
      } else {
        router.push("/browse-pets");
      }
    } catch {}
  };


  const refreshUser = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/v1/profile`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch updated profile");

      const updatedProfile = await response.json();

      const updatedUser: User = {
        ...user,
        name: updatedProfile.name,
        profile_image_url: updatedProfile.profile_image_url,
        // Keep other fields from current user (including method, role, etc.)
      };

      setUser(updatedUser);
      // Do not persist to localStorage

      //console.log("✅ User data refreshed:", updatedUser);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const logout = async () => {
   // console.log("Logout started, user method:", user?.method);

    try {
      // Clear in-memory user and guest session cookie (cart will be handled by useCartSync hook)
      try { clearGuestSessionId(); } catch {}      // Clear session storage if used
      try { sessionStorage.clear(); } catch {}

      // ALWAYS call the server-side V1 logout API to clear all cookies
      try {
        await fetch("/api/v1/auth/logout", {
          method: "GET",
          credentials: "include",
        });
      } catch (err) {
        console.error("V1 API logout error:", err);
      }

      // Handle NextAuth signOut if Google method was used
      if (user?.method === "google") {
        await nextAuthSignOut({
          callbackUrl: "/auth",
          redirect: true,
        });
        return;
      }

      // Clear local state
      setUser(null);
      setIsAuthenticated(false);

      // Manual cookie clearing as fallback (leave server-controlled auth cookie to server logout)
      try {
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      } catch {}

      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      try { sessionStorage.clear(); } catch {}
      try {
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      } catch {}
      window.location.href = "/auth";
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, refreshUser, isHydrating: isHydratingState }}>
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
