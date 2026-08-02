import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/usePlayerStore';
import useAudioAnalyzer from '../utils/useAudioAnalyzer';

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

// =============================================================================
// TIME FORMATTER — mm:ss for the custom timeline labels
// =============================================================================
const formatTime = (seconds) => {
  if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function PlayerBar() {
  const { activeTrack, isPlaying, togglePlay, updateCurrentTime, sessionRestored, resumedFromTrack, playNextTrack } = usePlayerStore();
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const isScrubbingRef = useRef(false);
  const [audioError, setAudioError] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // PILLAR 2: Ambient Audio Reactivity
  const spectrum = useAudioAnalyzer(audioRef.current, isPlaying && !!activeTrack);

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
  }, [activeTrack, isPlaying]);

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

  // Reset timeline display whenever the track changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [activeTrack]);

  // =============================================================================
  // ⚡ DOM AUDIO PLAYBACK FORCER — CONTINUOUS PLAYBACK LIFECYCLE
  // When the active track changes, if the global state says it should be playing,
  // force the browser to play. This guarantees auto-advance after onEnded fires
  // and the store swaps in the next track (the src update alone is not enough).
  // =============================================================================
  useEffect(() => {
    // When the active track changes, if the global state says it should be playing, force it.
    if (activeTrack && isPlaying && audioRef.current) {
      // Pause briefly to ensure the new src is fully mounted to the DOM
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Auto-play prevented by browser:", error);
        });
      }
    }
  }, [activeTrack]); // Only re-run when the track physically changes

  // PILLAR 1: Session restoration notification
  useEffect(() => {
    if (sessionRestored && activeTrack) {
      setShowResumeBanner(true);
      const timer = setTimeout(() => setShowResumeBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [sessionRestored, activeTrack]);

  // PILLAR 1: Persist current playback time
  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      // Suppress session persistence while the user is actively scrubbing
      if (!isScrubbingRef.current && isPlaying) {
        updateCurrentTime(audioRef.current.currentTime);
      }
    }
  }

  function handleLoadedMetadata() {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  }

  // =============================================================================
  // ⚡ CUSTOM INTERACTIVE SCRUBBING ENGINE
  // Click OR drag anywhere on the timeline — the pointer position is mapped
  // to the track's total duration and written straight to audioRef.currentTime.
  // =============================================================================
  function scrubToClientX(clientX) {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar || !isFinite(audio.duration) || audio.duration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const time = ratio * audio.duration;

    // Real-time scrub — jump the audio position immediately
    audio.currentTime = time;
    setCurrentTime(time);
  }

  function handlePointerDown(e) {
    if (!audioRef.current) return;
    isScrubbingRef.current = true;
    // Capture the pointer so dragging continues even outside the bar
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
    scrubToClientX(e.clientX);
  }

  function handlePointerMove(e) {
    if (isScrubbingRef.current) {
      scrubToClientX(e.clientX);
    }
  }

  function endScrub() {
    if (!isScrubbingRef.current) return;
    isScrubbingRef.current = false;
    // Persist the final scrubbed position to the session
    if (audioRef.current) {
      updateCurrentTime(audioRef.current.currentTime);
    }
  }

  // =============================================================================
  // CSS EQUALIZER — 5 animated bars, stripped of color
  // =============================================================================
  const Equalizer = () => (
    <div className="flex items-end gap-[3px] h-full shrink-0 py-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-white origin-bottom"
          style={{
            height: isPlaying ? '100%' : '30%',
            animation: isPlaying
              ? `equalizer ${0.5 + i * 0.08}s ease-in-out infinite`
              : 'none',
            animationDelay: `${i * 0.1}s`,
            opacity: isPlaying ? 0.8 : 0.2,
          }}
        />
      ))}
    </div>
  );

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* PILLAR 1: "Resuming Session" banner */}
      <AnimatePresence>
        {showResumeBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9998] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 px-5 py-3"
          >
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
              Resuming Session...
            </p>
            <p className="text-zinc-600 text-[10px] mt-1 font-mono">
              Picked up where you left off
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: activeTrack ? 0 : '100%', opacity: activeTrack ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
        className="fixed bottom-0 left-0 w-full bg-zinc-950/95 backdrop-blur-3xl border-t border-zinc-900 z-50 px-6 py-3 flex items-center justify-between"
      >
      {/* LEFT: Track Info + Equalizer */}
      <div className="flex items-center gap-4 w-1/4 min-w-0">
        {/* Visualizer icon circle */}
        <div className="w-10 h-10 shrink-0 bg-black border border-zinc-800 flex items-center justify-center relative overflow-hidden">
          {isPlaying ? (
            <Equalizer />
          ) : (
            <span className="text-zinc-400 font-sans text-lg leading-none">♪</span>
          )}
        </div>
        <div className="truncate min-w-0">
          <div className="text-white font-black text-sm truncate">
            {activeTrack ? formatTrackTitle(activeTrack.title) : ''}
          </div>
          <div className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5 flex items-center gap-2">
            <span>
              {activeTrack?.bpm || '---'} BPM • KEY: {activeTrack?.key ? activeTrack.key.toUpperCase() : 'UNASSIGNED'}
            </span>
            {audioError && (
              <span className="text-zinc-600 text-[9px] flex items-center gap-1">
                ⚠️ Stream Error
              </span>
            )}
          </div>
        </div>
        {/* Inline equalizer next to title */}
        {isPlaying && (
          <div className="shrink-0 pl-2 border-l border-zinc-900">
            <Equalizer />
          </div>
        )}
      </div>

      {/* CENTER: Custom Interactive Timeline */}
      <div className="flex-1 max-w-2xl px-4">
        {/* Hidden native audio element — drives playback, styled via custom UI */}
        <audio
          ref={audioRef}
          crossOrigin="anonymous"
          volume={1}
          src={activeTrack ? activeTrack.file_path : ''}
          controlsList="nodownload noplaybackrate"
          className="hidden"
          onPlay={() => { if (!isPlaying) togglePlay(); setAudioError(false); }}
          onPause={() => { if (isPlaying) togglePlay(); }}
          onEnded={playNextTrack}
          onError={() => setAudioError(true)}
          onCanPlay={() => setAudioReady(true)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {/* Interactive scrub track */}
        <div
          ref={progressBarRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          onPointerLeave={endScrub}
          className="group relative w-full h-11 flex items-center cursor-pointer select-none touch-none"
        >
          {/* Track */}
          <div className="relative w-full h-1 bg-zinc-800 rounded-full overflow-visible">
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-400 to-yellow-400"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Scrub thumb */}
            <div
              className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(34,211,238,0.9)]"
              style={{
                left: `${progressPercent}%`,
                transform: 'translate(-50%, -50%)',
                top: '50%',
                opacity: isScrubbingRef.current ? 1 : undefined,
              }}
            />
            {/* Hover glow overlay */}
            <div className="absolute inset-0 rounded-full bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors" />
          </div>

          {/* Time labels */}
          <div className="absolute bottom-0 left-0 right-0 text-[10px] font-mono text-zinc-500 flex justify-between pointer-events-none">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Close */}
      <div className="w-1/4 flex justify-end">
        <button
          onClick={() => window.location.reload()}
          className="text-zinc-700 hover:text-zinc-300 text-[10px] font-bold tracking-[0.2em] transition-colors uppercase"
        >
          CLOSE ✕
        </button>
      </div>
    </motion.div>
    </>
  );
}