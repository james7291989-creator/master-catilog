import { supabase } from './supabaseClient';

export const resolveTrackAudioUrl = (track) => {
  if (!track) return null;
  
  // 1. Get the raw text from the database
  let exactName = track.file_name || track.track_title;
  if (!exactName) return null;
  
  // 2. Decode it just in case it got corrupted, ensuring a pure string
  exactName = decodeURIComponent(exactName);

  // 3. Let Supabase natively build the URL from the pure string
  const { data } = supabase.storage.from('vault-audio').getPublicUrl(exactName);
  
  console.log("?? APEX PURE URL:", data?.publicUrl);
  return data?.publicUrl || null;
};
