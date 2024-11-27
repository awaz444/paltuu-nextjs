"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface User {
  id?: string;
  name?: string;
  email: string;
  role: "regular user" | "vet" | "admin" | null; // Added role
  method: "google" | "api" | null;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: { name: string; email: string; role: User["role"] }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession(); // Handles Google login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session) {
      // User logged in via Google
      setUser({
        id: session.user?.id || undefined,
        name: session.user?.name || undefined,
        email: session.user?.email || "",
        role: (session.user?.role as "regular user" | "vet" | "admin") || "regular user",
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

  const login = (user: { name: string; email: string; role: User["role"] }) => {
    setUser({ ...user, method: "api" });
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(user)); // Save role in localStorage
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
