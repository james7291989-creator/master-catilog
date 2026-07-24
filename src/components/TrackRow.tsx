'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Pause, Layers, ShieldCheck } from 'lucide-react';

export default function TrackRow({ track }: { track: any }) {
  const { activeTrack, isPlaying, playTrack, togglePlay, openStems } = usePlayerStore();
  const isActive = activeTrack?.id === track.id;

  return (
    <motion.div 
      whileHover={{ scale: 1.01, x: 8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => (isActive ? togglePlay() : playTrack(track))}
      className={`group relative flex flex-col md:flex-row md:items-center justify-between p-5 mb-4 rounded-2xl border backdrop-blur-xl transition-all duration-500 cursor-pointer overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)] 
        ${isActive 
          ? 'bg-[#0f182c]/80 border-cyan-400/50 shadow-[0_0_30px_rgba(0,255,255,0.15)]' 
          : 'bg-[#0a1120]/40 border-cyan-900/30 hover:bg-[#0f182c]/60 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(0,255,255,0.1)]'
        }`}
    >
      {/* Active Track Glowing Edge Effect */}
      {isActive && (
        <motion.div 
          layoutId="activeTrackGlow"
          className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_rgba(0,255,255,1)]"
        />
      )}

      {/* TRACK INFO & PLAY BUTTON */}
      <div className="flex items-center gap-6 w-full md:w-1/3 relative z-10">
        <div className={`relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center border transition-all duration-300 
          ${isActive 
            ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)]' 
            : 'bg-black/50 border-cyan-800 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]'
          }`}
        >
          {/* Pulsing ring when playing */}
          {isActive && isPlaying && (
            <span className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-30"></span>
          )}
          {isActive && isPlaying ? (
            <Pause className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
          ) : (
            <Play className={`w-6 h-6 translate-x-0.5 transition-colors duration-300 ${isActive ? 'text-cyan-300' : 'text-gray-400 group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]'}`} />
          )}
        </div>
        <div>
          <h3 className={`text-xl font-heading font-black tracking-tight transition-colors duration-300 
            ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-300 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`}
          >
            {track.title}
          </h3>
          <p className="text-cyan-500/70 font-body text-sm font-medium mt-1 truncate opacity-80 group-hover:opacity-100 transition-opacity">
            "{track.hook}"
          </p>
        </div>
      </div>

      {/* METADATA DASHBOARD (BPM, Key, Moods) */}
      <div className="hidden md:flex items-center gap-8 w-1/3 text-cyan-200/60 font-mono text-[10px] uppercase tracking-[0.2em] relative z-10">
        <span className="w-16 group-hover:text-cyan-300 transition-colors">{track.bpm} BPM</span>
        <span className="w-20 group-hover:text-cyan-300 transition-colors">{track.key}</span>
        <div className="flex gap-2">
          {track.moods.map((mood: string) => (
            <span key={mood} className={`px-2 py-1 rounded bg-[#03050a]/50 border transition-all duration-300 
              ${isActive ? 'border-cyan-500/50 text-cyan-300' : 'border-cyan-900/50 group-hover:border-cyan-500/30 group-hover:text-cyan-200'}`}
            >
              {mood}
            </span>
          ))}
        </div>
      </div>

      {/* ACTION GATEWAYS (Stems & Licensing) */}
      <div className="flex items-center justify-end gap-4 mt-6 md:mt-0 w-full md:w-auto relative z-10">
        
        {/* Diamond Tier Stem Access */}
        <button 
          onClick={(e) => { e.stopPropagation(); openStems(track); }} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0a1120]/80 border border-cyan-800/50 hover:bg-cyan-950/50 hover:border-cyan-400 text-cyan-400 font-mono text-[10px] tracking-widest transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
        >
          <Layers className="w-4 h-4" /> 
          7-STEM VAULT
        </button>

        {/* Secure License Gateway */}
        <a 
          href={`mailto:james7291989@gmail.com?subject=Licensing Inquiry: ${encodeURIComponent(track.title)}`}
          onClick={(e) => e.stopPropagation()}
          className={`group/btn relative flex items-center gap-2 px-7 py-2.5 rounded-lg font-heading font-black uppercase tracking-[0.15em] transition-all duration-500 overflow-hidden
            ${isActive 
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-[#050811] shadow-[0_0_20px_rgba(0,255,255,0.3)]' 
              : 'bg-transparent border border-cyan-500/50 text-cyan-400'
            }
            hover:bg-gradient-to-r hover:from-cyan-500 hover:to-cyan-400 hover:text-[#050811] hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]`}
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <ShieldCheck className="w-4 h-4" />
          SECURE LICENSE
        </a>

      </div>
    </motion.div>
  );
}