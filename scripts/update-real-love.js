import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://llbwsbhhomvnjfjuswxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYndzYmhob212bmpmanVzd3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NjM3NywiZXhwIjoyMTAwNDQyMzc3fQ.It8TeO7pGimi9daPs0wBt7tV8PV4sipwNqA2Mdp0d6A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Update the "Real LOVE" track to use the .mp3 file
  const { data, error } = await supabase
    .from('sync_catalog')
    .update({ file_name: 'Real Love.mp3' })
    .eq('track_title', 'Real LOVE')
    .select();

  if (error) {
    console.error('Error updating track:', error.message);
    return;
  }

  console.log('✅ Updated "Real LOVE" file_name to "Real Love.mp3"');
  console.log(JSON.stringify(data, null, 2));

  // Verify all tracks with their file names
  const { data: allTracks, error: fetchError } = await supabase
    .from('sync_catalog')
    .select('track_title, file_name')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('Error fetching tracks:', fetchError.message);
    return;
  }

  console.log('\n📋 Full catalog file mapping:');
  allTracks.forEach((t, i) => {
    console.log(`${i + 1}. ${t.track_title} → ${t.file_name}`);
  });
}

main();