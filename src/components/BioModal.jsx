import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Code, ShieldCheck, Zap, Clock, Headphones } from 'lucide-react';

export default function BioModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative w-full max-w-2xl"
          >
            {/* Main Card */}
            <div className="relative bg-zinc-950 border border-zinc-900 overflow-hidden">
              <div className="p-8 md:p-10 space-y-8">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 shrink-0">
                    <Music className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                      THE COMPOSER & ENGINEER: RODNEYA
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1 font-mono tracking-wide">
                      (James Rodney Arms Jr.)
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-900" />

                {/* Main Bio Content */}
                <div className="space-y-6">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Operating at the intersection of high-fidelity music composition and full-stack software architecture, RodneyA produces broadcast-ready audio assets engineered specifically for high-impact media placements.
                  </p>

                  <div className="bg-black/60 border border-zinc-900 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-zinc-400" />
                      <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">
                        A Personal Relationship with Your Composer
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      We do not operate a generic licensing storefront. We build relationships with Tier-1 sync supervisors, trailer houses, and directors. When you license a track from The Vault, you work directly with the creator.
                    </p>
                  </div>

                  {/* Why Supervisors Partner With Us */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-400 tracking-wide uppercase mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Why Supervisors Partner With Us
                    </h3>
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 bg-zinc-900/60 border border-zinc-900 p-4">
                        <ShieldCheck className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-white">100% ONE-STOP GUARANTEE</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Complete ownership of Master & Publishing rights. Zero legal friction.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-zinc-900/60 border border-zinc-900 p-4">
                        <Music className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-white">24-BIT STEMS READY</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Complete 7-stem delivery package available for every track.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-zinc-900/60 border border-zinc-900 p-4">
                        <Clock className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-white">24-HOUR TURNAROUND</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Custom cues and stem edits executed directly by Rodney.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-3 h-3 text-zinc-700" />
                    <span className="text-[10px] font-mono text-zinc-700">Full-Stack • Composer • Engineer</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-700 tracking-widest">APEX MASTER GRADE</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
