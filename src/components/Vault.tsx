import React, { useState } from 'react';
import { motion } from 'framer-motion';

const supabaseUrl = "https://llbwsbhhomvnjfjuswxh.supabase.co";

const tracks = [
  { id: "trk_01", title: "Baby You There", master: `${supabaseUrl}/storage/v1/object/public/audio/Baby You There.wav` },
  { id: "trk_02", title: "How It Was", master: `${supabaseUrl}/storage/v1/object/public/audio/How It Was.wav` },
  { id: "trk_03", title: "My Soul", master: `${supabaseUrl}/storage/v1/object/public/audio/My Soul.wav` },
  { id: "trk_04", title: "Our System", master: `${supabaseUrl}/storage/v1/object/public/audio/Our System.wav` },
  { id: "trk_05", title: "Porch Lights and Pistol Smoke", master: `${supabaseUrl}/storage/v1/object/public/audio/Porch Lights and Pistol Smoke.wav` },
  { id: "trk_06", title: "Real Life", master: `${supabaseUrl}/storage/v1/object/public/audio/Real Life.wav` },
  { id: "trk_07", title: "Real Story", master: `${supabaseUrl}/storage/v1/object/public/audio/Real Story.wav` },
  { id: "trk_08", title: "Rolling 55", master: `${supabaseUrl}/storage/v1/object/public/audio/Rolling 55.wav` },
  { id: "trk_09", title: "Running", master: `${supabaseUrl}/storage/v1/object/public/audio/Running.wav` },
  { id: "trk_10", title: "Shattered Kingdom", master: `${supabaseUrl}/storage/v1/object/public/audio/Shattered Kingdom.wav` },
  { id: "trk_11", title: "Sixteen With A Purpose", master: `${supabaseUrl}/storage/v1/object/public/audio/Sixteen With A Purpose.wav` },
  { id: "trk_12", title: "Survived", master: `${supabaseUrl}/storage/v1/object/public/audio/Survived.wav` }
];

export default function TheVault() {
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playTrack = (track) => {
    setActiveTrack(track);
    setIsPlaying(true);
  }
  
  const togglePlay = () => setIsPlaying(!isPlaying);
  
  return (
    <section className="relative z-30 py-24 px-6 max-w-7xl mx-auto bg-transparent">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-heading font-black mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">The Vault</h2>
        <p className="text-cyan-400 font-mono text-sm tracking-[0.3em] uppercase">Every song. Every stem. Ready to license.</p>
      </div>
      <div className="flex flex-col gap-2">
        {tracks.map(track => {
          const isActive = activeTrack?.id === track.id;
          return (
            <motion.div key={track.id} layout className="group relative flex flex-col rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)] bg-black/40 border-cyan-400/20 hover:border-cyan-400/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => isActive ? togglePlay() : playTrack(track)} className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/40">
                    {isActive && isPlaying ? '??' : '?'}
                  </button>
                  <span className="text-white font-medium">{track.title}</span>
                </div>
                <button className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-sm font-mono hover:bg-cyan-500/20">SECURE LICENSE</button>
              </div>
              {isActive && (
                <div className="px-4 pb-4">
                  <audio src={track.master} controls autoPlay={isPlaying} className="w-full" />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
