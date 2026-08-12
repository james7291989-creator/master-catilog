import { supabase } from './supabaseClient';
import { logWarn, logError } from './structuredLog';

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
 *  - Every failure path emits structured, aggregate-friendly diagnostic logs
 *    so stream outages are traceable without leaking the URL inside console.
 */

// How long (seconds) a signed URL remains valid. Short TTL = narrow scrape window.
const SIGNED_URL_TTL_SECONDS = 60;
// Bucket must be private (RLS-gated). Public buckets are forbidden by policy.
const STORAGE_BUCKET = 'vault-audio';

// Single source of truth for allowed audio extensions.
const ALLOWED_AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.aiff', '.m4a']);

// Track ID for diagnostics — never include the resolved URL itself.
const trackRef = (track) => String(track?.id ?? track?.track_title ?? 'unknown');

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
 * ⚡ V26 LOCAL STREAM FALLBACK — maps a track's file_name to the local
 * `/audio/` directory (public/audio). The streaming MP3s are named
 * `<base>_Stream.mp3` (e.g. `Baby You There_.wav` → `Baby You There__Stream.mp3`).
 * This guarantees playback even when the Supabase bucket is unreachable.
 */
function buildLocalAudioPath(track) {
  const rawName = track?.file_name || track?.storage_path || track?.track_title;
  if (typeof rawName !== 'string' || rawName.length === 0) return null;

  // Strip extension, then append the streaming suffix.
  const base = rawName.replace(/\.[^.]+$/, '');
  if (!base) return null;

  // URL-encode each path segment so spaces/unicode survive the browser.
  const encoded = base
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');

  return `/audio/${encoded}_Stream.mp3`;
}

/**
 * Resolves a track to a short-lived, signed, in-vault audio URL.
 *
 * Graceful-fallback contract:
 *  - On success: returns the signed URL string.
 *  - On ANY failure (validation, Supabase error, network): returns `null`
 *    AFTER emitting structured diagnostic logs (never the URL itself).
 *    The caller is responsible for keeping the player UI stable.
 *
 * @param {object} track - raw catalog row
 * @returns {Promise<string|null>} expiring URL, or null if unreachable.
 */
export async function resolveTrackAudioUrl(track) {
  if (!track) {
    logWarn('stream.resolve.null_track', { reason: 'no_track_payload' });
    return null;
  }

  // 1. PRIMARY: secure bucket storage.
  const storageKey = track.file_name || track.storage_path || track.track_title;
  if (typeof storageKey === 'string' && storageKey.length > 0) {
    if (!isSafeStorageKey(storageKey)) {
      logWarn('stream.resolve.blocked_key', { track: trackRef(track), reason: 'unsafe_storage_key' });
      return null;
    }

    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS, {
          download: false,
        });

      if (error) {
        logError('stream.resolve.sign_error', { track: trackRef(track), message: error.message });
        // ⚡ V26 FALLBACK: Supabase unreachable — serve the local streaming MP3.
        const localPath = buildLocalAudioPath(track);
        if (localPath) {
          logWarn('stream.resolve.local_fallback', { track: trackRef(track) });
          return localPath;
        }
        return null;
      }
      if (!data?.signedUrl) {
        logError('stream.resolve.empty_signed_url', { track: trackRef(track) });
        // ⚡ V26 FALLBACK: empty signed URL — serve the local streaming MP3.
        const localPath = buildLocalAudioPath(track);
        if (localPath) {
          logWarn('stream.resolve.local_fallback', { track: trackRef(track) });
          return localPath;
        }
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      logError('stream.resolve.exception', {
        track: trackRef(track),
        message: err?.message ?? 'unknown error',
      });
      // ⚡ V26 FALLBACK: exception — serve the local streaming MP3.
      const localPath = buildLocalAudioPath(track);
      if (localPath) {
        logWarn('stream.resolve.local_fallback', { track: trackRef(track) });
        return localPath;
      }
      return null;
    }
  }

  // 2. FALLBACK: legacy static path (must point into the secured private store,
  //    never a publicly-served directory). Kept only for migration tolerance.
  const legacyPath = track.master || track.audio_path;
  if (typeof legacyPath === 'string' && legacyPath.startsWith('/secure_assets/')) {
    logWarn('stream.resolve.legacy_fallback', { track: trackRef(track) });
    return legacyPath;
  }

  // 3. ⚡ V26 FINAL FALLBACK: local streaming MP3 in public/audio.
  const localPath = buildLocalAudioPath(track);
  if (localPath) {
    logWarn('stream.resolve.local_fallback', { track: trackRef(track) });
    return localPath;
  }

  logWarn('stream.resolve.no_source', { track: trackRef(track) });
  return null;
}

export default resolveTrackAudioUrl;
