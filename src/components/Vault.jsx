import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Disc, Download } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import usePlayerStore from '../store/usePlayerStore';
import LicenseModal from './LicenseModal';
import BioModal from './BioModal';
import TestimonyVault from './TestimonyVault';
import hapticClick from '../utils/vibrate';
import sanitizeFilename from '../utils/sanitizeFilename';

export default function Vault() {
  const activeTrack = usePlayerStore(state => state.activeTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setTrack = usePlayerStore(state => state.setTrack);
  const togglePlay = usePlayerStore(state => state.togglePlay);
  const setPlaylist = usePlayerStore(state => state.setPlaylist);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [licenseTrack, setLicenseTrack] = useState(null);
  const [bioOpen, setBioOpen] = useState(false);
  const [isTestimonyVaultBreached, setIsTestimonyVaultBreached] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

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

  // 2.5 ⚡ APEX CTO OVERRIDE: SINGLE SOURCE OF TRUTH FOR AUDIO RESOLUTION
  // Every stream + download resolves through this one function so the vault
  // can never drift into a dead path again.
  function resolveTrackAudioUrl(track) {
    if (!track) return '#';
    const fileName = track.file_name || track.master;
    if (!fileName) return '#';

    // MP3 masters are served straight from the public/ directory (Vercel root)
    if (fileName.toLowerCase().endsWith('.mp3')) {
      return `/${fileName}`;
    }

    // All other masters are pulled from the Supabase public 'audio' bucket
    const { data } = supabase.storage.from('vault-audio').getPublicUrl(fileName);
    return data?.publicUrl || `/${fileName}`;
  }

  // 3. BULLETPROOF AUDIO BINDING
  function handlePlayClick(track) {
    setAudioError(null);
    
    // ⚡ CONTEXT-AWARE PLAYLIST INJECTION: sync the global playlist to the
    // currently filtered tracks so auto-advance stays within the visible set.
    if (filteredTracks.length > 0) {
      setPlaylist(filteredTracks);
    }

    // ⚡ APEX CTO OVERRIDE: RESOLVE THE AUDIO URL THROUGH THE SHARED PIPELINE
    // MP3 -> public/ directory stream; WAV -> Supabase public bucket stream.
    const finalAudioUrl = resolveTrackAudioUrl(track);

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
  }

  // =========================================
  // PHASE 2: MEMOIZED MOOD MATRIX
  // =========================================

  // DYNAMIC EXTRACTION: pull unique moods/genres from the catalog array
  const uniqueMoods = useMemo(() => {
    const moodSet = new Set();
    tracks.forEach((track) => {
      const mood = track?.mood?.trim();
      if (mood && mood !== 'Multi-Genre') moodSet.add(mood);
    });
    return ['All', ...Array.from(moodSet).sort()];
  }, [tracks]);

  // MEMOIZATION: filtered track mapping array bound to activeFilter
  const filteredTracks = useMemo(() => {
    if (activeFilter === 'All') return tracks;
    return tracks.filter((track) => track?.mood?.trim() === activeFilter);
  }, [tracks, activeFilter]);

  // PHASE 2: HYDRATE THE PLAYLIST INTO THE STORE
  // ⚡ CONTEXT-AWARE: playlist mirrors the currently filtered tracks so
  // auto-advance respects the active mood filter (never jumps to hidden tracks).
  useEffect(() => {
    if (filteredTracks.length > 0) {
      setPlaylist(filteredTracks);
    }
  }, [filteredTracks, setPlaylist]);

  return (
    <div id="vault" className="max-w-7xl mx-auto px-6 py-12">
      {/* HEADER — stripped of all borders and colors */}
      <div className="mb-8 flex justify-between items-center pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">The Vault</h2>
          <p className="text-zinc-400 text-sm mt-1">Tier-1 Music Supervisor Sync Catalog — {tracks.length} Master Recordings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsTestimonyVaultBreached(true); hapticClick(); }}
            className="text-[10px] tracking-[0.2em] text-zinc-400 hover:text-white uppercase transition-colors"
          >
            The Artist's Story
          </button>
          {audioError && (
            <div className="text-zinc-400 px-4 py-1.5 text-xs animate-pulse font-bold tracking-wider">
              ⚠️ STREAM ERROR: CHECK BUCKET PERMISSIONS
            </div>
          )}
        </div>
      </div>

      {/* PHASE 2: MOOD MATRIX FILTER CHIPS — horizontally scrollable, hidden scrollbar */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide py-2 flex-nowrap items-center space-x-3 overflow-y-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full mb-6">
        {uniqueMoods.map((mood) => {
          const isActive = activeFilter === mood;
          return (
            <button
              key={mood}
              onClick={() => { setActiveFilter(mood); hapticClick(); }}
              aria-label={`Filter by ${mood}`}
              aria-pressed={isActive}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 border cursor-pointer backdrop-blur-md whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {mood}
            </button>
          );
        })}
      </div>

      {/* MATRIX COLUMN HEADERS */}
      <div className="hidden md:grid grid-cols-12 gap-4 border-b border-zinc-800 pb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-4">
        <div className="col-span-5">Track Title</div>
        <div className="col-span-3">Genre / Mood</div>
        <div className="col-span-1">BPM / Key</div>
        <div className="col-span-3 text-right">Action</div>
      </div>

      {/* TRACK GRID — ghost vault, classified archive feel */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse tracking-widest text-sm font-mono">INITIALIZING SECURE CONNECTION...</div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 font-mono text-sm">NO DATA FOUND IN SYNC_CATALOG.</div>
        ) : (
          filteredTracks.map((track, index) => {
            if (!track || !track.id) return null;
            const isCurrent = activeTrack?.id === track.id;
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
                className={`group grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-zinc-800/60 py-3 px-4 hover:bg-zinc-900/30 transition-colors ${
                  isCurrent
                    ? 'opacity-100 grayscale-0 bg-zinc-900/30'
                    : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0 hover:bg-zinc-900/30'
                }`}
              >
                {/* PLAY + TITLE & ASSET TYPE */}
                <div className="col-span-12 md:col-span-5 flex items-center gap-3">
                  <button
                    onClick={() => { handlePlayClick(track); hapticClick(); }}
                    className={`p-2 transition-all flex items-center justify-center flex-shrink-0 ${
                      isCurrent ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isCurrent && isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
                  </button>
                  <div className="min-w-0">
                    <div className={`font-semibold tracking-wide text-sm truncate ${isCurrent ? 'text-white' : 'text-zinc-300'}`}>
                      {formatTrackTitle(track.track_title)}
                    </div>
                    <div className="text-[10px] text-zinc-300 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                      <Disc size={10} className="text-zinc-400 flex-shrink-0" />
                      <span className="text-zinc-300 truncate">{track.asset_type || "Master"} • Instrumental</span>
                    </div>
                  </div>
                </div>

                {/* MOOD / GENRE — strict WCAG contrast */}
                <div className="hidden md:block md:col-span-3">
                   <span className="text-xs text-zinc-300 font-medium tracking-wide">{track.mood || 'Multi-Genre'}</span>
                </div>

                {/* BPM — strict WCAG contrast */}
                <div className="hidden md:block md:col-span-1">
                   <span className="text-xs text-zinc-300 font-mono">
                     {track.bpm ? `${track.bpm} BPM` : '--- BPM'} <span className="text-zinc-300 px-1">•</span> KEY: {track.key ? track.key.toUpperCase() : '--'}
                   </span>
                </div>

                {/* ACTION — BIFURCATED CONVERSION FUNNEL */}
                <div className="col-span-12 md:col-span-3">
                  <div className="flex items-center justify-end gap-3 w-full pr-2">
                    {/* [ACTION A: ASSET ACQUISITION] — Temp MP3 (Secondary) */}
                    <a
                        href={(() => {
                            const url = track.file_path || track.url || track.audioUrl || '#';
                            if (url.includes('supabase.co')) {
                                return `${url}?download=${encodeURIComponent(sanitizeFilename(track.title) + '_Temp.mp3')}`;
                            }
                            return url;
                        })()}
                        download={`${sanitizeFilename(track.title)}_Temp_Master.mp3`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer"
                    >
                        Temp MP3
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </a>
                    {/* [ACTION B: LICENSE PROTOCOL] — License Track (Primary) */}
                    <button
                      onClick={() => { setLicenseTrack(track); hapticClick(); }}
                      aria-label="License Track"
                      className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] text-xs whitespace-nowrap focus:ring-2 focus:ring-emerald-400 outline-none"
                    >
                      License Track
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <LicenseModal
        track={licenseTrack}
        onClose={() => setLicenseTrack(null)}
      />
      <BioModal
        isOpen={bioOpen}
        onClose={() => setBioOpen(false)}
      />
      <TestimonyVault
        isBreached={isTestimonyVaultBreached}
        onClose={() => setIsTestimonyVaultBreached(false)}
      />
    </div>
  );
}
