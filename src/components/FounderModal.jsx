import { X } from 'lucide-react';

export default function FounderModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl max-w-2xl w-full p-8 md:p-10 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">

        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-4 inline-block bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest border border-emerald-500/20">
          THE ARCHITECT'S STORY
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-6">
          JAMES RODNEY ARMS JR.
        </h2>

        <div className="space-y-6 text-zinc-300 text-sm md:text-base leading-relaxed">
          <p>
            <strong className="text-white">I don't just write code or compose music. I build escape routes.</strong>
          </p>
          <p>
            I survived the struggle and beat the odds. Now, my life's ultimate dream is to ensure the next generation doesn't have to navigate the same traps. I didn't wait for a label, and I didn't wait for a tech company. I taught myself the architecture, engineered this platform from raw code, and built my own one-stop licensing catalog from the ground up.
          </p>
          <p>
            Every lyric I write, every track I master, and every line of code I deploy serves one singular mission: <strong className="text-emerald-400">The Rodney and Sons Foundation.</strong>
          </p>
          <p>
            This isn't about personal wealth. This is a generational engine built for my daughter, Candace, and for thousands of at-risk youth. The revenue from every sync placement on this platform goes directly toward building physical, brick-and-mortar trade schools. We are going to teach these kids the proper skills and lifestyle so they aren't raised as statistics for the benefit of a broken justice system.
          </p>
          <p className="italic text-zinc-500 border-l-2 border-emerald-500 pl-4 mt-6">
            "We aren't just making media here. We are changing realities." — James Rodney Arms Jr.
          </p>
        </div>
      </div>
    </div>
  );
}