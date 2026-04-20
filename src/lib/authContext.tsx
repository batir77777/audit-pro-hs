/**
 * authContext.tsx - Step 5: Supabase Auth context
 *
 * Changes from original:
 *  - Added useEffect with supabase.auth.onAuthStateChange so React state
 *    stays in sync with the Supabase session (token refresh, sign-out in
 *    another tab, etc.).h
 *  - register() catches the CONFIRM_EMAIL: sentinel thrown by signUp()
 *    and re-throws a clean message the Login form can display.
 *  - All exported names, the AuthUser shape, and the context interface
 *    are identical to the original - ProtectedRoute, Login, and all
 *    other consumers require no changes.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, getSession, signIn, signUp, clearSession } from './auth';
import { supabase } from './supabase';

interface AuthContextValue {
      currentUser: AuthUser | null;
      login: (email: string, password: string) => Promise<void>;
      register: (name: string, email: string, password: string) => Promise<void>;
      logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
      const [currentUser, setCurrentUser] = useState<AuthUser | null>(getSession);

  useEffect(() => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    (_event, session) => {
                                if (session?.user) {
                                              setCurrentUser({
                                                              id: session.user.id,
                                                              name: session.user.user_metadata?.name ?? session.user.email ?? '',
                                                              email: session.user.email ?? '',
                                              });
                                } else {
                                              setCurrentUser(null);
                                }
                    }
                  );
          return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
          const user = await signIn(email, password);
          setCurrentUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
          try {
                    const user = await signUp(name, email, password);
                    setCurrentUser(user);
          } catch (err: any) {
                    if (typeof err?.message === 'string' && err.message.startsWith('CONFIRM_EMAIL:')) {
                                throw new Error(err.message.slice('CONFIRM_EMAIL:'.length));
                    }
                    throw err;
          }
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
