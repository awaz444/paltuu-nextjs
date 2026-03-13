"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { clearGuestSessionId } from "@/utils/guest";
import { logoutApi, googleLoginApi } from "@/utils/api";

interface User {
  id?: string;
  user_id?: string; // For backward compatibility
  name?: string;
  email: string;
  profile_image_url?: string; // ✅ consistent naming
  role?: string;
  dob?: string;
  phone_number?: string;
  city?: string;
  created_at?: string;
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
          const response = await fetch("/api/auth/verify-token", {
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
    if (typeof window === "undefined" || user !== null) return;

    const hydrateUser = async () => {
      try {
        // console.log("🔍 Attempting to hydrate user from server...");

        // Call server to verify token and get profile (NestJS)
        const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/core/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!verifyResponse.ok) {
          // console.log("⚠️ No valid token found on server");
          return;
        }

        const data = await verifyResponse.json();
        const { success, user: nestUser } = data;

        if (!success || !nestUser) {
          // console.log("⚠️ Profile retrieval failed");
          return;
        }

        // console.log("✅ Profile retrieved from NestJS:", nestUser);

        const hydratedUser: User = {
          id: String(nestUser.id),
          email: nestUser.email,
          name: nestUser.name || nestUser.email,
          role: nestUser.role || "guest",
          profile_image_url: nestUser.profile_image_url || "/default-avatar.png",
          dob: nestUser.dob,
          phone_number: nestUser.phone_number,
          city: nestUser.city,
          created_at: nestUser.created_at,
          method: "api"
        };
        setUser(hydratedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to hydrate user from server:", e);
      }
    };

    hydrateUser();
  }, []); // Run only once on mount

  useEffect(() => {
    // console.log("🔎 useSession status:", status);
    // console.log("🔎 NextAuth session.user:", session?.user);

    if (status === "authenticated" && session?.user) {
      // Only update if we don't have a user yet, or if this is a fresh Google login
      if (!user || user.method !== "google") {
        const syncGoogleWithNestJS = async () => {
          try {
            // Forward Google profile to NestJS to establish a backend session
            const data = await googleLoginApi({
              email: session.user?.email || "",
              name: session.user?.name || undefined,
            });

            if (data.success) {
              const { id, user_id, name, email, role, profile_image_url } = data.user;
              const nestUser: User = {
                id: String(id ?? user_id),
                name,
                email,
                role: role || "guest",
                profile_image_url: profile_image_url || "/default-avatar.png",
                method: "google",
              };

              setUser(nestUser);
              setIsAuthenticated(true);

              // Clear guest session cookie
              try { clearGuestSessionId(); } catch { }

              // Redirect based on role - only if on auth pages or landing
              try {
                const urlParams = new URLSearchParams(window.location.search);
                const callbackUrl = urlParams.get('callbackUrl');
                const isAuthPage = pathname === '/auth' || pathname === '/sign-up' || pathname === '/';

                if (callbackUrl && callbackUrl !== '/auth' && callbackUrl !== '/login') {
                  router.push(decodeURIComponent(callbackUrl));
                } else if (isAuthPage) {
                  const userRole = nestUser.role;
                  if (userRole === "shop admin") router.push("/shop-panel");
                  else if (userRole === "shelter admin") router.push("/rescue-panel");
                  else if (userRole === "vet") router.push("/vet-panel");
                  else if (userRole === "admin") router.push("/admin-panel");
                  else router.push("/browse-pets");
                }
              } catch { }
            }
          } catch (error) {
            console.error("Failed to sync Google login with NestJS:", error);
          }
        };

        syncGoogleWithNestJS();
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
        try {
          clearGuestSessionId();
          // console.log('✅ User logged in via API - guest session cleared');
        } catch (e) {
          console.error('Error clearing guest session on login:', e);
        }

        // console.log("✅ Using database profile data for API user:", userWithDbData);      // Redirect on API login success - check for callback URL first
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl');
          const isAuthPage = pathname === '/auth' || pathname === '/sign-up' || pathname === '/';

          if (callbackUrl && callbackUrl !== '/auth' && callbackUrl !== '/login') {
            router.push(decodeURIComponent(callbackUrl));
          } else if (isAuthPage) {
            if (userWithDbData.role === "shop admin") {
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
          }
        } catch { }
        return;
      }
    } catch (error) {
      //console.log("No database profile found, using login response data");
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
    try {
      clearGuestSessionId();
      //console.log('✅ User logged in via API (fallback) - guest session cleared');
    } catch (e) {
      console.error('Error clearing guest session on login:', e);
    }

    //console.log("✅ Using login response data for API user:", userWithMethod);  // Redirect on API login success - check for callback URL first
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl');
      const isAuthPage = pathname === '/auth' || pathname === '/sign-up' || pathname === '/';

      if (callbackUrl && callbackUrl !== '/auth' && callbackUrl !== '/login') {
        router.push(decodeURIComponent(callbackUrl));
      } else if (isAuthPage) {
        if (userWithMethod.role === "shop admin") {
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
      }
    } catch { }
  };


  const refreshUser = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/core/auth/me`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch updated profile");

      const data = await response.json();
      const updatedProfile = data.user;

      const updatedUser: User = {
        id: user?.id || String(updatedProfile.id),
        user_id: user?.user_id || String(updatedProfile.user_id),
        name: updatedProfile.name,
        profile_image_url: updatedProfile.profile_image_url,
        email: updatedProfile.email,
        role: updatedProfile.role,
        dob: updatedProfile.dob,
        phone_number: updatedProfile.phone_number,
        city: updatedProfile.city,
        created_at: updatedProfile.created_at,
        method: user?.method || "api",
      };

      setUser(updatedUser);
      //console.log("✅ User data refreshed from NestJS:", updatedUser);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const logout = async () => {
    // console.log("Logout started, user method:", user?.method);

    try {
      // Clear in-memory user and guest session cookie (cart will be handled by useCartSync hook)
      try { clearGuestSessionId(); } catch { }      // Clear session storage if used
      try { sessionStorage.clear(); } catch { }

      // Always attempt to clear the NestJS backend session via logoutApi
      try {
        await logoutApi();
      } catch (err) {
        console.error("API logout error during Google logout:", err);
      }

      // For Google users, handle NextAuth signOut
      if (user?.method === "google") {
        await nextAuthSignOut({
          callbackUrl: "/auth",
          redirect: true,
        });
        return;
      }

      // For API users, proceed with API logout
      //console.log("Executing API logout flow");
      try {
        await logoutApi();
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
      } catch { }

      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      try { sessionStorage.clear(); } catch { }
      try {
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      } catch { }
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
