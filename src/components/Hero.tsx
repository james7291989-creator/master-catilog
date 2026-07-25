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
    <>
      <div 
        className="fixed inset-0 -z-10 w-full h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero-bg-fixed.jpg')",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20"></div>
      </div>

      <nav className="relative z-20 flex items-center justify-between p-6 lg:p-8">
        <h1 className="text-2xl font-black tracking-tighter text-white">
          RodneyA<span className="text-cyan-400">♪</span>
        </h1>
        <ul className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
          {['Home', 'Work', 'Services', 'Experience', 'Contact'].map((item) => (
            <li key={item} className="hover:text-cyan-400 cursor-pointer transition-colors">{item}</li>
          ))}
        </ul>
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center font-bold text-cyan-300">
          R
        </div>
      </nav>

      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-8 lg:px-16 max-w-7xl">
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="max-w-xl backdrop-blur-xl bg-black/30 border border-cyan-400/30 rounded-2xl p-8 shadow-[0_0_60px_rgba(6,182,212,0.2)] hover:shadow-[0_0_100px_rgba(6,182,212,0.4)] transition-all duration-700"
          >
            <div className="mb-6">
              <span className="text-xs font-mono tracking-widest text-cyan-400/80">
                INDEPENDENT COMPOSER • FULL-STACK ENGINEER • APEX MASTER GRADE
              </span>
            </div>

            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-white mb-2">
              James Rodney Arms Jr.
            </h2>
            <h3 className="text-lg text-gray-400 mb-6">
              Operating under the moniker RodneyA.
            </h3>
            
            <p className="text-gray-300 mb-8 leading-relaxed">
              Independent composer & full-stack software engineer. 100% ownership of writing, publishing, and master rights. Tier-1 Music Supervisor with encrypted 7-stem delivery, zero legal friction, undeniable sound.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: "BROADCAST MASTERS", value: "12", color: "cyan" },
                { label: "WAV 24-BIT STEMS", value: "7", color: "yellow" },
                { label: "LUFS MASTERED", value: "-14", color: "cyan" },
                { label: "TURNAROUND", value: "24HR", color: "yellow" }
              ].map((stat, i) => (
                <div key={i} className={`relative p-5 rounded-xl bg-black/60 backdrop-blur-sm border-2 overflow-hidden flex flex-col justify-between ${stat.color === 'cyan' ? 'border-cyan-400/60 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.2)]'}`}>
                  <p className="text-xs font-mono text-gray-400 tracking-wider">{stat.label}</p>
                  <p className={`text-4xl font-black z-10 ${stat.color === 'cyan' ? 'text-cyan-300' : 'text-yellow-400'}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="text-xs font-mono tracking-widest text-yellow-400/80 border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 rounded-lg text-center">
                LIMITED • 3 COMMISSION SLOTS AVAILABLE FOR Q1 2026 • NOW BOOKING
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {['APEX', 'GOD-OF-ALL-GODS', 'MASTER GRADE', 'TIER-1 SECURE'].map((badge) => (
                  <span key={badge} className="border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 rounded text-cyan-300">{badge}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
