import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';

// ⚡ PHASE 5: LEAD CAPTURE ENGINE — mailto action target
// Placeholder inbox — swap for the real licensing address when live.
const LICENSING_EMAIL = 'licensing@yourdomain.com';

// Media type options for the dropdown
const MEDIA_TYPES = ['Film', 'Television', 'Video Game', 'Advertising', 'Other'];

// Estimated budget tiers for the dropdown
const BUDGET_RANGES = ['Micro-Sync <$1K', 'Indie $1K-$5K', 'Studio $5K+'];

const inputBaseClass =
  'w-full bg-black/60 border border-zinc-800 text-white text-sm px-4 py-3 placeholder-zinc-600 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40';

const labelClass =
  'block text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1.5';

export default function LicenseModal({ track, onClose }) {
  const trackTitle = track?.track_title
    ? track.track_title
        .replace(/^_+/, '')
        .replace(/\.wav$|\.mp3$/i, '')
        .trim()
    : 'Untitled Track';

  // ⚡ LEAD CAPTURE FORM STATE
  const [formData, setFormData] = useState({
    company: '',
    projectTitle: '',
    mediaType: '',
    budgetRange: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // =============================================================================
  // ⚡ ACTION ENGINE — compile the form into a URL-encoded mailto: string and
  // fire the user's default mail client. No backend required.
  // =============================================================================
  const handleSubmit = (e) => {
    e.preventDefault();

    const subject = `Sync Licensing Request: ${trackTitle}`;

    const body = [
      'SYNC LICENSING REQUEST',
      '=======================',
      '',
      `Track: ${trackTitle}`,
      `Company/Studio: ${formData.company}`,
      `Project Title: ${formData.projectTitle}`,
      `Media Type: ${formData.mediaType}`,
      `Estimated Budget Range: ${formData.budgetRange}`,
      '',
      '— Sent from The Vault',
    ].join('\n');

    const mailto = `mailto:${LICENSING_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // ⚡ Open the user's default mail client instantly
    window.location.href = mailto;
  };

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg"
          >
            {/* Main Card */}
            <div className="relative bg-zinc-950 border border-zinc-900 overflow-hidden">
              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 border border-zinc-800">
                      <Mail className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-white">
                        Sync Licensing Request
                      </h3>
                      <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
                        Lead Capture Engine
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1">
                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
                      INQUIRE
                    </span>
                  </div>
                </div>

                {/* Track Title Display */}
                <div className="bg-black/60 border border-zinc-900 px-5 py-4">
                  <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1">
                    Selected Master
                  </p>
                  <p className="text-xl font-black tracking-tight text-white truncate">
                    {trackTitle}
                  </p>
                </div>

                {/* Inline Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>Company / Studio Name</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      placeholder="Company or studio name"
                      className={inputBaseClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Project Title</label>
                    <input
                      type="text"
                      name="projectTitle"
                      value={formData.projectTitle}
                      onChange={handleChange}
                      required
                      placeholder="Film, series, or project title"
                      className={inputBaseClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Media Type</label>
                    <select
                      name="mediaType"
                      value={formData.mediaType}
                      onChange={handleChange}
                      required
                      className={`${inputBaseClass} appearance-none cursor-pointer`}
                    >
                      <option value="" disabled>
                        Select media type
                      </option>
                      {MEDIA_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-zinc-900 text-white">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Estimated Budget Range</label>
                    <select
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleChange}
                      required
                      className={`${inputBaseClass} appearance-none cursor-pointer`}
                    >
                      <option value="" disabled>
                        Select budget range
                      </option>
                      {BUDGET_RANGES.map((range) => (
                        <option key={range} value={range} className="bg-zinc-900 text-white">
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="group w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 text-sm tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
                    >
                      <Mail size={16} />
                      SEND LICENSING REQUEST
                    </button>
                  </div>
                </form>

                {/* Footer */}
                <div className="pt-2 border-t border-zinc-900">
                  <p className="text-[10px] font-mono tracking-wider text-zinc-700 text-center">
                    Opens your default mail client. All masters are 100% One-Stop / Pre-Cleared.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-xs"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
