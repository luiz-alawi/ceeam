'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { logoutAction } from '@/actions/auth';

export interface AuthUser {
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  currentUser: string;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: AuthUser | null;
}) {
  const [user] = useState<AuthUser | null>(initialSession);

  const logout = async () => {
    await logoutAction();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin ?? false,
        currentUser: user?.email ?? '',
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
