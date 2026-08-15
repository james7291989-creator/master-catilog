'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Client-Side Database Connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

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
  // Audio State
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', intendedUse: '' });

  // Audio Engine Logic
  useEffect(() => {
    if (audioRef.current && currentTrackIndex !== null) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.error("Playback suppressed:", e));
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

  // Lead Capture Logic
  const openModal = (track: Track) => {
    setSelectedTrack(track);
    setSubmitSuccess(false);
    setFormData({ name: '', company: '', intendedUse: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTrack(null);
  };

  const handleFormSubmit = async () => {
    // 1. Manual Validation (Since we removed the HTML Form)
    if (!formData.name || !formData.company || !formData.intendedUse) {
      alert("SYSTEM HALT: You must complete all fields before transmitting.");
      return;
    }

    setIsSubmitting(true);

    // 2. Transmit to Supabase
    const { error } = await supabase.from('sync_leads').insert([
      {
        track_title: selectedTrack?.title,
        full_name: formData.name,
        production_company: formData.company,
        intended_use: formData.intendedUse
      }
    ]);

    setIsSubmitting(false);

    // 3. Error Handling & Success State
    if (error) {
      console.error("Database Write Exception:", error.message);
      alert(`FATAL DATABASE ERROR: ${error.message}`);
    } else {
      setSubmitSuccess(true);
      setTimeout(() => {
        closeModal();
      }, 3500); // Auto-close modal
    }
  };

  if (tracks.length === 0) {
    return <div className="text-slate-500 text-center py-10">Vault is empty. No tracks indexed.</div>;
  }

  return (
    <div className="flex flex-col w-full relative">

      {/* HIDDEN AUDIO ENGINE */}
      {currentTrackIndex !== null && (
        <audio
          ref={audioRef}
          src={`${bucketUrl}/${encodeURIComponent(tracks[currentTrackIndex].file_path)}`}
          onEnded={handleNextTrack}
          preload="none"
        />
      )}

      {/* TRACK LEDGER UI */}
      <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-3 mb-3 px-4">
        <div className="col-span-1 text-center">Play</div>
        <div className="col-span-5">Master Title</div>
        <div className="col-span-6 text-right">Clearance & Actions</div>
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
              <div className="col-span-5 flex flex-col">
                <span className={`font-semibold text-sm ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {track.title}
                </span>
              </div>
              <div className="col-span-6 text-right flex items-center justify-end gap-3">
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded hidden md:inline-block">
                  {track.clearance_status}
                </span>
                
                <a 
                  href={`${bucketUrl}/${encodeURIComponent(track.file_path)}`}
                  download
                  className="text-slate-500 hover:text-white transition-colors p-1"
                  title="Download Reference Audio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </a>

                <button 
                  onClick={() => openModal(track)}
                  className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-all px-3 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase ml-1 cursor-pointer"
                >
                  INQUIRE
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAD CAPTURE ENGINE MODAL */}
      {isModalOpen && selectedTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Sync Licensing Request
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">Lead Capture Engine</p>
                </div>
                <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {submitSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 text-center animate-pulse">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 className="text-emerald-400 font-bold mb-2">Request Secured</h4>
                  <p className="text-slate-400 text-sm">Your licensing inquiry for {selectedTrack.title} has been encrypted into our database. The administration team will contact you shortly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#111111] border border-slate-800 rounded p-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Selected Master</label>
                    <div className="text-white font-semibold">{selectedTrack.title}</div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111111] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm" placeholder="Your full name" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Production Company</label>
                    <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full bg-[#111111] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm" placeholder="Company or studio name" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Intended Media Use</label>
                    <textarea value={formData.intendedUse} onChange={(e) => setFormData({...formData, intendedUse: e.target.value})} className="w-full bg-[#111111] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm h-24 resize-none" placeholder="Film, series, ad campaign, video game — describe the intended use" />
                  </div>

                  <button 
                    type="button" 
                    onClick={handleFormSubmit} 
                    disabled={isSubmitting} 
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">TRANSMITTING SECURE PAYLOAD...</span>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        SEND LICENSING REQUEST
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
