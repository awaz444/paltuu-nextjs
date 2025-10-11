"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
  console.log("🔎 useSession status:", status);
  console.log("🔎 NextAuth session.user:", session?.user);

  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    console.log("🔎 LocalStorage user:", parsedUser);
    // Ensure both id and user_id are set for backward compatibility
    const userWithIds = {
      ...parsedUser,
      id: parsedUser.id || parsedUser.user_id,
      // user_id: parsedUser.user_id || parsedUser.id,
      method: parsedUser.method || "api"
    };
    setUser(userWithIds);
    setIsAuthenticated(true);

    // Redirect shop/shelter to respective panels when landing on login or root
    try {
      const role = userWithIds.role;
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      if (path === "/login" || path === "/") {
        if (role === "shop admin") router.push("/shop-panel");
        if (role === "shelter admin") router.push("/rescue-panel");
      }
    } catch {}
  }

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
            // Use database profile data if available
            const userWithDbData: User = {
              id: googleUserId,
              name: dbProfile.name,
              email: session.user.email || "",
              role: (session.user as any).role || "guest",
              profile_image_url: dbProfile.profile_image_url,
              method: "google",
            };
            
            localStorage.setItem("user", JSON.stringify(userWithDbData));
            setUser(userWithDbData);
            setIsAuthenticated(true);
            
            console.log("✅ Using database profile data for Google user:", userWithDbData);
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
        
        localStorage.setItem("user", JSON.stringify(googleUser));
        setUser(googleUser);
        setIsAuthenticated(true);
        
        console.log("✅ Using Google profile data:", googleUser);
        return googleUser;
      };
      
      fetchDatabaseProfile().then((finalUser) => {
        localStorage.removeItem("guest_session_id");

        // Redirect shop/shelter to panels after login
        try {
          const role = finalUser.role;
          if (role === "shop admin") router.push("/shop-panel");
          if (role === "shelter admin") router.push("/rescue-panel");
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
      localStorage.setItem("user", JSON.stringify(userWithDbData));
      localStorage.removeItem("guest_session_id");
      
      console.log("✅ Using database profile data for API user:", userWithDbData);
      
      // Redirect on API login success
      try {
        if (userWithDbData.role === "shop admin") router.push("/shop-panel");
        if (userWithDbData.role === "shelter admin") router.push("/rescue-panel");
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
  localStorage.setItem("user", JSON.stringify(userWithMethod));
  localStorage.removeItem("guest_session_id");

  console.log("✅ Using login response data for API user:", userWithMethod);

  // Redirect on API login success
  try {
    if (userWithMethod.role === "shop admin") router.push("/shop-panel");
    if (userWithMethod.role === "shelter admin") router.push("/rescue-panel");
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
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      console.log("✅ User data refreshed:", updatedUser);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const logout = async () => {
    console.log("Logout started, user method:", user?.method);

    try {
      // Clear local storage first
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.clear();

      // ✅ Clear guest session to prevent cart conflicts after logout
      // This will force a new guest session to be created on next cart action
      localStorage.removeItem("guest_session_id");

      // For Google users, handle NextAuth signOut correctly
      if (user?.method === "google") {
        console.log("Executing Google logout flow");
        await nextAuthSignOut({
          callbackUrl: "/login",
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

      // Manual cookie clearing as fallback
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = "/login";
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
