import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Crown, CheckCircle2 } from 'lucide-react';

// ⚡ APEX CTO OVERRIDE: ADMIN CONTACT — music supervisor inbox
const ADMIN_EMAIL = 'james72919879@gmail.com';

// Sync budget tiers for the dropdown
const BUDGET_RANGES = [
  'Under $5,000',
  '$5,000 – $15,000',
  '$15,000 – $50,000',
  '$50,000 – $100,000',
  '$100,000+',
];

const inputBaseClass =
  'w-full bg-black/60 border border-zinc-800 text-white text-sm px-4 py-3 placeholder-zinc-600 outline-none transition-all duration-200 focus:border-green-500 focus:ring-1 focus:ring-green-500/40';

export default function LicenseModal({ isOpen, onClose, track }) {
  const trackTitle = track?.track_title
    ? track.track_title
        .replace(/^_+/, '')
        .replace(/\.wav$|\.mp3$/i, '')
        .trim()
    : 'Untitled Track';

  // ⚡ INLINE LEAD CAPTURE — zero-friction form state
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    productionTitle: '',
    budgetRange: '',
    projectDetails: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // ⚡ Simulate async submission so the CTA can reflect a pending state
    setTimeout(() => {
      console.log(formData);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

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

                {isSubmitted ? (
                  /* =========================================================
                     SUCCESS UI — application received
                     ========================================================= */
                  <div className="py-8 flex flex-col items-center text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-black text-lg tracking-tight">
                        APPLICATION RECEIVED.
                      </p>
                      <p className="text-green-400 font-bold text-sm tracking-wide">
                        RODNEY A WILL CONTACT YOU SHORTLY.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="mt-2 w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-300 text-black font-black py-3.5 text-sm tracking-wider transition-all duration-200"
                    >
                      RETURN TO VAULT
                    </button>
                  </div>
                ) : (
                  /* =========================================================
                     INLINE LEAD CAPTURE FORM
                     ========================================================= */
                  <>
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
                        Submit your clearance application below. Rodney's team reviews every request personally.
                      </p>
                    </div>

                    {/* Inline Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          placeholder="Your full name"
                          className={inputBaseClass}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1.5">
                          Company / Studio
                        </label>
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
                        <label className="block text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1.5">
                          Production Title
                        </label>
                        <input
                          type="text"
                          name="productionTitle"
                          value={formData.productionTitle}
                          onChange={handleChange}
                          required
                          placeholder="Film, series, or project title"
                          className={inputBaseClass}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1.5">
                          Sync Budget Range
                        </label>
                        <select
                          name="budgetRange"
                          value={formData.budgetRange}
                          onChange={handleChange}
                          required
                          className={`${inputBaseClass} appearance-none cursor-pointer`}
                        >
                          <option value="" disabled>
                            Select a budget range
                          </option>
                          {BUDGET_RANGES.map((range) => (
                            <option key={range} value={range} className="bg-zinc-900 text-white">
                              {range}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1.5">
                          Project Details
                        </label>
                        <textarea
                          name="projectDetails"
                          value={formData.projectDetails}
                          onChange={handleChange}
                          required
                          rows={4}
                          placeholder="Tell us about your project, usage, and timeline..."
                          className={`${inputBaseClass} resize-none`}
                        />
                      </div>

                      {/* Submit CTA */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`group w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-300 text-black font-black py-3.5 text-sm tracking-wider transition-all duration-200 ${
                            isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          {isSubmitting ? '[ Submitting... ]' : 'SUBMIT APPLICATION'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

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