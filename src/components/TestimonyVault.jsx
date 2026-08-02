import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import hapticClick from '../utils/vibrate';

export default function TestimonyVault({ isBreached, onClose }) {
  // HARDWARE-LEVEL KILL SWITCH: Escape key unmount
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isBreached) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isBreached, handleEscape]);

  return (
    <AnimatePresence>
      {isBreached && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black"
          onClick={onClose}
        >
          {/* CLICK-JACKET: inner container stops propagation and fills viewport for scroll */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl mx-auto min-h-screen flex flex-col justify-center px-6 py-12"
          >
            {/* TITLE — viewport-dominant, pure white, zero shadow */}
            <div className="mb-12 text-center">
              <h2 className="text-7xl font-black tracking-tighter text-white uppercase leading-none">
                The Real
                <span className="block">Testimony</span>
              </h2>
            </div>

            {/* THE REAL TESTIMONY : CINEMATIC MANIFESTO PAYLOAD */}
            <div className="px-2 md:px-8">
              <div className="flex flex-col space-y-8 text-zinc-300 font-sans leading-loose tracking-wide px-4 md:px-12 py-8">

                {/* MANIFESTO BODY — RAW TESTIMONY, reads like a legal manifesto */}
                <div className="space-y-6 text-lg md:text-xl text-zinc-300 leading-loose">
                  <p>
                    Welcome, and thank you for your support. I’m James Rodney Arms Jr. I am 37 years old, and while I am developing several projects, this album is the first I am sharing publicly.
                  </p>

                  <p>
                    Every track on this album is built on raw emotion and real-life events. There is nothing fabricated here—this is my actual life. I enjoy sharing my story with you, and I am currently writing a book titled <strong>'My Real Testimony'</strong>, which will be available soon.
                  </p>

                  <p>
                    My childhood wasn't like most. I bounced from place to place until I was old enough to drive. After buying my first vehicle from my dad, I hit the road, traveling across Missouri and living purely off the grit of my soul. I never really had a stable home, and the pressure of my circumstances forced me to grow up fast. I didn't get the chance to have a normal childhood.
                  </p>

                  <p>
                    My early run-ins with law enforcement showed me just how deeply broken our justice system is. It is hard to watch a system that too often traps our own people—stripping away constitutional rights through 'warrant by information'—while others get to live the American Dream. We have a system that tears families apart, sometimes taking kids away just because a parent struggles, and in doing so, the state ends up raising the next generation of criminals.
                  </p>

                  <p>
                    This brings me to my ultimate mission. This album is just the beginning of the <strong>Rodney and Sons Foundation</strong>. I am building a legacy to change the way our system operates and to defend our constitutional rights. If I can change just one kid's life—by making sure they receive a real education instead of being locked in a box by the state—my life's goal will be accomplished. But I won't stop at just one.
                  </p>

                  <p>
                    Our justice system has the potential to be the best in the world, but we need to return to our constitutional rights so that we, the people, are truly free from a machine that tears us apart.
                  </p>

                  <p>
                    If you connect with this music, I am asking you to walk this journey with me. Help me give back to the kids who are growing up exactly like I did. Help me keep them out of a cycle that is designed to fail them.
                  </p>

                  <p className="text-white font-bold text-lg border-t border-zinc-800 pt-6 mt-8">
                    My name is James Rodney Arms Jr. Thank you for your support. Now, let’s go change the future for the kids who will one day become our future.
                  </p>
                </div>

                {/* CALL TO ACTION — sharp edges, no borders, no rounded corners */}
                <div className="pt-10 flex flex-col sm:flex-row gap-6 items-center">
                  {/* ⚡ APEX CTO OVERRIDE: ROUTES DIRECTLY TO THE MISSION PAGE */}
                  <a
                    href="/mission"
                    onClick={hapticClick}
                    className="bg-white text-black font-black py-4 px-10 tracking-widest uppercase text-sm transition-all duration-300 hover:bg-zinc-300"
                  >
                    Join the Mission
                  </a>
                  {/* ⚡ APEX CTO OVERRIDE: DROPS THE USER BACK INTO THE ACTIVE VAULT VIEW */}
                  <button
                    onClick={() => { onClose(); hapticClick(); }}
                    className="text-zinc-500 hover:text-white font-bold py-4 px-2 tracking-widest uppercase text-sm transition-all duration-300"
                  >
                    License a Track
                  </button>
                </div>

              </div>
            </div>

            {/* EGRESS: Kill Switch */}
            <button
              onClick={() => { onClose(); hapticClick(); }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-white transition-all duration-300"
              aria-label="Close testimony vault"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}