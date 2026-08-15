import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ⚡ VITE DATABASE HYDRAULICS
// Vite strictly requires the VITE_ prefix. We initialize safely to prevent white-screens.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const LICENSING_EMAIL = 'rodneyandsonsfoundation@gmail.com';

const inputBaseClass =
  'w-full bg-black/60 border border-zinc-800 text-white text-sm px-4 py-3 placeholder-zinc-600 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40';

const labelClass =
  'block text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1.5';

export default function LicenseModal({ track, onClose }) {
  const trackTitle = track?.track_title
    ? track.track_title
        .replace(/^_+/, '')
        .replace(/\.(mp3|wav|flac|aiff|m4a)$/i, '')
        .trim()
    : 'Untitled Track';

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    mediaUse: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ⚡ DUAL-VECTOR ACTION ENGINE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.company || !formData.mediaUse) {
      alert("SYSTEM HALT: All fields are required.");
      return;
    }

    setIsSubmitting(true);

    const subject = `Sync Licensing Request: ${trackTitle}`;
    const body = [
      'SYNC LICENSING REQUEST',
      '=======================',
      '',
      `Track: ${trackTitle}`,
      `Name: ${formData.name}`,
      `Production Company: ${formData.company}`,
      `Intended Media Use: ${formData.mediaUse}`,
      '',
      '— Sent from The Vault',
    ].join('\n');

    const mailto = `mailto:${LICENSING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Fallback if Vercel is missing VITE_ variables
    if (!supabase) {
      console.warn("VITE_SUPABASE_URL missing. Executing Mail fallback.");
      window.location.href = mailto;
      setIsSubmitting(false);
      onClose();
      return;
    }

    // Vector Alpha: Database Injection
    const { error } = await supabase.from('sync_leads').insert([
      {
        track_title: trackTitle,
        full_name: formData.name,
        production_company: formData.company,
        intended_use: formData.mediaUse
      }
    ]);

    setIsSubmitting(false);

    if (error) {
      console.error("Database Write Exception:", error.message);
      alert(`FATAL DATABASE ERROR: ${error.message}`);
    } else {
      // Vector Beta: Success State & Email Routing
      setSubmitSuccess(true);
      window.location.href = mailto; 
      setTimeout(() => {
        onClose();
      }, 3500);
    }
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg"
          >
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-8 space-y-6">
                
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

                <div className="bg-black/60 border border-zinc-900 px-5 py-4">
                  <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1">
                    Selected Master
                  </p>
                  <p className="text-xl font-black tracking-tight text-white truncate">
                    {trackTitle}
                  </p>
                </div>

                {submitSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 text-center animate-pulse">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 className="text-emerald-400 font-bold mb-2">Request Secured</h4>
                    <p className="text-zinc-400 text-sm">Your licensing inquiry has been encrypted into the ledger. The mail client is opening.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                        className={inputBaseClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Production Company</label>
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
                      <label className={labelClass}>Intended Media Use</label>
                      <textarea
                        name="mediaUse"
                        value={formData.mediaUse}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Film, series, ad campaign, video game — describe the intended use"
                        className={`${inputBaseClass} resize-none`}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 text-sm tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="animate-pulse">TRANSMITTING...</span>
                        ) : (
                          <>
                            <Mail size={16} />
                            SEND LICENSING REQUEST
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                <div className="pt-2 border-t border-zinc-900">
                  <p className="text-[10px] font-mono tracking-wider text-zinc-700 text-center">
                    All masters are 100% One-Stop / Pre-Cleared.
                  </p>
                </div>
              </div>

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
