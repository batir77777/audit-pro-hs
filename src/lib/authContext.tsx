/**
 * authContext.tsx - Stage 2A fix: non-blocking onAuthStateChange
 *
 * Changes from Stage 2A version:
 *  - onAuthStateChange callback is now synchronous (not async).
 *    fetchOrgId is called with .then() so setCurrentUser is NOT blocked
 *    waiting for a profile DB query. This fixes mobile login getting stuck.
 *  - login() calls signIn() which already fetches organisationId, then
 *    calls setCurrentUser immediately. The onAuthStateChange will also fire
 *    and update organisationId if it differs (race is harmless).
 *  - Added authLoading state so ProtectedRoute can wait for session restore
 *    before deciding to redirect.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, getSession, signIn, signUp, clearSession, fetchOrgId } from './auth';
import { supabase } from './supabase';

interface AuthContextValue {
      currentUser: AuthUser | null;
      authLoading: boolean;
      login: (email: string, password: string) => Promise<void>;
      register: (name: string, email: string, password: string) => Promise<void>;
      logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
      const [currentUser, setCurrentUser] = useState<AuthUser | null>(getSession);
      // authLoading is true until onAuthStateChange fires for the first time.
      // This prevents ProtectedRoute from redirecting to /login before the
      // session is restored from Supabase's localStorage token.
      const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          // Set currentUser immediately with what we know (no org id yet).
          // Then fetch org id in the background and update without blocking.
          const baseUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name ?? session.user.email ?? '',
            email: session.user.email ?? '',
            organisationId: null,
            role: 'client_user',
          };
          setCurrentUser(baseUser);
          setAuthLoading(false);
          // Non-blocking: fetch org id and patch currentUser when ready.
          fetchOrgId(session.user.id).then(({ organisationId, role }) => {
            setCurrentUser((prev) =>
              prev && prev.id === session.user.id
                ? { ...prev, organisationId, role }
                : prev
            );
          }).catch(() => {
            // fetchOrgId failure is non-fatal; organisationId stays null.
          });
        } else {
          setCurrentUser(null);
          setAuthLoading(false);
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
          <AuthContext.Provider value={{ currentUser, authLoading, login, register, logout }}>
              {children}
          </AuthContext.Provider>
        );
}

export function useAuth(): AuthContextValue {
      const ctx = useContext(AuthContext);
      if (!ctx) throw new Error('useAuth must be used within AuthProvider');
      return ctx;
}
