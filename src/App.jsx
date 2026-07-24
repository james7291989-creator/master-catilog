import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Hero from './components/Hero';
import Vault from './components/Vault';
import { usePlayerStore } from './store/usePlayerStore';

export default function App() {
  const { activeTrack, isPlaying, togglePlay } = usePlayerStore();
  const audioRef = useRef(null);

  // Sync the HTML audio element with the Zustand Store
  useEffect(() => {
    if (activeTrack && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback blocked:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [activeTrack, isPlaying]);

  return (
    <div className="min-h-screen bg-transparent text-white font-body pb-28 overflow-x-hidden selection:bg-cyan-500/30">

      {/* ALL APPLICATION CONTENT SITS ABOVE BACKGROUND */}
      <div className="relative z-10">
      
        {/* 1. DYNAMIC COMPOSITED HERO SECTION */}
        <Hero />

        {/* 2. THE VAULT: DYNAMICALLY GENERATED FROM TRACKLIST.JSON */}
        <Vault />

      </div>{/* END relative z-10 content wrapper */}

      {/* 3. GOD-TIER GLOBAL PLAYER BAR */}
      <motion.div
        animate={{ y: activeTrack ? 0 : "100%", opacity: activeTrack ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="fixed bottom-0 left-0 w-full bg-[#0a1120]/95 backdrop-blur-3xl border-t border-cyan-900/50 z-50 px-6 py-4 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,255,255,0.1)]"
      >
        
        {/* Track Metadata */}
        <div className="flex items-center gap-6 w-1/4">
          <div className="w-12 h-12 shrink-0 bg-black border border-cyan-500/50 rounded-full flex items-center justify-center text-cyan-400 font-sans shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            ♪
          </div>
          <div className="truncate">
            <div className="text-white font-black text-sm truncate">{activeTrack?.title}</div>
            <div className="text-cyan-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
              {activeTrack?.bpm} BPM • {activeTrack?.key}
            </div>
          </div>
        </div>

        {/* Audio Controls (Styled Native Player) */}
        <div className="flex-1 max-w-2xl">
          <style>{`
            audio { 
              width: 100%; height: 40px; outline: none; 
              filter: invert(80%) sepia(100%) saturate(300%) hue-rotate(130deg) brightness(90%) contrast(150%);
            }
          `}</style>
          <audio
            ref={audioRef}
            controls={true}
            src={activeTrack ? activeTrack.master : ""}
            controlsList="nodownload noplaybackrate"
            onPlay={() => !isPlaying && togglePlay()}
            onPause={() => isPlaying && togglePlay()}
            onEnded={() => togglePlay()}
          />
        </div>

        {/* Close Button */}
        <div className="w-1/4 flex justify-end">
          <button 
            onClick={() => window.location.reload()} 
            className="text-cyan-700 hover:text-cyan-300 text-[10px] font-bold tracking-[0.2em] transition-colors uppercase"
          >
            CLOSE X
          </button>
        </div>
      </motion.div>

    </div>
  );
}
