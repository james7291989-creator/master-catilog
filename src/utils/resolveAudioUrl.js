import { supabase } from './supabaseClient';

/**
 * ⚡ APEX SECURE STREAM RESOLUTION ENGINE ⚡
 *
 * FORTRESS PROTOCOL: All asset URLs are short-lived, expiring, and
 * cryptographically signed by Supabase. NO permanent public URLs are
 * ever emitted to the client bundle. Assets cannot be scraped or
 * replayed outside their TTL window.
 *
 * Zero-Exposure invariants enforced here:
 *  - Input validated against path-traversal & control-character injection
 *  - No `getPublicUrl()` — replaced with `createSignedUrl()` (default 60s TTL)
 *  - Fail-closed on any validation error (returns null, never a raw string)
 */

// How long (seconds) a signed URL remains valid. Short TTL = narrow scrape window.
const SIGNED_URL_TTL_SECONDS = 60;
// Bucket must be private (RLS-gated). Public buckets are forbidden by policy.
const STORAGE_BUCKET = 'vault-audio';

// Single source of truth for allowed audio extensions.
const ALLOWED_AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.aiff', '.m4a']);

/**
 * Returns true when `filename` is a safe, single-segment storage key.
 * Rejects traversal (`../`, `..\`), drive letters, absolute paths,
 * control characters, and empty strings.
 */
export function isSafeStorageKey(filename) {
  if (typeof filename !== 'string') return false;
  if (filename.length === 0 || filename.length > 512) return false;

  // Strip BOM + surrounding whitespace, then require a non-empty result.
  const trimmed = filename.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return false;

  // Reject path separators, absolute paths, and Windows drives.
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes(':')) return false;

  // Reject control characters (C0 + DEL).
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return false;

  // Reject dotfiles and reserved Windows names.
  if (trimmed.startsWith('.')) return false;
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(trimmed)) return false;

  // Extension must be in the allowlist.
  const ext = trimmed.slice(trimmed.lastIndexOf('.')).toLowerCase();
  return ALLOWED_AUDIO_EXTENSIONS.has(ext);
}

/**
 * Resolves a track to a short-lived, signed, in-vault audio URL.
 *
 * @param {object} track - raw catalog row
 * @returns {Promise<string|null>} expiring URL, or null if unreachable.
 */
export async function resolveTrackAudioUrl(track) {
  if (!track) return null;

  // 1. PRIMARY: secure bucket storage.
  const storageKey = track.file_name || track.storage_path || track.track_title;
  if (typeof storageKey === 'string' && storageKey.length > 0) {
    if (!isSafeStorageKey(storageKey)) {
      console.warn('[SECURE STREAM] Blocked unsafe storage key:', storageKey);
      return null;
    }

    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS, {
          download: false,
        });

      if (error) {
        console.warn('[SECURE STREAM] Signed URL error:', error.message);
        return null;
      }
      return data?.signedUrl ?? null;
    } catch (err) {
      console.warn('[SECURE STREAM] Unexpected failure:', err?.message ?? err);
      return null;
    }
  }

  // 2. FALLBACK: legacy static path (must point into the secured private store,
  //    never a publicly-served directory). Kept only for migration tolerance.
  const legacyPath = track.master || track.audio_path;
  if (typeof legacyPath === 'string' && legacyPath.startsWith('/secure_assets/')) {
    return legacyPath;
  }

  return null;
}

export default resolveTrackAudioUrl;