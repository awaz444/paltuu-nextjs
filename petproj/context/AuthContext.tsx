"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface AuthContextProps {
  isAuthenticated: boolean;
  user: { user_id?: string; name?: string; email: string; role?: string; method: "google" | "api" | null } | null;
  login: (user: { name: string; email: string;role:string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession(); // Handles Google login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ user_id?: string; name?: string; email: string;role?: string; method: "google" | "api" | null } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session) {
      // User logged in via Google
      setUser({
        user_id: session.user?.user_id || undefined,
        name: session.user?.name || undefined,
        email: session.user?.email || "",
        role: session.user?.role || "guest",
        method: "google",
      });
      setIsAuthenticated(true);
    } else if (status === "unauthenticated") {
      // Check for API-based login in localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser({ ...JSON.parse(storedUser), method: "api" });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [status, session]);

  const login = (user: { name: string; email: string; role: string}) => {
    setUser({ ...user, method: "api" });
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    if (user?.method === "google") {
      await nextAuthSignOut({ callbackUrl: "/login" });
    } else {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
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
