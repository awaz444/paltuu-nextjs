"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface User {
  id?: string;
  name?: string;
  email: string;
  profile_picture?: string;
  role?: string;
  method: "google" | "api" | null;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: { id: string; name: string; email: string; role: string; profile_picture?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, method: parsedUser.method || "api" });
      setIsAuthenticated(true);
    }

    if (status === "authenticated" && session?.user) {
      const googleUser: User = {
        id: (session.user as any).user_id || undefined,
        name: session.user.name || undefined,
        email: session.user.email || "",
        role: (session.user as any).role || "guest",
        profile_picture: session.user.image || undefined, // ✅ Capture Google profile picture
        method: "google",
      };

      // Store Google user in localStorage
      localStorage.setItem("user", JSON.stringify(googleUser));

      setUser(googleUser);
      setIsAuthenticated(true);
    }
  }, [status, session]);

  const login = (userData: { id: string; name: string; email: string; role: string; profile_picture?: string }) => {
    const userWithMethod: User = {
      ...userData,
      method: "api",
    };
    setUser(userWithMethod);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userWithMethod));
  };

  const logout = async () => {
    console.log("Logout started, user method:", user?.method);

    try {
      // Clear local storage first
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.clear();

      // For Google users, handle NextAuth signOut correctly
      if (user?.method === "google") {
        console.log("Executing Google logout flow");
        await nextAuthSignOut({
          callbackUrl: "/login", // where to go after signout
          redirect: true,
        });
        return; // NextAuth will handle the redirect
      }

      // For API users, proceed with API logout
      console.log("Executing API logout flow");
      try {
        const response = await fetch("/api/users/logout", {
          method: "GET",
          credentials: "include", // Important for cookies
        });

        if (!response.ok) {
          throw new Error(`API logout failed with status: ${response.status}`);
        }

        console.log("API logout successful");
      } catch (err) {
        console.error("API logout error:", err);
      }

      // Clear state
      setUser(null);
      setIsAuthenticated(false);

      // Manual cookie clearing as fallback
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Final redirect for non-Google users
      console.log("Redirecting to login page");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Emergency fallback
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
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
