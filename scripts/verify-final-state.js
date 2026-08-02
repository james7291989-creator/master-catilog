import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://llbwsbhhomvnjfjuswxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYndzYmhob212bmpmanVzd3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NjM3NywiZXhwIjoyMTAwNDQyMzc3fQ.It8TeO7pGimi9daPs0wBt7tV8PV4sipwNqA2Mdp0d6A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { count, error: cErr } = await supabase.from('sync_catalog').select('*', { count: 'exact', head: true });
if (cErr) throw cErr;
console.log(`TOTAL TRACKS: ${count} (must be 15)`);

const { data, error } = await supabase
  .from('sync_catalog')
  .select('track_title, mood, bpm, asset_type, file_name')
  .order('created_at', { ascending: true });
if (error) throw error;

console.log('\nFULL CATALOG:');
data.forEach((t, i) => {
  console.log(`${i + 1}. ${t.track_title} | mood=${t.mood} | bpm=${t.bpm ?? 'TBD'} | type=${t.asset_type} | file=${t.file_name}`);
});