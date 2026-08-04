import { createClient } from '@supabase/supabase-js';

// ⚡ SYNC VAULT CLIENT — STRICT ENV CREDENTIAL LOCKDOWN ⚡
// Credentials are pulled EXCLUSIVELY from Vite environment variables.
// No hardcoded keys. No bypasses. If either variable is missing, the
// client fails fast with a descriptive error so the misconfiguration
// is caught immediately at runtime.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'CRITICAL: VITE_SUPABASE_URL is missing. Set it in your .env.local file. ' +
    'Expected value: https://owmyubghyfbexvvzbehh.supabase.co'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'CRITICAL: VITE_SUPABASE_ANON_KEY is missing. Set it in your .env.local file. ' +
    'The anon key is required to authenticate against the Supabase project.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;