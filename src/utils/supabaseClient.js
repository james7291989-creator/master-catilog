import { createClient } from '@supabase/supabase-js';

// ⚡ APEX CTO OVERRIDE: VITE ENV BYPASS ENGAGED ⚡
const supabaseUrl = 'https://llbwsbhhomvnjfjuswxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYndzYmhob212bmpmanVzd3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NjM3NywiZXhwIjoyMTAwNDQyMzc3fQ.It8TeO7pGimi9daPs0wBt7tV8PV4sipwNqA2Mdp0d6A';

if (!supabaseUrl || !supabaseAnonKey) throw new Error("CRITICAL: MATRIX KEYS MISSING.");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;