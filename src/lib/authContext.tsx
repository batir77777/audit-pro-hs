/**
 *  * authContext.tsx - Supabase Auth context
  *
   * Stage 2A changes:
    *  - onAuthStateChange now also loads organisation_id from profiles and
     *    sets it on currentUser, so it is available for the lifetime of the session.
      *  - login() and register() pass through the organisationId returned by
       *    signIn() / signUp() (which now call fetchOrgId internally).
        *  - All exported names, the AuthUser shape, and the context interface
         *    are backward-compatible - all existing consumers require no changes.
          */

          import React, { createContext, useContext, useState, useEffect } from 'react';
          import { AuthUser, getSession, signIn, signUp, clearSession, fetchOrgId } from './auth';
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
                                async (_event, session) => {
                                        if (session?.user) {
                                                  // Load organisation_id once at session restore / token refresh
                                                            const organisationId = await fetchOrgId(session.user.id);
                                                                      setCurrentUser({
                                                                                  id: session.user.id,
                                                                                              name: session.user.user_metadata?.name ?? session.user.email ?? '',
                                                                                                          email: session.user.email ?? '',
                                                                                                                      organisationId,
                                                                                                                                });
                                                                                                                                        } else {
                                                                                                                                                  setCurrentUser(null);
                                                                                                                                                          }
                                                                                                                                                                }
                                                                                                                                                                    );
                                                                                                                                                                        return () => subscription.unsubscribe();
                                                                                                                                                                          }, []);

                                                                                                                                                                            const login = async (email: string, password: string) => {
                                                                                                                                                                                const user = await signIn(email, password); // signIn now returns organisationId
                                                                                                                                                                                    setCurrentUser(user);
                                                                                                                                                                                      };

                                                                                                                                                                                        const register = async (name: string, email: string, password: string) => {
                                                                                                                                                                                            try {
                                                                                                                                                                                                  const user = await signUp(name, email, password);
                                                                                                                                                                                                        setCurrentUser(user);
                                                                                                                                                                                                            } catch (err: any) {
                                                                                                                                                                                                                  if (err.message?.startsWith('CONFIRM_EMAIL:')) {
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
                                                                                                                                                                                                                                                                                
 */