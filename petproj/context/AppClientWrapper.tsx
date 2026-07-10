// components/AppClientWrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";
import UsernameGateModal from "@/components/auth/UsernameGateModal";

export default function AppClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <AuthProvider>
        {children}
        <UsernameGateModal />
      </AuthProvider>
    </SessionProvider>
  );
}

