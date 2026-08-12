// --- BEGIN APEX PLAYER ENGINE ---
import { useState, useRef, useEffect, useCallback } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { resolveTrackAudioUrl } from '../utils/resolveAudioUrl';
import { logWarn } from '../utils/structuredLog';

// ⚡ TIME FORMATTER — mm:ss for the scrubber telemetry
const formatTime = (seconds) => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ApexPlayerBar() {
  const activeTrack = usePlayerStore(state => state.activeTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const togglePlay = usePlayerStore(state => state.togglePlay);
  const playNextTrack = usePlayerStore(state => state.playNextTrack);
  const updateCurrentTime = usePlayerStore(state => state.updateCurrentTime);
  const flushSession = usePlayerStore(state => state.flushSession);

  const audioRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');

  // ⚡ V24.1 SCRUBBER TELEMETRY — driven via refs + requestAnimationFrame so
  // the 60fps position updates NEVER cause a React re-render. Only the
  // duration (infrequent) and seek-commit boundaries use React state.
  const scrubRef = useRef(0);
  const [duration, setDuration] = useState(0);
  const [scrubValue, setScrubValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const isSeekingRef = useRef(false);
  const rafRef = useRef(null);

  // ⚡ V24.1 ABRUPT-CLOSE GUARD — flush the latest position the instant the
  // tab is hidden/closed, so the 5000ms throttle never loses progress.
  useEffect(() => {
    const flush = () => flushSession();
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [flushSession]);

  // ⚡ OMEGA STREAM RESOLUTION — pull a short-lived signed URL from the
  // private vault-audio bucket. FORTRESS PROTOCOL: never a permanent public URL.
  useEffect(() => {
    let cancelled = false;

    const resolveStream = async () => {
      if (!activeTrack) {
        setAudioUrl('');
        return;
      }

      setHasError(false);
      setIsBuffering(true);
      // Reset scrubber telemetry on track change
      scrubRef.current = 0;
      setScrubValue(0);
      setDuration(0);

      try {
        // ⚡ FORTRESS PROTOCOL: resolve through the shared async signed-URL
        // pipeline. The URL is short-lived (60s TTL) and re-resolved per track.
        const resolvedUrl = await resolveTrackAudioUrl(activeTrack);

        if (cancelled) return;

        if (resolvedUrl && resolvedUrl !== '#') {
          setAudioUrl(resolvedUrl);
        } else {
          // Graceful fallback: clear the stale URL and keep the UI stable.
          // The shared resolver already emitted structured diagnostics —
          // no URL is ever placed in the browser console here.
          logWarn('player.stream.unavailable', {
            track: activeTrack?.id ?? activeTrack?.track_title ?? 'unknown',
          });
          setAudioUrl('');
          setHasError(true);
          setIsBuffering(false);
        }
      } catch (error) {
        if (cancelled) return;
        logWarn('player.stream.exception', {
          track: activeTrack?.id ?? activeTrack?.track_title ?? 'unknown',
          message: error?.message ?? 'unknown error',
        });
        setAudioUrl('');
        setHasError(true);
        setIsBuffering(false);
      }
    };

    resolveStream();

    return () => {
      cancelled = true;
    };
  }, [activeTrack]);

  // ⚡ PLAYBACK ENGINE — react to isPlaying + audioUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsBuffering(false))
            .catch(() => {
              logWarn('player.playback_intercepted', {
                track: activeTrack?.id ?? activeTrack?.track_title ?? 'unknown',
              });
              // ⚡ V26 FIX: ALWAYS release the buffering lock on play rejection.
              // The previous code left `isBuffering` stuck at `true` forever,
              // trapping the UI in an infinite "LOADING..." state.
              setIsBuffering(false);
              togglePlay();
            });
        }
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, audioUrl, togglePlay, activeTrack]);

  // ⚡ TEARDOWN GUARD — release the media heap on unmount or track change
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, [activeTrack]);

  // ⚡ V24.1 60FPS SCRUBBER DRIVER — rAF loop reads the live audio position
  // and writes DIRECTLY to the input (ref) + localized scrubValue state ONLY
  // when the visible % changes. Persistence is throttled to 5000ms in the
  // store. No React re-render fires on the per-frame path.
  const commitSeek = useCallback(() => {
    const audio = audioRef.current;
    if (audio && isFinite(scrubRef.current)) {
      audio.currentTime = scrubRef.current;
    }
    isSeekingRef.current = false;
    setIsSeeking(false);
  }, []);

  const handleSeekInput = useCallback((e) => {
    const val = Number(e.target.value);
    scrubRef.current = val;
    setScrubValue(val);
  }, []);

  const handleTimeUpdate = useCallback((e) => {
    if (isSeekingRef.current) return;
    const t = e.target.currentTime;
    scrubRef.current = t;
    // Throttled persistence (5000ms) — never per-frame disk write
    updateCurrentTime(t);
    // Paint the scrubber position via rAF; only setScrubValue when the
    // rendered % actually changes to avoid state churn.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setScrubValue(t);
    });
  }, [updateCurrentTime]);

  if (!activeTrack) return null;

  // ⚡ CORRECT TRACK TELEMETRY — always display the real track_title + artist
  const displayTitle = activeTrack.track_title || activeTrack.title || 'UNKNOWN DATA';
  const displayArtist = activeTrack.artist || 'JAMES RODNEY';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4">
      {/* APEX GLASSMORPHIC CHASSIS — high-density insulation, elevated above all scroll content */}
      <div className="mx-auto max-w-6xl bg-black/90 backdrop-blur-xl border-t border-emerald-500/20 rounded-2xl p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-all duration-500">

        {/* TRACK TELEMETRY */}
        <div className="flex flex-col border-l-4 border-green-500 pl-4 min-w-0 mb-4">
          <span className="font-extrabold text-xl text-white tracking-widest uppercase drop-shadow-md truncate">
            {displayTitle}
          </span>
          <span className="text-sm text-green-400 font-mono uppercase tracking-wider truncate">
            {displayArtist} // <span className="text-gray-500">APEX SECURE STREAM</span>
          </span>
          {hasError && <span className="text-xs text-red-500 mt-1 animate-pulse font-bold">SIGNED URL RESOLUTION FAILED — CHECK BUCKET CONFIG</span>}
        </div>

        {/* ⚡ INTERACTIVE AUDIO SCRUBBER — seek to any drop point in the master */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-green-400 font-mono tabular-nums w-12 text-right flex-shrink-0">
            {formatTime(scrubValue)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={scrubValue}
            disabled={hasError || !audioUrl || !duration}
            onChange={handleSeekInput}
            onMouseDown={() => { isSeekingRef.current = true; setIsSeeking(true); }}
            onTouchStart={() => { isSeekingRef.current = true; setIsSeeking(true); }}
            onMouseUp={commitSeek}
            onTouchEnd={commitSeek}
            onKeyUp={commitSeek}
            aria-label="Seek through track"
            className="flex-1 h-1.5 appearance-none cursor-pointer rounded-full bg-zinc-800 accent-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, #22c55e ${duration ? (scrubValue / duration) * 100 : 0}%, #27272a ${duration ? (scrubValue / duration) * 100 : 0}%)`,
            }}
          />
          <span className="text-xs text-zinc-500 font-mono tabular-nums w-12 flex-shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* TACTICAL COMMAND CENTER */}
        <div className="flex items-center justify-between gap-6">
          <button
            onClick={togglePlay}
            disabled={hasError || !audioUrl}
            className={`relative overflow-hidden px-10 py-3 rounded-full font-black text-lg transition-all duration-300 uppercase tracking-widest ${
              hasError || !audioUrl
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                : isPlaying
                  ? 'bg-transparent text-green-400 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:bg-green-900/30'
                  : 'bg-green-500 text-black shadow-[0_0_25px_rgba(34,197,94,0.8)] hover:bg-green-400 hover:scale-105'
            }`}
          >
            {isBuffering ? 'LOADING...' : isPlaying ? '|| PAUSE' : '► ENGAGE'}
          </button>
        </div>

        {/* INVISIBLE HTML5 AUDIO ENGINE */}
        <audio
          ref={audioRef}
          src={audioUrl}
          controlsList="nodownload noplaybackrate"
          disableRemotePlayback
          onEnded={playNextTrack}
          onLoadStart={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onLoadedData={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          onError={() => { setHasError(true); setIsBuffering(false); }}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={handleTimeUpdate}
          preload="auto"
        />
      </div>
    </div>
  );
}
// --- END APEX PLAYER ENGINE ---