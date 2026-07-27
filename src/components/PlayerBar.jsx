import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/usePlayerStore';

// =============================================================================
// AGGRESSIVE TITLE SANITIZATION (mirrors Vault for consistency)
// =============================================================================
const formatTrackTitle = (rawString) => {
  if (!rawString) return 'Untitled Master';
  let cleaned = rawString
    .replace(/^_+/, '')
    .replace(/_+$/, '')
    .replace(/\.(wav|mp3|flac|aiff?|ogg)$/i, '')
    .replace(/(\(Remix\)\s*){2,}/gi, '(Remix)')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/_+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  cleaned = cleaned
    .split(' ')
    .map((w) => {
      if (!w) return w;
      if (w === w.toUpperCase() && w.length > 1) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
  return cleaned || 'Untitled Master';
};

export default function PlayerBar() {
  const { activeTrack, isPlaying, togglePlay } = usePlayerStore();
  const audioRef = useRef(null);
  const [audioError, setAudioError] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    if (activeTrack && audioRef.current) {
      setAudioReady(false);
      setAudioError(false);
      
      console.log("🚀 PLAYERBAR RECEIVING URL:", activeTrack.file_path);
      
      // Reset and attempt playback
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.log('Playback blocked:', e);
          setAudioError(true);
        });
      }
    }
  }, [activeTrack, isPlaying]); // Added isPlaying to dependency array for sync

  useEffect(() => {
    if (activeTrack && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.log('Playback blocked:', e);
          setAudioError(true);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeTrack]);

  // =============================================================================
  // CSS EQUALIZER — 5 animated bars that pulse when playing
  // =============================================================================
  const Equalizer = () => (
    <div className="flex items-end gap-[3px] h-full shrink-0 py-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-cyan-400 origin-bottom"
          style={{
            height: isPlaying ? '100%' : '30%',
            animation: isPlaying
              ? `equalizer ${0.5 + i * 0.08}s ease-in-out infinite`
              : 'none',
            animationDelay: `${i * 0.1}s`,
            opacity: isPlaying ? 1 : 0.3,
            boxShadow: isPlaying
              ? '0 0 6px rgba(0,255,255,0.5), 0 0 12px rgba(0,255,255,0.2)'
              : 'none',
          }}
        />
      ))}
    </div>
  );

  return (
    <motion.div
      animate={{ y: activeTrack ? 0 : '100%', opacity: activeTrack ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      className="fixed bottom-0 left-0 w-full bg-zinc-950/95 backdrop-blur-3xl border-t border-cyan-900/50 z-50 px-6 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,255,255,0.1)]"
    >
      {/* LEFT: Track Info + Equalizer */}
      <div className="flex items-center gap-4 w-1/4 min-w-0">
        {/* Visualizer icon circle */}
        <div className="w-10 h-10 shrink-0 bg-black border border-cyan-500/50 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.2)] relative overflow-hidden">
          {isPlaying ? (
            <Equalizer />
          ) : (
            <span className="text-cyan-400 font-sans text-lg leading-none">♪</span>
          )}
        </div>
        <div className="truncate min-w-0">
          <div className="text-white font-black text-sm truncate">
            {activeTrack ? formatTrackTitle(activeTrack.title) : ''}
          </div>
          <div className="text-cyan-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5 flex items-center gap-2">
            <span>
              {activeTrack?.bpm || '---'} BPM • {activeTrack?.key || 'Unassigned Key'}
            </span>
            {audioError && (
              <span className="text-amber-400 text-[9px] flex items-center gap-1">
                ⚠️ Stream Error
              </span>
            )}
          </div>
        </div>
        {/* Inline equalizer next to title */}
        {isPlaying && (
          <div className="shrink-0 pl-2 border-l border-cyan-900/40">
            <Equalizer />
          </div>
        )}
      </div>

      {/* CENTER: Audio Player */}
      <div className="flex-1 max-w-2xl px-4">
        <style>{`
          audio::-webkit-media-controls-panel {
            background-color: transparent !important;
          }
          audio {
            width: 100%; height: 38px; outline: none;
            filter: invert(80%) sepia(100%) saturate(300%) hue-rotate(130deg) brightness(90%) contrast(150%);
            border-radius: 4px;
          }
          audio::-webkit-media-controls-current-time-display,
          audio::-webkit-media-controls-time-remaining-display {
            color: #94a3b8 !important;
            font-size: 11px !important;
            font-weight: 600 !important;
          }
        `}</style>
        <audio
          ref={audioRef}
          controls
          // ⚡ APEX CTO OVERRIDE: HARD-WIRED TO SECURE URL
          src={activeTrack ? activeTrack.file_path : ''}
          controlsList="nodownload noplaybackrate"
          onPlay={() => { if (!isPlaying) togglePlay(); setAudioError(false); }}
          onPause={() => { if (isPlaying) togglePlay(); }}
          onEnded={() => togglePlay()}
          onError={() => setAudioError(true)}
          onCanPlay={() => setAudioReady(true)}
        />
      </div>

      {/* RIGHT: Close */}
      <div className="w-1/4 flex justify-end">
        <button
          onClick={() => window.location.reload()}
          className="text-cyan-700 hover:text-cyan-300 text-[10px] font-bold tracking-[0.2em] transition-colors uppercase"
        >
          CLOSE ✕
        </button>
      </div>
    </motion.div>
  );
}