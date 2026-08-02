import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://llbwsbhhomvnjfjuswxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYndzYmhob212bmpmanVzd3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NjM3NywiZXhwIjoyMTAwNDQyMzc3fQ.It8TeO7pGimi9daPs0wBt7tV8PV4sipwNqA2Mdp0d6A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newTracks = [
  {
    track_title: 'Real LOVE',
    artist: 'RodneyA',
    asset_type: 'Master',
    rights_owner: '100% Master / 100% Publishing (One-Stop)',
    file_name: 'Real LOVE.wav',
    required_tier: 'Bronze',
    bpm: null,
    mood: 'Raw / Emotional'
  },
  {
    track_title: 'Her Words',
    artist: 'RodneyA',
    asset_type: 'Master',
    rights_owner: '100% Master / 100% Publishing (One-Stop)',
    file_name: 'Her Words.wav',
    required_tier: 'Bronze',
    bpm: null,
    mood: 'Deep / Reflective'
  },
  {
    track_title: 'Balcony Nights',
    artist: 'RodneyA',
    asset_type: 'Master',
    rights_owner: '100% Master / 100% Publishing (One-Stop)',
    file_name: 'Balcony Nights.wav',
    required_tier: 'Bronze',
    bpm: null,
    mood: 'Grit / Storytelling'
  }
];

async function main() {
  console.log('Inserting 3 new tracks...');
  
  const { data, error } = await supabase
    .from('sync_catalog')
    .insert(newTracks)
    .select();

  if (error) {
    console.error('Error inserting tracks:', error.message);
    return;
  }

  console.log('✅ Successfully inserted 3 tracks!');
  console.log(JSON.stringify(data, null, 2));

  // Verify the new count
  const { count, error: countError } = await supabase
    .from('sync_catalog')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting:', countError.message);
  } else {
    console.log(`Total tracks in database now: ${count}`);
  }
}

main();