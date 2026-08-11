import { create } from 'zustand';
import { resolveTrackAudioUrl } from '../utils/resolveAudioUrl';

// =============================================================================
// PILLAR 1: STATEFUL MEMORY — "WELCOME BACK" PROTOCOL
// Silently persists last played track & timestamp to localStorage.
// ⚡ V24.1 FORTRESS THROTTLE: localStorage writes are throttled to once every
// 5000ms so the 60fps scrubber never triggers a synchronous disk write.
// A `flushSession` action persists immediately on tab close (pagehide) so no
// progress is ever lost despite the throttle.
// =============================================================================
const STORAGE_KEY = 'rodneya_session';
const PERSIST_THROTTLE_MS = 5000;

// Module-level throttle clock — shared across all store instances.
let lastPersistAt = 0;

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
    .replace(/\.(mp3|wav|flac|aiff|m4a)$/i, '')
    .trim();
};

// Helper: maps a raw DB track into a playable track object with secure URL.
// ⚡ FORTRESS PROTOCOL: resolves through the shared async signed-URL pipeline
// (utils/resolveAudioUrl.js). The URL is short-lived (60s TTL) so it is
// re-resolved on every play next/advance — never cached client-side beyond
// the active playback session.
const mapTrackWithUrl = async (track) => {
  const finalAudioUrl = await resolveTrackAudioUrl(track);
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
    lastPersistAt = Date.now();
    set({ activeTrack: track, isPlaying: true });
    saveSession({ track, currentTime: 0 });
  },

  setTrack: (track) => {
    lastPersistAt = Date.now();
    set({ activeTrack: track, isPlaying: true, currentTime: 0 });
    saveSession({ track, currentTime: 0 });
  },

  setPlaylist: (tracks) => set({ playlist: tracks }),

  playNextTrack: async () => {
    const { playlist, activeTrack } = get();
    if (!playlist.length || !activeTrack) return;
    const currentIndex = playlist.findIndex((t) => t.id === activeTrack.id);
    // ⚡ CONTINUOUS PLAYBACK LOOP — modulo wraps to index 0 after the last track.
    // The catalog never dead-stops; it cycles forever.
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + 1) % playlist.length;
    const nextTrack = await mapTrackWithUrl(playlist[nextIndex]);
    lastPersistAt = Date.now();
    saveSession({ track: nextTrack, currentTime: 0 });
    set({ activeTrack: nextTrack, isPlaying: true, currentTime: 0 });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  // ⚡ V24.1 SCRUBBER DECOUPLING: this updates the in-memory `currentTime`
  // (fast, no IO) on every tick, but the localStorage write is hard-throttled
  // to once per 5000ms. The UI scrubber is driven independently via rAF/refs
  // in PlayerBar, so this never triggers a React re-render per tick.
  updateCurrentTime: (time) => {
    const { activeTrack } = get();
    if (!activeTrack) return;
    set({ currentTime: time });
    const now = Date.now();
    if (now - lastPersistAt >= PERSIST_THROTTLE_MS) {
      lastPersistAt = now;
      saveSession({ track: activeTrack, currentTime: time });
    }
  },

  // ⚡ V24.1 ABRUPT-CLOSE GUARD: flush the latest position immediately.
  // Bound to `pagehide`/`beforeunload` in PlayerBar so the user's saved
  // progress survives even if the tab is closed mid-throttle-window.
  flushSession: () => {
    const { activeTrack, currentTime } = get();
    if (!activeTrack) return;
    lastPersistAt = Date.now();
    saveSession({ track: activeTrack, currentTime });
  },

  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ activeTrack: null, isPlaying: false, currentTime: 0, sessionRestored: false, resumedFromTrack: null });
  },
}));

export default usePlayerStore;