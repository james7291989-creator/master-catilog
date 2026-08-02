import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, Crown } from 'lucide-react';

// ⚡ APEX CTO OVERRIDE: ADMIN CONTACT — music supervisor inbox
const ADMIN_EMAIL = 'james72919879@gmail.com';

export default function LicenseModal({ isOpen, onClose, track }) {
  const trackTitle = track?.track_title
    ? track.track_title
        .replace(/^_+/, '')
        .replace(/\.wav$|\.mp3$/i, '')
        .trim()
    : 'Untitled Track';

  // ⚡ LIVE MAILTO PIPELINE — no dummy state toggle, no dead end.
  // Subject dynamically injects the active track title; body pre-fills
  // a professional clearance inquiry so the supervisor only hits Send.
  const mailtoHref = [
    `mailto:${ADMIN_EMAIL}`,
    `?subject=${encodeURIComponent(`Sync License Inquiry - ${trackTitle}`)}`,
    `&body=${encodeURIComponent(
      `Hi Rodney,\n\nI'm reaching out regarding a sync licensing inquiry for the master recording "${trackTitle}".\n\nI'd like to discuss exclusive sync rights, 24-bit stem delivery, and/or custom modifications for this track.\n\nPlease let me know the next steps.\n\nBest regards,\n[Your Name]\n[Company / Network]\n[Phone Number]`
    )}`,
  ].join('');

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
            className="relative w-full max-w-lg"
          >
            {/* Main Card */}
            <div className="relative bg-zinc-950 border border-zinc-900 overflow-hidden">
              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Crown + Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 border border-zinc-800">
                      <Crown className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-white">
                        VIP Concierge
                      </h3>
                      <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
                        Private Licensing Portal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1">
                    <ShieldCheck className="w-3 h-3 text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-400 tracking-wider">EXCLUSIVE</span>
                  </div>
                </div>

                {/* Track Title Display */}
                <div className="bg-black/60 border border-zinc-900 px-5 py-4">
                  <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1">Selected Master</p>
                  <p className="text-xl font-black tracking-tight text-white truncate">
                    {trackTitle}
                  </p>
                </div>

                {/* VIP Message */}
                <div className="border-l-2 border-zinc-800 pl-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    To discuss exclusive sync rights, 24-bit stem delivery, or custom modifications for this master, contact Rodney directly.
                  </p>
                </div>

                {/* Primary CTA — LIVE MAILTO: opens the supervisor's email client
                    with the track title + professional inquiry pre-filled */}
                <div className="pt-2">
                  <a
                    href={mailtoHref}
                    className="group w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-300 text-black font-black py-3.5 text-sm tracking-wider transition-all duration-200"
                  >
                    <Mail className="w-4 h-4" />
                    FILL OUT CLEARANCE APPLICATION
                  </a>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-zinc-900">
                  <p className="text-[10px] font-mono tracking-wider text-zinc-700 text-center">
                    Minimum sync licensing starts at $50,000. All masters are 100% One-Stop / Pre-Cleared.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-xs"
              >
                ✕
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}