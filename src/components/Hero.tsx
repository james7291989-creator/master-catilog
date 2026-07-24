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
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>

      {/* LUXURY NAVIGATION */}
      <nav className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
        <h1 className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
          RodneyA<span className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>♪</span>
        </h1>
        <ul className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
          {['Home', 'Work', 'Services', 'Experience', 'Contact'].map((item) => (
            <li key={item} className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>{item}</li>
          ))}
        </ul>
        <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
          <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>R</div>
        </div>
      </nav>

      {/* FOREGROUND CONTENT: LEFT-ALIGNED UI */}
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
        <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>

          {/* 3D TILT UI PANEL */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}
          >
            <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
              <span className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
                INDEPENDENT COMPOSER • FULL-STACK ENGINEER • APEX MASTER GRADE
              </span>
            </div>

            <h2 className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
              James Rodney Arms Jr.
            </h2>
            <h3 className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
              Operating under the moniker RodneyA.
            </h3>
            
            <p className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
              Independent composer & full-stack software engineer. 100% ownership of writing, publishing, and master rights. Tier-1 Music Supervisor with encrypted 7-stem delivery, zero legal friction, undeniable sound.
            </p>

            {/* STATS GRID */}
            <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
              {[
                { label: "BROADCAST MASTERS", value: "27", color: "cyan" },
                { label: "WAV 24-BIT STEMS", value: "7", color: "yellow" },
                { label: "LUFS MASTERED", value: "-14", color: "cyan" },
                { label: "TURNAROUND", value: "24HR", color: "yellow" }
              ].map((stat, i) => (
                <div key={i} className={`relative p-5 rounded-xl bg-black/60 backdrop-blur-sm border-2 overflow-hidden flex flex-col justify-between
                  ${stat.color === 'cyan' ? 'border-cyan-400/60 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.2)]'}`}>
                  <p className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>{stat.label}</p>
                  <p className={`text-4xl font-black z-10 ${stat.color === 'cyan' ? 'text-cyan-300' : 'text-yellow-400'}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Booking Badges */}
            <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
              <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
                LIMITED • 3 COMMISSION SLOTS AVAILABLE FOR Q1 2026 • NOW BOOKING
              </div>
              <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url(\`/hero-bg.jpg\`)"}}>
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
