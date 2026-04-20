/**
 * Supabase client — single shared instance for the whole app.
 *
 * Environment variables (Vite prefix required):
 *   VITE_SUPABASE_URL      — your project URL, e.g. https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY — your project anon/public key
 *
 * Both must be set in:
 *   - .env.local (local development — never commit this file)
 *   - Vercel project settings → Environment Variables (production)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
   // Warn loudly in dev so misconfiguration is obvious.
  // The app will still load — pages that don't yet use Supabase are unaffected.
  console.warn(
       '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
       'Database features will not work until these are configured.'
     );
}

export const supabase = createClient(
   supabaseUrl ?? '',
   supabaseAnonKey ?? '',
 );

export type { SupabaseClient } from '@supabase/supabase-js';
