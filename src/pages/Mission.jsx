import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, GraduationCap, Building2, ShieldCheck } from 'lucide-react';

// =============================================================================
// ⚡ MISSION ROUTE — Rodney & Sons Foundation
// Cinematic dark-mode UI. Zero dead links. Zero 404s.
// =============================================================================
export default function Mission() {
  return (
    <div className="min-h-screen bg-black text-white font-body overflow-x-hidden">
      {/* BACKGROUND — grayscale cinematic overlay */}
      <div
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bg.jpg')",
          filter: 'grayscale(100%) contrast(120%) brightness(30%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Back to Vault */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold tracking-widest uppercase mb-12"
        >
          <ArrowLeft size={16} />
          Back to The Vault
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <p className="text-emerald-400 uppercase tracking-widest text-xs md:text-sm font-bold mb-4">
            The Mission
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-none">
            Rodney & Sons
            <br />
            Foundation
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-3xl">
            Every placement. Every license. Every stream. It all funnels into one
            singular objective: building trade schools for at-risk youth. This
            isn't a side project — it's the entire reason the vault exists.
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: <GraduationCap className="w-6 h-6" />,
              title: 'Trade Schools',
              text: 'Hands-on technical education in audio engineering, software development, and skilled trades — free for at-risk youth.',
            },
            {
              icon: <Building2 className="w-6 h-6" />,
              title: 'Infrastructure',
              text: 'Brick-and-mortar campuses built in underserved communities, funded directly by sync licensing revenue.',
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: 'Legacy',
              text: 'A generational wealth engine for Candace, our daughter, and every future Rodney & Sons student.',
            },
          ].map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx, ease: [0.16, 1, 0.3, 1] }}
              className="bg-zinc-950/80 border border-zinc-900 p-8"
            >
              <div className="p-2 bg-zinc-900 border border-zinc-800 w-fit mb-5">
                {pillar.icon}
              </div>
              <h3 className="text-xl font-black tracking-tight text-white mb-3">
                {pillar.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {pillar.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Statement Block */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="border-l-2 border-emerald-500/50 pl-8 mb-16"
        >
          <p className="text-2xl md:text-3xl font-bold text-white leading-snug mb-4">
            "I don't just write code or compose music — I build escape routes."
          </p>
          <p className="text-zinc-400 leading-relaxed max-w-3xl">
            Every piece of digital architecture I engineer and every cinematic
            track I produce is designed to fund a revolution for the next
            generation. The vault is 100% independent, one-stop licensing with
            zero legal friction. But the real bottom line? Every placement
            builds trade schools for at-risk youth. We aren't just making media
            here. We are changing realities.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-zinc-950/80 border border-zinc-900 p-8"
        >
          <div className="p-2 bg-zinc-900 border border-zinc-800">
            <HeartHandshake className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black tracking-tight text-white mb-1">
              Support the Foundation
            </h3>
            <p className="text-sm text-zinc-400">
              Every license purchased from The Vault directly funds the next
              trade school campus.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-8 text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/40"
          >
            Browse The Vault
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
