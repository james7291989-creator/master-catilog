import React, { MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function Hero() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 18 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 18 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden bg-transparent">

      {/* LUXURY NAVIGATION */}
      <nav className="absolute top-0 w-full z-40 flex items-center justify-between px-12 py-8 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-6xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] tracking-tighter">
          RodneyA<span className="text-white text-4xl align-top">♪</span>
        </h1>
        <ul className="hidden md:flex gap-10 text-sm font-body font-bold tracking-widest text-white uppercase drop-shadow-md">
          {['Home', 'Work', 'Services', 'Experience', 'Contact'].map((item) => (
            <li key={item} className="cursor-pointer hover:text-cyan-300 transition-all duration-300">{item}</li>
          ))}
        </ul>
        <div className="relative group cursor-pointer rounded-full p-1 bg-gradient-to-b from-yellow-200 to-yellow-600 shadow-[0_0_40px_rgba(250,204,21,0.6)]">
          <div className="text-3xl font-serif text-yellow-600 bg-black/90 px-4 py-2 rounded-full border border-yellow-500/50">R</div>
        </div>
      </nav>

      {/* FOREGROUND CONTENT: LEFT-ALIGNED UI */}
      <div className="relative z-30 w-full max-w-[1600px] mx-auto px-6 lg:px-12 pt-32 pointer-events-none">
        <div className="max-w-2xl pointer-events-auto">

          {/* 3D TILT UI PANEL */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 shadow-[0_0_30px_rgba(0,255,255,0.1)]"
          >
            <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-400/60 bg-cyan-950/40 mb-6 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <span className="text-xs font-bold tracking-[0.2em] text-cyan-100 uppercase">
                INDEPENDENT COMPOSER • FULL-STACK ENGINEER • APEX MASTER GRADE
              </span>
            </div>

            <h2 className="text-4xl font-black text-yellow-50 mb-2 drop-shadow-lg uppercase tracking-wide">
              James Rodney Arms Jr.
            </h2>
            <h3 className="text-xl font-bold text-white mb-6">
              Operating under the moniker RodneyA.
            </h3>
            
            <p className="text-gray-200 font-body text-md leading-relaxed mb-8 max-w-xl">
              Independent composer & full-stack software engineer. 100% ownership of writing, publishing, and master rights. Tier-1 Music Supervisor with encrypted 7-stem delivery, zero legal friction, undeniable sound.
            </p>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "BROADCAST MASTERS", value: "27", color: "cyan" },
                { label: "WAV 24-BIT STEMS", value: "7", color: "yellow" },
                { label: "LUFS MASTERED", value: "-14", color: "cyan" },
                { label: "TURNAROUND", value: "24HR", color: "yellow" }
              ].map((stat, i) => (
                <div key={i} className={`relative p-5 rounded-xl bg-black/60 backdrop-blur-sm border-2 overflow-hidden flex flex-col justify-between
                  ${stat.color === 'cyan' ? 'border-cyan-400/60 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.2)]'}`}>
                  <p className="text-[10px] font-bold tracking-[0.15em] text-gray-300 mb-1 z-10">{stat.label}</p>
                  <p className={`text-4xl font-black z-10 ${stat.color === 'cyan' ? 'text-cyan-300' : 'text-yellow-400'}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Booking Badges */}
            <div className="mt-8 flex flex-col gap-3">
              <div className="inline-block px-4 py-2 rounded-full border border-yellow-500/50 bg-black/50 text-xs font-bold tracking-widest text-yellow-100 uppercase self-start">
                LIMITED • 3 COMMISSION SLOTS AVAILABLE FOR Q1 2026 • NOW BOOKING
              </div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase flex gap-4 mt-2">
                <span>APEX</span>
                <span>GOD-OF-ALL-GODS</span>
                <span>MASTER GRADE</span>
                <span>TIER-1 SECURE</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}