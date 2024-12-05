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
  const { data: session, status } = useSession(); // Handles Google login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id?: string; name?: string; email: string; role?: string; method: "google" | "api" | null } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session) {
      // User logged in via Google, set user_id and other details
      setUser({
        user_id: session.user?.user_id || undefined, // Ensure user_id is available
        name: session.user?.name || undefined,
        email: session.user?.email || "",
        role: session.user?.role || "guest",
        method: "google", // Assuming it's Google login here
      });
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false); // Reset if no authenticated session
    }
  }, [status, session]);

  const login = (user: { id: string; name: string; email: string; role: string }) => {
    const userWithMethod: { id: string; name: string; email: string; role: string; method: "api" } = {
      ...user,
      method: "api", // Explicitly typed as "api"
    };
    setUser(userWithMethod);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userWithMethod));
  };
  

  const logout = async () => {
    if (user?.method === "google") {
      await nextAuthSignOut({ callbackUrl: "/login" });
    } else {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user"); // Clear localStorage on logout
    }
  };
  console.log("AuthContext - User:", user);
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