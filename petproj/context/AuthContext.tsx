"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface AuthContextProps {
  isAuthenticated: boolean;
  user: { id?: string; name?: string; email: string; role?: string; method: "google" | "api" | null } | null;
  login: (user: { id: string; name: string; email: string; role: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id?: string; name?: string; email: string; role?: string; method: "google" | "api" | null } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, method: "api" });
      setIsAuthenticated(true);
    }

    if (status === "authenticated" && session) {
      setUser({
        id: session.user?.user_id || undefined,
        name: session.user?.name || undefined,
        email: session.user?.email || "",
        role: session.user?.role || "guest",
        method: "google",
      });
      setIsAuthenticated(true);
    }
  }, [status, session]);

  const login = (userData: { id: string; name: string; email: string; role: string }) => {
    const userWithMethod = {
      ...userData,
      method: "api" as const,
    };
    setUser(userWithMethod);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userWithMethod));
  };

  const logout = async () => {
    try {
      await fetch('/api/users/logout', {
        method: 'GET',
        credentials: 'include'
      });

      if (user?.method === "google") {
        await nextAuthSignOut({
          callbackUrl: "/login",
          redirect: false
        });
      }

      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("next-auth.session-token");
      localStorage.removeItem("next-auth.csrf-token");
      localStorage.removeItem("next-auth.callback-url");

      setUser(null);
      setIsAuthenticated(false);

      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
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