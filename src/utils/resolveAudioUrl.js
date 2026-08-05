import { supabase } from './supabaseClient';

export const resolveTrackAudioUrl = (track) => {
  if (!track) return null;
  const exactName = track.file_name || track.track_title;
  if (!exactName) return null;
  
  // Encodes spaces (e.g. 'Baby You There' becomes 'Baby%20You%20There')
  const encodedName = exactName.split('/').map(segment => encodeURIComponent(segment)).join('/');
  
  const { data } = supabase.storage.from('vault-audio').getPublicUrl(encodedName);
  return data?.publicUrl || null;
};
