'use client';

import { useState, useRef, useEffect } from 'react';

interface Track {
  id: string;
  title: string;
  file_path: string;
  clearance_status: string;
}

interface CatalogPlayerProps {
  tracks: Track[];
  bucketUrl: string;
}

export default function CatalogPlayer({ tracks, bucketUrl }: CatalogPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && currentTrackIndex !== null) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.error("Audio playback suppressed by browser:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrackIndex, isPlaying]);

  const handlePlayPause = (index: number) => {
    if (currentTrackIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (currentTrackIndex !== null && currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  if (tracks.length === 0) {
    return <div className="text-slate-500 text-center py-10">Vault is empty. No tracks indexed.</div>;
  }

  return (
    <div className="flex flex-col w-full">
      {currentTrackIndex !== null && (
        <audio
          ref={audioRef}
          src={`${bucketUrl}/${encodeURIComponent(tracks[currentTrackIndex].file_path)}`}
          onEnded={handleNextTrack}
          preload="none"
        />
      )}

      <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-3 mb-3 px-4">
        <div className="col-span-1 text-center">Play</div>
        <div className="col-span-6">Master Title</div>
        <div className="col-span-5 text-right">Clearance</div>
      </div>

      <div className="flex flex-col gap-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {tracks.map((track, index) => {
          const isActive = currentTrackIndex === index;
          return (
            <div 
              key={track.id} 
              className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg transition-all duration-200 hover:bg-slate-800/50 ${isActive ? 'bg-slate-800 border-l-4 border-emerald-500' : 'border-l-4 border-transparent'}`}
            >
              <div className="col-span-1 flex justify-center">
                <button 
                  onClick={() => handlePlayPause(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive && isPlaying ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                >
                  {isActive && isPlaying ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
              </div>
              <div className="col-span-6 flex flex-col">
                <span className={`font-semibold text-sm ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {track.title}
                </span>
              </div>
              <div className="col-span-5 text-right flex items-center justify-end gap-3">
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded">
                  {track.clearance_status}
                </span>
                <a 
                  href={`${bucketUrl}/${encodeURIComponent(track.file_path)}`}
                  download
                  className="text-slate-500 hover:text-white transition-colors"
                  title="Download Reference Audio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
