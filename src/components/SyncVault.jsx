import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Disc, Music2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { resolveTrackAudioUrl } from '../utils/resolveAudioUrl';

// ⚡ TIER BADGE STYLING MATRIX — dynamic color coding per required_tier
const TIER_STYLES = {
  'Tier 1': 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
  'Tier 2': 'bg-sky-600/20 text-sky-300 border-sky-500/40',
  'Tier 3': 'bg-amber-600/20 text-amber-300 border-amber-500/40',
  'Tier 4': 'bg-zinc-600/20 text-zinc-300 border-zinc-500/40',
};

const DEFAULT_TIER_STYLE = 'bg-zinc-600/20 text-zinc-300 border-zinc-500/40';

// ⚡ SKELETON LOADER — polished shimmer placeholder for the loading state
function SkeletonCard() {
  return (
    <div className="animate-pulse border border-zinc-800/60 rounded-xl p-5 bg-zinc-900/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
          <div className="space-y-2 min-w-0">
            <div className="h-4 w-40 bg-zinc-800 rounded" />
            <div className="h-3 w-24 bg-zinc-800/70 rounded" />
          </div>
        </div>
        <div className="h-5 w-16 bg-zinc-800 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="h-3 bg-zinc-800/70 rounded" />
        <div className="h-3 bg-zinc-800/70 rounded" />
        <div className="h-3 bg-zinc-800/70 rounded" />
      </div>
      <div className="mt-4 h-9 bg-zinc-800/50 rounded-lg" />
    </div>
  );
}

