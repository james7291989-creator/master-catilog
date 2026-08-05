import { createClient } from '@supabase/supabase-js';

// ⚡ APEX CTO OVERRIDE: STRICT ENV CREDENTIAL LOCKDOWN ⚡
// Credentials are pulled EXCLUSIVELY from Vite environment variables.
// No hardcoded keys. No bypasses. If either variable is missing, the
// client fails fast with a descriptive error so the misconfiguration
// is caught immediately at runtime.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'CRITICAL: VITE_SUPABASE_URL is missing. Set it in your .env file. ' +
    'Expected value: https://llbwsbhhomvnjfjuswxh.supabase.co'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'CRITICAL: VITE_SUPABASE_ANON_KEY is missing. Set it in your .env file. ' +
    'The anon key is required to authenticate against the Supabase project.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
