import { create } from 'zustand';
import { resolveTrackAudioUrl } from '../utils/resolveAudioUrl';

// =============================================================================
// PILLAR 1: STATEFUL MEMORY — "WELCOME BACK" PROTOCOL
// Silently persists last played track & timestamp to localStorage
// =============================================================================
const STORAGE_KEY = 'rodneya_session';

const loadSession = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const saveSession = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* silent fail */ }
};

const initialSession = loadSession();

// Helper: aggressive title cleaner (mirrors Vault.jsx logic)
const formatTrackTitle = (rawTitle) => {
  if (!rawTitle) return "Untitled Track";
  return rawTitle
    .replace(/^_+/, '')
    .replace(/\.wav$|\.mp3$/i, '')
    .trim();
};

// Helper: maps a raw DB track into a playable track object with secure URL
// ⚡ APEX CTO OVERRIDE: resolves through the shared sanitization pipeline
// (utils/resolveAudioUrl.js) so `.wav` is appended when missing and spaces
// are URL-encoded. MP3 masters stream from public/; everything else resolves
// through the `vault-audio` Supabase bucket.
const mapTrackWithUrl = (track) => {
  const finalAudioUrl = resolveTrackAudioUrl(track);
  return {
    ...track,
    id: track.id,
    title: formatTrackTitle(track.track_title),
    master: track.file_name,
    file_path: finalAudioUrl,
    audio_path: finalAudioUrl,
  };
};

const usePlayerStore = create((set, get) => ({
  activeTrack: initialSession?.track || null,
  isPlaying: false,
  currentTime: initialSession?.currentTime || 0,
  sessionRestored: !!initialSession,
  resumedFromTrack: initialSession?.track?.id || null,

  // SEQUENTIAL PLAYBACK ENGINE — PHASE 1
  playlist: [],

  playTrack: (track) => {
    set({ activeTrack: track, isPlaying: true });
    saveSession({ track, currentTime: 0 });
  },

  setTrack: (track) => {
    set({ activeTrack: track, isPlaying: true, currentTime: 0 });
    saveSession({ track, currentTime: 0 });
  },

  setPlaylist: (tracks) => set({ playlist: tracks }),

  playNextTrack: () => {
    const { playlist, activeTrack } = get();
    if (!playlist.length || !activeTrack) return;
    const currentIndex = playlist.findIndex((t) => t.id === activeTrack.id);
    // ⚡ CONTINUOUS PLAYBACK LOOP — modulo wraps to index 0 after the last track.
    // The catalog never dead-stops; it cycles forever.
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + 1) % playlist.length;
    const nextTrack = mapTrackWithUrl(playlist[nextIndex]);
    saveSession({ track: nextTrack, currentTime: 0 });
    set({ activeTrack: nextTrack, isPlaying: true, currentTime: 0 });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  updateCurrentTime: (time) => {
    const { activeTrack } = get();
    if (activeTrack) {
      saveSession({ track: activeTrack, currentTime: time });
      set({ currentTime: time });
    }
  },

  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ activeTrack: null, isPlaying: false, currentTime: 0, sessionRestored: false, resumedFromTrack: null });
  },

  openStems: (track) => console.log('Opening stems for', track.title),
}));

export default usePlayerStore;