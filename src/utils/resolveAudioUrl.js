import { supabase } from './supabaseClient';

// ⚡ APEX CTO OVERRIDE: EXACT VAULT NAME RESOLUTION ⚡
// Single source of truth for resolving a track reference into a playable
// public URL. The physical files in the `vault-audio` Supabase bucket DO NOT
// carry file extensions (e.g. the object is literally `Baby You There`).
// Therefore the resolver looks up the track EXACTLY as it is named — no
// `.mp3`/`.wav` is ever appended. The bucket is the single source of truth.

export function resolveTrackAudioUrl(track) {
  if (!track) return '#';

  const exactName = track.file_name || track.track_title;
  if (!exactName) return '#';

  const { data } = supabase.storage.from('vault-audio').getPublicUrl(exactName);
  return data?.publicUrl;
}

export default resolveTrackAudioUrl;
