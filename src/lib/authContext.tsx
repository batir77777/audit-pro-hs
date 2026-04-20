import React, { createContext, useContext, useState } from 'react';
import { AuthUser, getSession, signIn, signUp, clearSession } from './auth';

interface AuthContextValue {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getSession);

  const login = async (email: string, password: string) => {
    const user = await signIn(email, password);
    setCurrentUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const user = await signUp(name, email, password);
    setCurrentUser(user);
  };

  const logout = () => {
    clearSession();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
