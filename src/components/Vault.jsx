import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Disc } from 'lucide-react';
import usePlayerStore from '../store/usePlayerStore';
import LicenseModal from './LicenseModal';
import TestimonyVault from './TestimonyVault';
import FounderModal from './FounderModal';
import hapticClick from '../utils/vibrate';
import sanitizeFilename from '../utils/sanitizeFilename';
import { resolveTrackAudioUrl } from '../utils/resolveAudioUrl';
import { sanitizeRecord } from '../utils/sanitizeText';
import { logError } from '../utils/structuredLog';
import { getCatalogAll, getUniqueMoods } from '../services/catalogService';

export default function Vault() {
  const activeTrack = usePlayerStore(state => state.activeTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setTrack = usePlayerStore(state => state.setTrack);
  const togglePlay = usePlayerStore(state => state.togglePlay);
  const setPlaylist = usePlayerStore(state => state.setPlaylist);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [licenseTrack, setLicenseTrack] = useState(null);
  const [isTestimonyVaultBreached, setIsTestimonyVaultBreached] = useState(false);
  const [founderModalOpen, setFounderModalOpen] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. FETCH EXCLUSIVELY FROM THE REAL CATALOG
  // ⚡ CLEAN ARCHITECTURE: Delivery layer depends on the Service interface,
  // never on Supabase directly. The Service handles caching + pagination.
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await getCatalogAll();
        // ⚡ FORTRESS PROTOCOL: sanitize every tenant-supplied string field
        // before it enters the data grid (XSS defense-in-depth).
        setTracks((data || []).map(sanitizeRecord));
      } catch (error) {
        logError('vault.catalog_fetch_failed', {
          message: error?.message ?? 'unknown error',
        });
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
      .replace(/\.(mp3|wav|flac|aiff|m4a)$/i, '')
      .trim();
  };

  // 2.5 ⚡ APEX CTO OVERRIDE: SINGLE SOURCE OF TRUTH FOR AUDIO RESOLUTION
  // Every stream + download resolves through the shared sanitization pipeline
  // (utils/resolveAudioUrl.js) so `.mp3` is appended when missing and spaces
  // are URL-encoded. The vault can never drift into a dead path again.

  // 2.6 ⚡ V15 QA STRIKE: FORCED BLOB DOWNLOAD INJECTION — bypasses CORS by
  // fetching the file as a Blob, creating an object URL, then triggering an
  // anchor click with a proper `.mp3` filename. Falls back to opening the URL
  // in a new tab if a CORS block occurs — never crashes the vault.
  const handleDownload = async (url, title) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title} - Apex Temp.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, '_blank'); // Fallback
    }
  };

  // 3. BULLETPROOF AUDIO BINDING
  async function handlePlayClick(track) {
    setAudioError(null);
    
    // ⚡ CONTEXT-AWARE PLAYLIST INJECTION: sync the global playlist to the
    // currently filtered tracks so auto-advance stays within the visible set.
    if (filteredTracks.length > 0) {
      setPlaylist(filteredTracks);
    }

    // ⚡ FORTRESS PROTOCOL: RESOLVE THE AUDIO URL THROUGH THE SHARED ASYNC
    // SIGNED-URL PIPELINE. The URL is short-lived (60s TTL) and never
    // exposed as a permanent public link.
    const finalAudioUrl = await resolveTrackAudioUrl(track);

    if (!finalAudioUrl) {
      setAudioError('SIGNED URL RESOLUTION FAILED');
      return;
    }

    // NEVER log the signed URL — the resolver already emitted structured
    // diagnostics that exclude the URL itself (FORTRESS PROTOCOL).
    
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
  // ⚡ CLEAN ARCHITECTURE: mood extraction delegated to the Service layer.
  const [uniqueMoods, setUniqueMoods] = useState(['All']);

  useEffect(() => {
    let cancelled = false;
    getUniqueMoods()
      .then((moods) => {
        if (!cancelled) setUniqueMoods(moods);
      })
      .catch(() => {
        if (!cancelled) setUniqueMoods(['All']);
      });
    return () => { cancelled = true; };
  }, []);

  // MEMOIZATION: filtered track mapping array bound to activeFilter + searchQuery
  // ⚡ GLOBAL REAL-TIME SEARCH — matches against track_title, genre_mood/mood,
  // and bpm. Case-insensitive so supervisors can find drop points instantly.
  const filteredTracks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const moodFiltered = activeFilter === 'All'
      ? tracks
      : tracks.filter((track) => track?.mood?.trim() === activeFilter);

    if (!query) return moodFiltered;

    return moodFiltered.filter((track) => {
      const title = String(track?.track_title || track?.title || '').toLowerCase();
      const mood = String(track?.mood || track?.genre_mood || '').toLowerCase();
      const bpm = String(track?.bpm ?? '').toLowerCase();
      return title.includes(query) || mood.includes(query) || bpm.includes(query);
    });
  }, [tracks, activeFilter, searchQuery]);

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
            <p className="text-sm text-zinc-400 mt-2 tracking-wide max-w-2xl">
              Tier-1 Music Supervisor Sync Catalog — 20 Master Recordings. 
              <br className="hidden md:block"/>
              100% Independent One-Stop Clearance. <span className="text-emerald-400 font-bold ml-1">BMI IPI: 551288873</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setFounderModalOpen(true); hapticClick(); }}
              className="text-[10px] tracking-[0.2em] text-zinc-300 hover:text-emerald-400 uppercase transition-colors"
            >
              Read the Founder's Story
            </button>
            <button
              onClick={() => { setIsTestimonyVaultBreached(true); hapticClick(); }}
              className="text-[10px] tracking-[0.2em] text-zinc-400 hover:text-white uppercase transition-colors"
            >
              The Artist's Story
            </button>
            {audioError && (
              <div className="text-red-400 px-4 py-1.5 text-xs animate-pulse font-bold tracking-wider">
                ⚠️ {audioError}: CHECK BUCKET CONFIG
              </div>
            )}
          </div>
        </div>

      {/* ⚡ GLOBAL REAL-TIME SEARCH BAR — filters the catalog grid as you type */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, genre/mood, or BPM..."
            aria-label="Search catalog"
            className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-green-500/60 focus:ring-2 focus:ring-green-500/20 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-300 outline-none transition-all backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
            // ⚡ DATA DESYNC FIX: never silently drop a track. Fall back to the
            // array index as a stable key when `id` is missing so all 21 master
            // recordings render in the grid.
            const trackKey = track?.id ?? `track-${index}`;
            const isCurrent = activeTrack?.id === track.id;
            return (
              <motion.div
                key={trackKey}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
                className={`group grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b py-3 px-4 transition-colors ${
                  isCurrent
                    ? 'opacity-100 grayscale-0 bg-green-500/10 border-green-500/40 shadow-[inset_0_0_20px_rgba(34,197,94,0.08)]'
                    : 'opacity-50 grayscale border-zinc-800/60 hover:opacity-100 hover:grayscale-0 hover:bg-zinc-900/30'
                }`}
              >
                {/* PLAY + TITLE & ASSET TYPE */}
                <div className="col-span-12 md:col-span-5 flex items-center gap-3">
                  <button
                    onClick={() => { handlePlayClick(track); hapticClick(); }}
                    aria-label={isCurrent && isPlaying ? `Pause ${formatTrackTitle(track.track_title)}` : `Play ${formatTrackTitle(track.track_title)}`}
                    className={`p-2 transition-all duration-200 flex items-center justify-center flex-shrink-0 rounded-full border ${
                      isCurrent
                        ? 'text-white bg-emerald-600/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800'
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

                {/* BPM — strict WCAG contrast
                    ⚡ INSTITUTIONAL POLISH: when BPM metadata is absent the label
                    is removed entirely (never a "PENDING" tag that reads like a
                    database error). Only the Key is displayed — intentional, clean. */}
                <div className="hidden md:flex md:col-span-1 flex-col gap-1">
                  {track.bpm && (
                    <span className="text-xs text-zinc-300 font-mono">{track.bpm} BPM</span>
                  )}
                  <span className="text-xs text-zinc-300 font-mono">
                    KEY: {track.key ? track.key.toUpperCase() : <span className="opacity-40 text-zinc-400">--</span>}
                  </span>
                </div>

                {/* ACTION — BIFURCATED CONVERSION FUNNEL */}
                <div className="col-span-12 md:col-span-3">
                  <div className="flex items-center justify-end gap-3 w-full pr-2">
                    {/* [ACTION A: ASSET ACQUISITION] — Temp MP3 (Secondary) */}
                    {/* ⚡ V15 QA STRIKE: FORCED BLOB DOWNLOAD — the Blob pipeline
                        bypasses CORS by fetching the file as a Blob, creating an
                        object URL, and triggering the download with a proper .mp3
                        extension. Falls back to opening in a new tab on failure. */}
                    <button
                        onClick={async () => {
                            const url = await resolveTrackAudioUrl(track);
                            if (url) {
                                await handleDownload(url, sanitizeFilename(track.title));
                            } else {
                                setAudioError('DOWNLOAD UNAVAILABLE: SIGNED URL FAILED');
                            }
                        }}
                        aria-label="Download Temp MP3"
                        className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer"
                    >
                        Temp MP3
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    {/* [ACTION B: LICENSE PROTOCOL] — License Track (Primary) */}
                    <button
                      type="button"
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
      <TestimonyVault
        isBreached={isTestimonyVaultBreached}
        onClose={() => setIsTestimonyVaultBreached(false)}
      />
      <FounderModal
        isOpen={founderModalOpen}
        onClose={() => setFounderModalOpen(false)}
      />
    </div>
  );
}
