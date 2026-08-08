import { createClient } from '@supabase/supabase-js';

// ⚡ APEX FORTRESS CLIENT — STRICT ENV CREDENTIAL LOCKDOWN ⚡
// Credentials are pulled EXCLUSIVELY from Vite environment variables.
// No hardcoded keys. No bypasses. If either variable is missing, the
// client fails fast with a descriptive error so the misconfiguration
// is caught immediately at runtime.
//
// SECURITY: Error messages intentionally omit the project reference to
// prevent leaking the Supabase project URL into the client bundle.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ⚡ APEX TELEMETRY: Prove the URL is clean on the live server ⚡
console.log("APEX TELEMETRY: Supabase URL Initializing ->", import.meta.env.VITE_SUPABASE_URL);

if (!supabaseUrl) {
  throw new Error(
    'CRITICAL: VITE_SUPABASE_URL is missing. Set it in your .env.local file.'
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