import React, { useState, useEffect } from 'react';
import { Play, Pause, Disc, ShieldCheck, Activity } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import LicenseModal from './LicenseModal';

export default function Vault() {
  const { activeTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [licenseTrack, setLicenseTrack] = useState(null);
  const [audioError, setAudioError] = useState(null);

  // 1. FETCH EXCLUSIVELY FROM THE REAL CATALOG
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data, error } = await supabase
          .from('sync_catalog')
          .select('*')
          .order('track_title', { ascending: true });

        if (error) throw error;
        setTracks(data || []);
      } catch (error) {
        console.error("Database Connection Error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // 2. AGGRESSIVE STRING CLEANER
  const formatTrackTitle = (rawTitle) => {
    if (!rawTitle) return "Untitled Track";
    return rawTitle
      .replace(/^_+/, '')
      .replace(/\.wav$|\.mp3$/i, '')
      .trim();
  };

  // 3. BULLETPROOF AUDIO BINDING
  const handlePlayClick = (track) => {
    setAudioError(null);
    
    // ⚡ APEX CTO OVERRIDE: FETCH PUBLIC STORAGE URL
    const { data } = supabase.storage.from('audio').getPublicUrl(track.file_name);
    const finalAudioUrl = data.publicUrl;

    console.log("🚀 APEX STREAMING FROM:", finalAudioUrl);
    
    // Force the player to recognize the FULL SECURE URL as the audio source
    const mappedTrack = {
      ...track,
      id: track.id,
      title: formatTrackTitle(track.track_title),
      master: track.file_name,
      file_path: finalAudioUrl, 
      audio_path: finalAudioUrl
    };

    if (activeTrack?.id === track.id) {
      togglePlay();
    } else {
      setTrack(mappedTrack);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">The Vault</h2>
          <p className="text-zinc-500 text-sm mt-1">Tier-1 Music Supervisor Sync Catalog — {tracks.length} Master Recordings</p>
        </div>
        {audioError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-1.5 rounded text-xs animate-pulse font-bold tracking-wider">
            ⚠️ STREAM ERROR: CHECK BUCKET PERMISSIONS
          </div>
        )}
      </div>

      {/* MATRIX COLUMN HEADERS */}
      <div className="grid grid-cols-12 gap-4 px-6 pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-4">
        <div className="col-span-1"></div>
        <div className="col-span-4">Track Title</div>
        <div className="col-span-2">Genre / Mood</div>
        <div className="col-span-2">BPM / Key</div>
        <div className="col-span-3 text-right">Action</div>
      </div>

      {/* TRACK GRID */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse tracking-widest text-sm font-mono">INITIALIZING SECURE CONNECTION...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12 text-red-500 font-mono text-sm">NO DATA FOUND IN SYNC_CATALOG.</div>
        ) : (
          tracks.map((track) => {
            const isCurrent = activeTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`grid grid-cols-12 items-center gap-4 px-6 py-3 rounded-lg border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                    : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 hover:border-zinc-700'
                }`}
              >
                {/* PLAY BUTTON */}
                <div className="col-span-1 flex items-center">
                  <button
                    onClick={() => handlePlayClick(track)}
                    className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
                      isCurrent ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {isCurrent && isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
                  </button>
                </div>

                {/* TITLE & ASSET TYPE */}
                <div className="col-span-4 flex items-center gap-3">
                  {isCurrent && isPlaying && (
                    <Activity size={16} className="text-cyan-400 animate-pulse" />
                  )}
                  <div>
                    <div className={`font-semibold tracking-wide text-sm ${isCurrent ? 'text-cyan-400' : 'text-white'}`}>
                      {formatTrackTitle(track.track_title)}
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                      <Disc size={10} className="text-zinc-600" />
                      <span>{track.asset_type || "Master"} • Instrumental</span>
                    </div>
                  </div>
                </div>

                {/* MOOD / GENRE */}
                <div className="col-span-2">
                   <span className="text-xs text-zinc-300 font-medium tracking-wide">{track.mood || 'Multi-Genre'}</span>
                </div>

                {/* BPM */}
                <div className="col-span-2">
                   <span className="text-xs text-zinc-400 font-mono">
                     {track.bpm ? `${track.bpm} BPM` : '--- BPM'} <span className="text-zinc-600 px-1">•</span> KEY: --
                   </span>
                </div>

                {/* SECURE LICENSE */}
                <div className="col-span-3 flex justify-end items-center">
                  <button
                    onClick={() => setLicenseTrack(track)}
                    className="bg-zinc-950 hover:bg-cyan-500 hover:text-black border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 font-bold px-4 py-1.5 rounded text-[10px] tracking-widest uppercase transition-all shadow-md flex items-center gap-2"
                  >
                    <ShieldCheck size={12} />
                    Secure License
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <LicenseModal
        isOpen={!!licenseTrack}
        onClose={() => setLicenseTrack(null)}
        track={licenseTrack}
      />
    </div>
  );
}