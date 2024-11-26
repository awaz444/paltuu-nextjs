import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: { id: string; email: string; role: string } | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: session, status } = useSession();
  const [authState, setAuthState] = useState<AuthContextProps>({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setAuthState({
        isAuthenticated: true,
        user: {
          id: session.user?.id || '', // Ensure user data exists
          email: session.user?.email || '', // Ensure email exists
          role: session.user?.role || '', // Ensure role exists
        },
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
      });
    }
  }, [status, session]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};