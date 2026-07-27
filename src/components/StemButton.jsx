import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { getAudioUrl } from '../utils/supabaseAudio';

export default function StemButton({ label, file }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(getAudioUrl(file));
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all duration-200 ${
        playing
          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
          : 'bg-black/40 border-cyan-900/50 text-cyan-500 hover:bg-cyan-950/30 hover:border-cyan-500/50'
      }`}
    >
      {playing ? <Pause className="w-3 h-3 shrink-0" /> : <Play className="w-3 h-3 shrink-0" />}
      {label}
    </button>
  );
}