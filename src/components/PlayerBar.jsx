// --- BEGIN APEX PLAYER ENGINE ---
import { useState, useRef, useEffect } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { resolveTrackAudioUrl } from '../utils/resolveAudioUrl';
import { supabase } from '../utils/supabaseClient';

export default function ApexPlayerBar() {
  const activeTrack = usePlayerStore(state => state.activeTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const togglePlay = usePlayerStore(state => state.togglePlay);
  const playNextTrack = usePlayerStore(state => state.playNextTrack);

  const audioRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');

  // ⚡ OMEGA STREAM RESOLUTION — pull the public URL from the vault-audio bucket
  useEffect(() => {
    if (activeTrack) {
      setHasError(false);
      setIsBuffering(true);
      try {
        // ⚡ APEX CTO OVERRIDE: resolve through the shared sanitization pipeline
        // so `.mp3` is appended when missing and spaces are URL-encoded.
        const resolvedUrl = resolveTrackAudioUrl(activeTrack);

        if (resolvedUrl && resolvedUrl !== '#') {
          setAudioUrl(resolvedUrl);
        } else {
          throw new Error("Vault retrieval failed.");
        }
      } catch (error) {
        console.error("🚨 VAULT BREACH:", error);
        setHasError(true);
        setIsBuffering(false);
      }
    } else {
      setAudioUrl('');
    }
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
            .catch(err => {
              console.error("Playback intercepted:", err);
              togglePlay();
            });
        }
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, audioUrl, togglePlay]);

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

  if (!activeTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4">
      {/* APEX GLASSMORPHIC CHASSIS */}
      <div className="mx-auto max-w-6xl bg-black/80 backdrop-blur-xl border border-green-500/30 rounded-2xl p-5 flex items-center justify-between shadow-[0_0_40px_rgba(34,197,94,0.2)] transition-all duration-500">

        {/* TRACK TELEMETRY */}
        <div className="flex flex-col border-l-4 border-green-500 pl-4 min-w-0">
          <span className="font-extrabold text-xl text-white tracking-widest uppercase drop-shadow-md truncate">
            {activeTrack.track_title || 'UNKNOWN DATA'}
          </span>
          <span className="text-sm text-green-400 font-mono uppercase tracking-wider truncate">
            {activeTrack.artist || 'ANONYMOUS'} // <span className="text-gray-500">APEX SECURE STREAM</span>
          </span>
          {hasError && <span className="text-xs text-red-500 mt-1 animate-pulse font-bold">ERROR: STREAM OFFLINE</span>}
        </div>

        {/* TACTICAL COMMAND CENTER */}
        <div className="flex items-center gap-6 flex-shrink-0">
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
          onEnded={playNextTrack}
          onPlaying={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          onError={() => { setHasError(true); setIsBuffering(false); }}
          preload="auto"
        />
      </div>
    </div>
  );
}
// --- END APEX PLAYER ENGINE ---