export default function SyncVault() {
  // ⚡ ROBUST STATE MANAGEMENT
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);

  // ⚡ AUDIO REF MAP — one <audio> element per track, enabling
  // precise pause-all-others-on-play behavior.
  const audioRefs = useRef({});

  // ⚡ EFFICIENT FETCH — ordered by created_at descending
  useEffect(() => {
    let isMounted = true;

    const fetchCatalog = async () => {
      try {
        const { data, error } = await supabase
          .from('sync_catalog')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setCatalog(data || []);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load catalog.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCatalog();

    return () => {
      isMounted = false;
      // ⚡ MEMORY LEAK GUARD — tear down all audio elements on unmount
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        }
      });
      audioRefs.current = {};
    };
  }, []);

  // ⚡ CRUCIAL AUDIO LOGIC — when any track fires onPlay, pause every
  // other audio element and sync the currentlyPlayingId state.
  const handlePlay = useCallback((trackId) => {
    setCurrentlyPlayingId(trackId);
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== trackId && audio && !audio.paused) {
        audio.pause();
      }
    });
  }, []);

  // ⚡ CLEANUP ON PAUSE — clear the active id if the playing track pauses
  const handlePause = useCallback((trackId) => {
    setCurrentlyPlayingId((current) => (current === trackId ? null : current));
  }, []);

  // ⚡ AUDIO SOURCE MAPPING — routed through the shared APEX sanitization
  // pipeline so `.wav` is appended when missing and spaces are URL-encoded
  // (e.g. `Baby%20You%20There.wav`). Falls back to `#` when no reference exists.
  const resolveAudioSrc = (track) => {
    if (!track) return null;
    const resolved = resolveTrackAudioUrl(track);
    return resolved && resolved !== '#' ? resolved : null;
  };

  // ⚡ TIER BADGE RESOLVER
  const resolveTierStyle = (tier) => {
    if (!tier) return DEFAULT_TIER_STYLE;
    return TIER_STYLES[tier] || DEFAULT_TIER_STYLE;
  };

  return (
    <div id="sync-vault" className="max-w-7xl mx-auto px-6 py-12">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Sync Vault</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Tier-1 Music Supervisor Sync Catalog — {catalog.length} Master Recordings
          </p>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-6 flex items-center gap-3 border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-3 rounded-lg text-sm">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="font-mono tracking-wide">DATABASE ERROR: {error}</span>
        </div>
      )}

      {/* SKELETON LOADER */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : catalog.length === 0 ? (
        /* ⚡ ELEGANT EMPTY STATE */
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
          <Music2 size={40} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400 font-mono text-sm tracking-widest">
            NO RECORDINGS FOUND IN SYNC_CATALOG
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            The vault is empty. Add master recordings to begin licensing.
          </p>
        </div>
      ) : (
        /* ⚡ TRACK CARD GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((track, index) => {
            if (!track || !track.id) return null;
            const isCurrent = currentlyPlayingId === track.id;
            const audioSrc = resolveAudioSrc(track);

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
                className={`group border rounded-xl p-5 transition-colors ${
                  isCurrent
                    ? 'border-emerald-500/50 bg-zinc-900/40'
                    : 'border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-600'
                }`}
              >
                {/* TITLE + ARTIST + TIER BADGE */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => {
                        const audio = audioRefs.current[track.id];
                        if (audio) {
                          if (audio.paused) {
                            audio.play();
                          } else {
                            audio.pause();
                          }
                        }
                      }}
                      disabled={!audioSrc}
                      aria-label={isCurrent ? 'Pause track' : 'Play track'}
                      className={`p-2.5 rounded-full transition-all flex items-center justify-center flex-shrink-0 border ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-500'
                      } ${!audioSrc ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isCurrent ? (
                        <Pause size={16} className="fill-current" />
                      ) : (
                        <Play size={16} className="fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className={`font-semibold tracking-wide text-sm truncate ${isCurrent ? 'text-white' : 'text-zinc-200'}`}>
                        {track.track_title || 'Untitled Track'}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                        <Disc size={10} className="text-zinc-500 flex-shrink-0" />
                        <span className="truncate">{track.artist || 'Unknown Artist'}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${resolveTierStyle(track.required_tier)}`}
                  >
                    {track.required_tier || 'Tier 4'}
                  </span>
                </div>

                {/* METADATA ROW — BPM / MOOD / KEY */}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="border border-zinc-800/60 rounded-lg py-2">
                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest">BPM</div>
                    <div className="text-sm font-mono text-zinc-200 mt-0.5">
                      {track.bpm ? track.bpm : '---'}
                    </div>
                  </div>
                  <div className="border border-zinc-800/60 rounded-lg py-2">
                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Mood</div>
                    <div className="text-sm font-medium text-zinc-200 mt-0.5 truncate px-1">
                      {track.mood || 'Multi-Genre'}
                    </div>
                  </div>
                  <div className="border border-zinc-800/60 rounded-lg py-2">
                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Key</div>
                    <div className="text-sm font-mono text-zinc-200 mt-0.5">
                      {track.key ? track.key.toUpperCase() : '--'}
                    </div>
                  </div>
                </div>

                {/* ⚡ CUSTOM-STYLED HTML5 AUDIO PLAYER */}
                {audioSrc ? (
                  <div className="mt-4">
                    <audio
                      ref={(el) => {
                        if (el) audioRefs.current[track.id] = el;
                        else delete audioRefs.current[track.id];
                      }}
                      src={audioSrc}
                      preload="none"
                      controls
                      onPlay={() => handlePlay(track.id)}
                      onPause={() => handlePause(track.id)}
                      className="w-full h-9 [&::-webkit-media-controls-panel]:bg-zinc-900 [&::-webkit-media-controls-play-button]:text-emerald-400 [&::-webkit-media-controls-current-time-display]:text-zinc-300 [&::-webkit-media-controls-time-remaining-display]:text-zinc-500 [&::-webkit-media-controls-timeline]:bg-zinc-700 [&::-webkit-media-controls-volume-slider]:bg-zinc-700"
                    />
                  </div>
                ) : (
                  /* ⚡ FALLBACK UI — no file_name available */
                  <div className="mt-4 border border-dashed border-zinc-800 rounded-lg py-2.5 text-center text-[11px] text-zinc-500 font-mono tracking-wider">
                    NO AUDIO FILE ATTACHED
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
