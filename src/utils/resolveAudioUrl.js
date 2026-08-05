import { supabase } from './supabaseClient';

// ⚡ APEX CTO OVERRIDE: AUDIO URL SANITIZATION LOCKDOWN ⚡
// Single source of truth for resolving a track reference into a playable
// public URL. Guarantees:
//   1. A `.mp3` extension is appended when the reference is missing one.
//   2. Spaces and other unsafe characters are URL-encoded so the browser
//      never receives a malformed payload (e.g. `Baby%20You%20There.mp3`).
//   3. MP3 masters are 100% hardwired through the `vault-audio` Supabase
//      bucket via `getPublicUrl()` — the bucket is the single source of
//      truth for all `.mp3` streams.

const AUDIO_EXTENSIONS = /\.(wav|mp3|flac|aac|ogg|m4a)$/i;

function ensureExtension(fileName) {
  if (!fileName) return '';
  const trimmed = String(fileName).trim();
  if (!trimmed) return '';
  // If the reference already carries a known audio extension, keep it as-is.
  if (AUDIO_EXTENSIONS.test(trimmed)) return trimmed;
  // Otherwise append the canonical `.mp3` extension.
  return `${trimmed}.mp3`;
}

function encodePath(fileName) {
  if (!fileName) return '';
  // Split on slashes so we only encode each path segment (preserving folders),
  // then re-join. This keeps `/` intact while encoding spaces and specials.
  return String(fileName)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function resolveTrackAudioUrl(track) {
  if (!track) return '#';

  const rawName = track.file_name || track.master || track.track_title;
  if (!rawName) return '#';

  const sanitizedName = ensureExtension(rawName);
  const encodedName = encodePath(sanitizedName);

  // ⚡ APEX CTO OVERRIDE: MP3 masters are 100% hardwired through the
  // `vault-audio` Supabase bucket. The bucket is the single source of truth
  // for all `.mp3` streams — never the public/ directory.
  const { data } = supabase.storage.from('vault-audio').getPublicUrl(encodedName);
  return data?.publicUrl || `/${encodedName}`;
}

export default resolveTrackAudioUrl;
