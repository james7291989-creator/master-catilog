import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronDown, ChevronUp, ShieldCheck, Layers } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import tracklist from '../data/tracklist.json';

export default function Vault() {
  const { activeTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <section className="relative z-30 py-24 px-6 max-w-7xl mx-auto bg-transparent">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-heading font-black mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          The Vault
        </h2>
        <p className="text-cyan-400 font-mono text-sm tracking-[0.3em] uppercase">
          Every song. Every stem. Ready to license.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {tracklist.map((track: any) => {
          const isActive = activeTrack?.id === track.id;
          const isExpanded = expandedId === track.id;
          const hasStems = track.stems && track.stems.length > 0;
          const hasExtras = track.tvMix || track.broadcastClear || track.servicedInstrumental;

          return (
            <motion.div
              key={track.id}
              layout
              className={`group relative flex flex-col rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                ${isActive
                  ? 'bg-[#0f182c]/80 border-cyan-400/50 shadow-[0_0_30px_rgba(0,255,255,0.15)]'
                  : 'bg-[#0a1120]/40 border-cyan-900/30 hover:bg-[#0f182c]/60 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(0,255,255,0.1)]'
                }`}
            >
              {/* Active Track Glowing Edge Effect */}
              {isActive && (
                <motion.div
                  layoutId="vaultActiveGlow"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_rgba(0,255,255,1)]"
                />
              )}

              {/* Main Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-5">
                {/* Track Info + Play */}
                <div className="flex items-center gap-6 w-full md:w-1/3 relative z-10">
                  <button
                    onClick={() => (isActive ? togglePlay() : playTrack(track))}
                    className={`relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center border transition-all duration-300
                      ${isActive
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)]'
                        : 'bg-black/50 border-cyan-800 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                      }`}
                  >
                    {isActive && isPlaying && (
                      <span className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-30" />
                    )}
                    {isActive && isPlaying ? (
                      <Pause className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                    ) : (
                      <Play className="w-6 h-6 translate-x-0.5 text-gray-400 group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                    )}
                  </button>
                  <div>
                    <h3 className={`text-xl font-heading font-black tracking-tight transition-colors duration-300
                      ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-300 group-hover:text-white'}`}
                    >
                      {track.title}
                    </h3>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 mt-4 md:mt-0 w-full md:w-auto relative z-10">
                  {/* Expand Stems Button */}
                  {(hasStems || hasExtras) && (
                    <button
                      onClick={() => toggleExpand(track.id)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0a1120]/80 border border-cyan-800/50 hover:bg-cyan-950/50 hover:border-cyan-400 text-cyan-400 font-mono text-[10px] tracking-widest transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                    >
                      <Layers className="w-4 h-4" />
                      {isExpanded ? 'HIDE STEMS' : `${track.stems.length + (track.tvMix ? 1 : 0) + (track.broadcastClear ? 1 : 0) + (track.servicedInstrumental ? 1 : 0)} STEMS`}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  {/* Secure License */}
                  <a
                    href={`mailto:james72989@gmail.com?subject=Licensing Inquiry: ${encodeURIComponent(track.title)}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`group/btn relative flex items-center gap-2 px-7 py-2.5 rounded-lg font-heading font-black uppercase tracking-[0.15em] transition-all duration-500 overflow-hidden
                      ${isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-[#050811] shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                        : 'bg-transparent border border-cyan-500/50 text-cyan-400'
                      }
                      hover:bg-gradient-to-r hover:from-cyan-500 hover:to-cyan-400 hover:text-[#050811] hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]`}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <ShieldCheck className="w-4 h-4" />
                    SECURE LICENSE
                  </a>
                </div>
              </div>

              {/* Expandable Stems Section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-cyan-900/30 bg-black/20">
                      <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase mb-3">
                        Available Mixes & Stems
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {/* Master */}
                        <StemButton label="Master" file={track.master} />

                        {/* TV Mix */}
                        {track.tvMix && <StemButton label="TV Mix" file={track.tvMix} />}

                        {/* Broadcast Clear */}
                        {track.broadcastClear && <StemButton label="Broadcast Clear" file={track.broadcastClear} />}

                        {/* Serviced Instrumental */}
                        {track.servicedInstrumental && <StemButton label="Serviced Instrumental" file={track.servicedInstrumental} />}

                        {/* Individual Stems */}
                        {track.stems.map((stem: any, i: number) => (
                          <StemButton key={i} label={stem.label} file={stem.file} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function StemButton({ label, file }: { label: string; file: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleStem = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(file);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggleStem}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all duration-200
        ${playing
          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
          : 'bg-black/40 border-cyan-900/50 text-cyan-500 hover:bg-cyan-950/30 hover:border-cyan-500/50'
        }`}
    >
      {playing ? <Pause className="w-3 h-3 shrink-0" /> : <Play className="w-3 h-3 shrink-0" />}
      {label}
    </button>
  );
}