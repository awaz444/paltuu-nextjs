// components/AppClientWrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
