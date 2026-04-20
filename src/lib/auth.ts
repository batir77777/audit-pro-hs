/**
 * auth.ts — Step 5: Supabase Auth adapter
 *
 * Replaces the previous localStorage/PBKDF2 system.
 * All exported names and the AuthUser shape are unchanged so the
 * rest of the app (authContext, mockData, ProtectedRoute, Login) requires
 * no modifications.
 *
 * EMAIL CONFIRMATION:
 *   Supabase is configured with "Confirm email = ON".
 *   signUp() returns { needsConfirmation: true } when the account was
 *   created but the user must click the verification link before they
 *   can sign in.  authContext surfaces this to Login.tsx via the
 *   register() promise rejection message so the UI can display it.
 */

import { supabase } from './supabase';

// ---------- Public types ----------

export interface AuthUser {
    id: string;
    name: string;
    email: string;
}

// ---------- Session helpers ----------

/**
 * Returns the current user synchronously from the Supabase session cache.
 * Supabase-js keeps the session in localStorage automatically — no manual
 * session management needed.
 */
export function getSession(): AuthUser | null {
    // supabase.auth.getSession() is async, but the *cached* value is
  // available synchronously via the internal storage key.  We use the
  // low-level approach so this function stays sync (same contract as before).
  try {
        const raw = localStorage.getItem(
                `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
              );
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const sbUser = parsed?.user;
        if (!sbUser) return null;
        return {
                id: sbUser.id,
                name: sbUser.user_metadata?.name ?? sbUser.email ?? '',
                email: sbUser.email ?? '',
        };
  } catch {
        return null;
  }
}

/** Clears the Supabase session (sign out). */
export function clearSession(): void {
    // Fire-and-forget; authContext also calls supabase.auth.signOut()
  supabase.auth.signOut().catch(() => {});
}

/** Returns the current user's id or null — used outside React (e.g. mockData.ts). */
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
        // Map Supabase error codes to friendly messages
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

  return {
        id: user.id,
        name: user.user_metadata?.name ?? user.email ?? '',
        email: user.email ?? '',
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

  // session exists only when confirmation is disabled — immediate login
  const user = data.user!;
    return {
          id: user.id,
          name: user.user_metadata?.name ?? user.email ?? '',
          email: user.email ?? '',
    };
}
