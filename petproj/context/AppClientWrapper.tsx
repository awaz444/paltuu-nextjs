// components/AppClientWrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}

