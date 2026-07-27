/**
 * Supabase Audio URL Resolver
 *
 * Maps local audio file paths to Supabase Storage public URLs.
 * Set these env vars in your .env.local:
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 *   VITE_SUPABASE_AUDIO_BUCKET=audio
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET_NAME = import.meta.env.VITE_SUPABASE_AUDIO_BUCKET || 'audio';
const AUDIO_FOLDER = '';

/**
 * Converts a local audio path (e.g. "/audio/4.wav") to a Supabase public URL.
 * Falls back to the local path if Supabase env vars are not configured.
 */
export function getAudioUrl(localPath) {
  if (!localPath) return '';

  // If Supabase is configured, build the public URL
  if (SUPABASE_URL && SUPABASE_URL !== 'https://your-project.supabase.co') {
    const fileName = localPath.replace(/^\/audio\//, '');
    const filePath = AUDIO_FOLDER ? `${AUDIO_FOLDER}/${fileName}` : fileName;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodeURIComponent(filePath)}`;
  }

  // Fallback to local path for development
  return localPath;
}