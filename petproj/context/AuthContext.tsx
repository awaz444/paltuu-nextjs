"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { getUserIdFromToken, decodeJwtPayload } from "@/utils/authClient";
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
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Debug: Log state changes
  useEffect(() => {
    console.log("🔄 Auth state changed:", { isAuthenticated, user: user?.email, method: user?.method });
  }, [isAuthenticated, user]);

  // Function to validate token exists and is valid
  const validateToken = async () => {
    if (typeof window === "undefined") return false;

    try {
      // First check if token exists in cookies
      const tokenUserId = getUserIdFromToken();
      if (!tokenUserId) {
        console.log("❌ No token found in cookies");
        return false;
      }

      // Verify token with server (with retry logic)
      let retries = 2;
      while (retries > 0) {
        try {
          const response = await fetch("/api/auth/verify-token", {
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          if (!response.ok) {
            console.log("❌ Server validation failed:", response.status);
            return false;
          }

          const data = await response.json();
          const isValid = data.valid === true;
          console.log("Server validation result:", isValid);
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

  // Periodic token validation - DISABLED to prevent logout loops
  // Token will be validated on visibility change and on protected route access via middleware
  // useEffect(() => {
  //   if (user?.method === "api" && isAuthenticated) {
  //     ... validation logic ...
  //   }
  // }, [user?.method, isAuthenticated]);

  // Visibility change validation - DISABLED to prevent logout loops
  // Token validation will happen on API calls which return 401 if token is invalid
  // useEffect(() => {
  //   if (typeof window === "undefined" || user?.method !== "api" || !isAuthenticated) return;
  //   ... visibility validation logic ...
  // }, [user?.method, isAuthenticated]);

  // Initial token hydration - only run once on mount
  useEffect(() => {
    if (typeof window === "undefined" || user !== null) return;

    try {
      const tokenUserId = getUserIdFromToken();
      if (tokenUserId) {
        // We have a token payload; use it as a lightweight user until we fetch DB profile
        const token = (document.cookie.match(new RegExp('(^|; )' + 'token' + '=([^;]*)')) || [])[2];
        const payload = decodeJwtPayload(token ? decodeURIComponent(token) : null);
        const minimalUser = payload
          ? ({ id: payload.id || payload.user_id, email: payload.email, name: payload.name, role: payload.role || "guest", profile_image_url: payload.profile_image_url, method: "api" } as any)
          : null;
        if (minimalUser) {
          console.log("✅ Hydrated user from token on mount");
          setUser(minimalUser);
          setIsAuthenticated(true);
        }
      }
    } catch (e) {
      console.error("Failed to hydrate user from token:", e);
    }
  }, []); // Run only once on mount

  useEffect(() => {
    console.log("🔎 useSession status:", status);
    console.log("🔎 NextAuth session.user:", session?.user);

    if (status === "authenticated" && session?.user) {
    const googleUserId = (session.user as any).user_id || (session.user as any).id;

    // Only update if we don't have a user yet, or if this is a fresh Google login
    if (!user || user.method !== "google") {
      // First, try to fetch the user's database profile
      const fetchDatabaseProfile = async () => {
        try {
          const response = await fetch(`/api/my-profile/${googleUserId}`);
          if (response.ok) {
            const dbProfile = await response.json();
            // Use database profile data if available, but fallback to Google data if empty
            const userWithDbData: User = {
              id: googleUserId,
              name: (dbProfile.name && dbProfile.name.trim()) || session.user.name || undefined,
              email: session.user.email || "",
              role: (session.user as any).role || "guest",
              profile_image_url: (dbProfile.profile_image_url && dbProfile.profile_image_url.trim()) || session.user.image || undefined,
              method: "google",
            };

            // Set in-memory user; do not persist to localStorage
            setUser(userWithDbData);
            setIsAuthenticated(true);

            console.log("✅ Using database profile data for Google user:", userWithDbData);
            console.log("🔍 AuthContext - Database profile_image_url:", dbProfile.profile_image_url);
            return userWithDbData;
          }
        } catch (error) {
          console.log("No database profile found, using Google data");
        }

        // Fallback to Google data if no database profile exists
        const googleUser: User = {
          id: googleUserId,
          name: session.user.name || undefined,
          email: session.user.email || "",
          role: (session.user as any).role || "guest",
          profile_image_url: session.user.image || undefined,
          method: "google",
        };

            // Set in-memory user; do not persist to localStorage
            setUser(googleUser);
            setIsAuthenticated(true);

        console.log("✅ Using Google profile data:", googleUser);
        console.log("🔍 AuthContext - Google profile_image_url:", session.user.image);
        return googleUser;
      };

        fetchDatabaseProfile().then((finalUser) => {
          // clear guest session cookie to avoid cart conflicts
          try { clearGuestSessionId(); } catch {}

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


  const login = async (userData: {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_image_url?: string; // backend field
}) => {
  // Try to fetch the user's database profile first
  try {
    const response = await fetch(`/api/my-profile/${userData.id}`);
    if (response.ok) {
      const dbProfile = await response.json();
      // Use database profile data if available
      const userWithDbData: User = {
        id: userData.id,
        name: dbProfile.name,
        email: userData.email,
        role: userData.role,
        profile_image_url: dbProfile.profile_image_url || "/default-avatar.png",
        method: "api",
      };

  setUser(userWithDbData);
  setIsAuthenticated(true);
  try { clearGuestSessionId(); } catch {}

      console.log("✅ Using database profile data for API user:", userWithDbData);

      // Redirect on API login success - check for callback URL first
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const callbackUrl = urlParams.get('callbackUrl');

        if (callbackUrl && callbackUrl !== '/auth' && callbackUrl !== '/login') {
          router.push(decodeURIComponent(callbackUrl));
        } else if (userWithDbData.role === "shop admin") {
          router.push("/shop-panel");
        } else if (userWithDbData.role === "shelter admin") {
          router.push("/rescue-panel");
        } else if (userWithDbData.role === "vet") {
          router.push("/vet-panel");
        } else if (userWithDbData.role === "admin") {
          router.push("/admin-panel");
        } else {
          router.push("/browse-pets");
        }
      } catch {}
      return;
    }
  } catch (error) {
    console.log("No database profile found, using login response data");
  }

  // Fallback to login response data if no database profile exists
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
  try { clearGuestSessionId(); } catch {}

  console.log("✅ Using login response data for API user:", userWithMethod);

  // Redirect on API login success - check for callback URL first
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
      const response = await fetch(`/api/my-profile/${user.id}`);
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

      console.log("✅ User data refreshed:", updatedUser);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const logout = async () => {
    console.log("Logout started, user method:", user?.method);

    try {
      // Clear in-memory user and guest session cookie
      try { clearGuestSessionId(); } catch {}

      // Clear session storage if used
      try { sessionStorage.clear(); } catch {}

      // For Google users, handle NextAuth signOut correctly
      if (user?.method === "google") {
        console.log("Executing Google logout flow");
        await nextAuthSignOut({
          callbackUrl: "/auth",
          redirect: true,
        });
        return;
      }

      // For API users, proceed with API logout
      console.log("Executing API logout flow");
      try {
        const response = await fetch("/api/users/logout", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`API logout failed with status: ${response.status}`);
        }

        console.log("API logout successful");
      } catch (err) {
        console.error("API logout error:", err);
      }

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
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, refreshUser }}>
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
