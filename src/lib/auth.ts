/**
 *  * auth.ts - Step 5: Supabase Auth adapter
  *
   * Changes from original:
    *  - Replaces the previous localStorage/PBKDF2 system.
     *  - All exported names unchanged so the rest of the app requires no modifications.
      *
       * Stage 2A changes:
        *  - AuthUser now includes organisationId: string | null
         *  - fetchOrgId() helper loads organisation_id from profiles table once at login
          *
           * EMAIL CONFIRMATION:
            *   Supabase is configured with "Confirm email = ON".
             *   signUp() throws with CONFIRM_EMAIL: sentinel when email confirmation is required.
              */

              import { supabase } from './supabase';

              // ---------- Public types ----------

              export interface AuthUser {
                id: string;
                  name: string;
                    email: string;
                      /** Loaded once at login from the profiles table. Null if profile row does not exist yet. */
                        organisationId: string | null;
                        }

                        // ---------- Session helpers ----------

                        /**
                         * Fetch the organisation_id for a given user id from the profiles table.
                          * Returns null on any error or if the row does not exist.
                           */
                           export async function fetchOrgId(userId: string): Promise<string | null> {
                             try {
                                 const { data } = await supabase
                                       .from('profiles')
                                             .select('organisation_id')
                                                   .eq('id', userId)
                                                         .single();
                                                             return data?.organisation_id ?? null;
                                                               } catch {
                                                                   return null;
                                                                     }
                                                                     }

                                                                     /**
                                                                      * Returns the current user synchronously from the Supabase session cache.
                                                                       * Supabase-js keeps the session in localStorage automatically.
                                                                        * NOTE: organisationId is NOT available via this sync helper - use authContext.currentUser instead.
                                                                         */
                                                                         export function getSession(): AuthUser | null {
                                                                           try {
                                                                               const raw = localStorage.getItem(
                                                                                     `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
                                                                                         );
                                                                                             if (!raw) return null;
                                                                                                 const parsed = JSON.parse(raw);
                                                                                                     const sbUser = parsed?.user ?? parsed?.data?.user;
                                                                                                         if (!sbUser) return null;
                                                                                                             return {
                                                                                                                   id: sbUser.id,
                                                                                                                         name: sbUser.user_metadata?.name ?? sbUser.email ?? '',
                                                                                                                               email: sbUser.email ?? '',
                                                                                                                                     organisationId: null, // not available synchronously - use authContext
                                                                                                                                         };
                                                                                                                                           } catch {
                                                                                                                                               return null;
                                                                                                                                                 }
                                                                                                                                                 }

                                                                                                                                                 /** Clears the Supabase session (sign out). */
                                                                                                                                                 export function clearSession(): void {
                                                                                                                                                   supabase.auth.signOut();
                                                                                                                                                   }

                                                                                                                                                   /** Returns the current user's id or null - used outside React (e.g. mockData.ts). */
                                                                                                                                                   export function getCurrentUserId(): string | null {
                                                                                                                                                     return getSession()?.id ?? null;
                                                                                                                                                     }

                                                                                                                                                     // ---------- Auth operations ----------

                                                                                                                                                     /**
                                                                                                                                                      * Sign in with email + password via Supabase Auth.
                                                                                                                                                       * Throws a user-friendly message on failure.
                                                                                                                                                        */
                                                                                                                                                        export async function signIn(email: string, password: string): Promise<AuthUser> {
                                                                                                                                                          const { data, error } = await supabase.auth.signInWithPassword({
                                                                                                                                                              email: email.toLowerCase().trim(),
                                                                                                                                                                  password,
                                                                                                                                                                    });

                                                                                                                                                                      if (error) {
                                                                                                                                                                          if (error.message.toLowerCase().includes('invalid login')) {
                                                                                                                                                                                throw new Error('Invalid email or password.');
                                                                                                                                                                                    }
                                                                                                                                                                                        if (error.message.toLowerCase().includes('email not confirmed')) {
                                                                                                                                                                                              throw new Error(
                                                                                                                                                                                                      'Please confirm your email address first. Check your inbox for a verification link.'
                                                                                                                                                                                                            );
                                                                                                                                                                                                                }
                                                                                                                                                                                                                    throw new Error(error.message);
                                                                                                                                                                                                                      }

                                                                                                                                                                                                                        const user = data.user;
                                                                                                                                                                                                                          if (!user) throw new Error('Sign in failed. Please try again.');

                                                                                                                                                                                                                            const organisationId = await fetchOrgId(user.id);

                                                                                                                                                                                                                              return {
                                                                                                                                                                                                                                  id: user.id,
                                                                                                                                                                                                                                      name: user.user_metadata?.name ?? user.email ?? '',
                                                                                                                                                                                                                                          email: user.email ?? '',
                                                                                                                                                                                                                                              organisationId,
                                                                                                                                                                                                                                                };
                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                /**
                                                                                                                                                                                                                                                 * Register a new account via Supabase Auth.
                                                                                                                                                                                                                                                  *
                                                                                                                                                                                                                                                   * Because "Confirm email" is ON in Supabase, the account is created but
                                                                                                                                                                                                                                                    * the user cannot sign in until they click the verification email.
                                                                                                                                                                                                                                                     * In that case this function throws with a clear message so the UI
                                                                                                                                                                                                                                                      * can show a "Check your inbox" notice instead of navigating to dashboard.
                                                                                                                                                                                                                                                       */
                                                                                                                                                                                                                                                       export async function signUp(
                                                                                                                                                                                                                                                         name: string,
                                                                                                                                                                                                                                                           email: string,
                                                                                                                                                                                                                                                             password: string
                                                                                                                                                                                                                                                             ): Promise<AuthUser> {
                                                                                                                                                                                                                                                               const { data, error } = await supabase.auth.signUp({
                                                                                                                                                                                                                                                                   email: email.toLowerCase().trim(),
                                                                                                                                                                                                                                                                       password,
                                                                                                                                                                                                                                                                           options: {
                                                                                                                                                                                                                                                                                 data: { name: name.trim() },
                                                                                                                                                                                                                                                                                     },
                                                                                                                                                                                                                                                                                       });

                                                                                                                                                                                                                                                                                         if (error) {
                                                                                                                                                                                                                                                                                             if (error.message.toLowerCase().includes('already registered')) {
                                                                                                                                                                                                                                                                                                   throw new Error('An account with this email already exists.');
                                                                                                                                                                                                                                                                                                       }
                                                                                                                                                                                                                                                                                                           throw new Error(error.message);
                                                                                                                                                                                                                                                                                                             }

                                                                                                                                                                                                                                                                                                               // session is null when email confirmation is required
                                                                                                                                                                                                                                                                                                                 if (!data.session) {
                                                                                                                                                                                                                                                                                                                     throw new Error(
                                                                                                                                                                                                                                                                                                                           'CONFIRM_EMAIL:Account created! Please check your email and click the ' +
                                                                                                                                                                                                                                                                                                                                   'verification link before signing in.'
                                                                                                                                                                                                                                                                                                                                       );
                                                                                                                                                                                                                                                                                                                                         }

                                                                                                                                                                                                                                                                                                                                           // session exists only when confirmation is disabled - immediate login
                                                                                                                                                                                                                                                                                                                                             const user = data.user;
                                                                                                                                                                                                                                                                                                                                               if (!user) throw new Error('Sign up failed. Please try again.');

                                                                                                                                                                                                                                                                                                                                                 const organisationId = await fetchOrgId(user.id);

                                                                                                                                                                                                                                                                                                                                                   return {
                                                                                                                                                                                                                                                                                                                                                       id: user.id,
                                                                                                                                                                                                                                                                                                                                                           name: user.user_metadata?.name ?? user.email ?? '',
                                                                                                                                                                                                                                                                                                                                                               email: user.email ?? '',
                                                                                                                                                                                                                                                                                                                                                                   organisationId,
                                                                                                                                                                                                                                                                                                                                                                     };
                                                                                                                                                                                                                                                                                                                                                                     }
                                                                                                                                                                                                                                                                                                                                                                     
 */