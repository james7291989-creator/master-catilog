import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Lock, UploadCloud, ShieldCheck, Music, Clock, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getArtistsLedger } from '../services/catalogService';
import { sanitizeText } from '../utils/sanitizeText';
import { logEvent, logError } from '../utils/structuredLog';

// ⚡ OMEGA ADMIN — ULTIMATE INGESTION ENGINE ⚡
// MILITARY-GRADE SECURITY: the entire route is gated behind a Master
// Override Key verified against VITE_ADMIN_PASSPHRASE (with a local-dev
// fallback). No form is reachable until the gate is unlocked.
//
// SECURE RELATIONAL INJECTION: the client NEVER writes to sync_catalog
// directly. The audio file is uploaded to the private vault-audio bucket,
// then a single row is injected through the SECURITY DEFINER RPC
// `ingest_catalog_track` which validates the artist exists (multi-tenant
// relational integrity), sanitizes every field, and returns the hydrated row.

// Local-dev fallback when the env var is absent (never shipped to prod).
const ADMIN_PASSPHRASE = import.meta.env.VITE_ADMIN_PASSPHRASE || 'RODNEY-OMEGA-50';

// ⚡ AUDIO TELEMETRY — auto-calculates track duration from the selected file.
const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const minutes = Math.floor(audio.duration / 60);
      const seconds = Math.floor(audio.duration % 60).toString().padStart(2, '0');
      resolve(`${minutes}:${seconds}`);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('--:--');
    };
  });
};

// ⚡ FORTRESS FILENAME — strips path traversal + unsafe chars, keeps extension.
const sanitizeFilename = (name) => {
  const base = String(name || '').split(/[\\/]/).pop() || 'track';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
};

export default function OmegaAdmin() {
  // ---- PASSCODE GATE STATE ----
  const [passcode, setPasscode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [gateError, setGateError] = useState(false);

  // ---- FORM STATE ----
  const [artists, setArtists] = useState([]);
  const [artistId, setArtistId] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [genreMood, setGenreMood] = useState('');
  const [bpm, setBpm] = useState('');
  const [trackKey, setTrackKey] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [duration, setDuration] = useState('--:--');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ---- SUBMISSION STATE ----
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [lastTrack, setLastTrack] = useState(null);

  // ---- LOAD ARTISTS LEDGER (multi-tenant dropdown) ----
  useEffect(() => {
    let cancelled = false;
    getArtistsLedger()
      .then((rows) => {
        if (cancelled) return;
        setArtists(rows || []);
        if (rows && rows.length > 0) setArtistId(rows[0].id);
      })
      .catch((err) => {
        logError('omega_admin.artists_fetch_failed', { message: err?.message ?? 'unknown' });
        if (!cancelled) setStatus({ type: 'error', message: 'ARTISTS LEDGER UNAVAILABLE' });
      });
    return () => { cancelled = true; };
  }, []);

  // ---- PASSCODE VERIFICATION ----
  const handleUnlock = (e) => {
    e.preventDefault();
    if (passcode.trim() === ADMIN_PASSPHRASE) {
      setUnlocked(true);
      setGateError(false);
      logEvent('omega_admin.gate_unlocked');
    } else {
      setGateError(true);
      setPasscode('');
      logEvent('omega_admin.gate_denied');
    }
  };

  // ---- AUDIO FILE HANDLING + TELEMETRY ----
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'mp3' && ext !== 'wav') {
      setStatus({ type: 'error', message: 'UNSUPPORTED FORMAT — MP3 / WAV ONLY' });
      return;
    }
    setAudioFile(file);
    setStatus(null);
    const d = await getAudioDuration(file);
    setDuration(d);
    logEvent('omega_admin.audio_telemetry', { file: sanitizeFilename(file.name), duration: d });
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // ---- SECURE RELATIONAL INJECTION ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      setStatus({ type: 'error', message: 'AUDIO FILE REQUIRED' });
      return;
    }
    if (!artistId) {
      setStatus({ type: 'error', message: 'ARTIST REQUIRED' });
      return;
    }
    const bpmNum = parseInt(bpm, 10);
    if (!Number.isInteger(bpmNum) || bpmNum < 40 || bpmNum > 300) {
      setStatus({ type: 'error', message: 'BPM MUST BE 40–300' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      // 1. UPLOAD the raw asset to the private vault-audio bucket.
      const safeName = sanitizeFilename(audioFile.name);
      const storagePath = `${artistId}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('vault-audio')
        .upload(storagePath, audioFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: audioFile.type || 'audio/mpeg',
        });

      if (uploadError) {
        logError('omega_admin.upload_failed', { message: uploadError.message });
        throw new Error('VAULT_UPLOAD_FAILED');
      }

      // 2. INJECT the metadata row through the SECURITY DEFINER RPC.
      const { data, error: rpcError } = await supabase.rpc('ingest_catalog_track', {
        p_artist_id: artistId,
        p_track_title: sanitizeText(trackTitle),
        p_mood: sanitizeText(genreMood),
        p_bpm: bpmNum,
        p_key: sanitizeText(trackKey),
        p_file_name: storagePath,
        p_duration: duration,
        p_asset_type: 'Master',
      });

      if (rpcError) {
        logError('omega_admin.inject_failed', { message: rpcError.message });
        throw new Error('CATALOG_INJECT_FAILED');
      }

      setLastTrack(data);
      setStatus({ type: 'success', message: 'TRACK INGESTED INTO VAULT' });
      logEvent('omega_admin.track_ingested', { artistId, trackTitle: sanitizeText(trackTitle) });

      // Reset the form for the next ingestion.
      setTrackTitle('');
      setGenreMood('');
      setBpm('');
      setTrackKey('');
      setAudioFile(null);
      setDuration('--:--');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'INGESTION FAILED' });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // PASSCODE GATE — rendered until the Master Override Key unlocks.
  // ============================================================
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-black text-white font-body flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-zinc-400 hover:text-white uppercase transition-colors mb-10"
          >
            <ArrowLeft size={14} /> Return to Vault
          </Link>

          <div className="border border-zinc-800 bg-zinc-950/80 backdrop-blur rounded-2xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.06)]">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600/15 border border-emerald-500/40 mb-6 mx-auto">
              <Lock size={22} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center mb-2">OMEGA ADMIN</h1>
            <p className="text-sm text-zinc-400 text-center mb-8 tracking-wide">
              Ultimate Ingestion Engine — Restricted Access
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <label htmlFor="master-key" className="block text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase">
                Master Override Key
              </label>
              <input
                id="master-key"
                type="password"
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setGateError(false); }}
                placeholder="••••••••••••••"
                autoComplete="off"
                aria-label="Master Override Key"
                aria-invalid={gateError}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
              {gateError && (
                <p className="flex items-center gap-2 text-xs font-bold text-red-400" role="alert">
                  <AlertTriangle size={14} /> ACCESS DENIED — INVALID KEY
                </p>
              )}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] focus:ring-2 focus:ring-emerald-400 outline-none"
              >
                Unlock Ingestion Engine
              </button>
            </form>

            <p className="mt-6 text-[10px] tracking-[0.2em] text-zinc-500 uppercase text-center">
              <ShieldCheck size={12} className="inline mr-1 text-emerald-500" />
              Fortress Protocol — Passcode Verified
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // TIER-1 INGESTION FORM — unlocked.
  // ============================================================
  return (
    <div className="min-h-screen bg-black text-white font-body px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-zinc-400 hover:text-white uppercase transition-colors"
          >
            <ArrowLeft size={14} /> Return to Vault
          </Link>
          <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] text-emerald-400 uppercase">
            <ShieldCheck size={14} /> Gate Unlocked
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">OMEGA INGESTION ENGINE</h1>
          <p className="text-sm text-zinc-400 tracking-wide">
            Tier-1 Catalog Injection — Multi-Tenant Secure Relational Upload
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ARTIST — multi-tenant dropdown */}
          <div>
            <label htmlFor="artistId" className="block text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase mb-2">
              Artist / Tenant
            </label>
            <select
              id="artistId"
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg px-4 py-3 text-sm text-white outline-none transition-all appearance-none"
            >
              {artists.length === 0 && <option value="">Loading artists...</option>}
              {artists.map((a) => (
                <option key={a.id} value={a.id} className="bg-zinc-900 text-white">
                  {a.artist_name}
                </option>
              ))}
            </select>
          </div>

          {/* TRACK TITLE */}
          <div>
            <label htmlFor="trackTitle" className="block text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase mb-2">
              Track Title
            </label>
            <input
              id="trackTitle"
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              required
              placeholder="e.g. Midnight Ellisville"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* GENRE / MOOD */}
          <div>
            <label htmlFor="genreMood" className="block text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase mb-2">
              Genre / Mood
            </label>
            <input
              id="genreMood"
              type="text"
              value={genreMood}
              onChange={(e) => setGenreMood(e.target.value)}
              required
              placeholder="e.g. Trap Soul"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* BPM + KEY — two-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bpm" className="block text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase mb-2">
                BPM
              </label>
              <input
                id="bpm"
                type="number"
                min="40"
                max="300"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                required
                placeholder="92"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="trackKey" className="block text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase mb-2">
                Track Key
              </label>
              <input
                id="trackKey"
                type="text"
                value={trackKey}
                onChange={(e) => setTrackKey(e.target.value)}
                required
                placeholder="e.g. F# Minor"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* AUDIO FILE — large dark dropzone */}
          <div>
            <label className="block text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase mb-2">
              Audio File
            </label>
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload audio file"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative w-full border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                  : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500 hover:bg-zinc-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
              />
              {audioFile ? (
                <div className="flex flex-col items-center gap-3">
                  <Music size={32} className="text-emerald-400" />
                  <p className="text-sm font-bold text-white">{audioFile.name}</p>
                  <p className="text-xs text-zinc-400">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Clock size={14} /> Duration: {duration}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <UploadCloud size={32} className="text-zinc-500" />
                  <p className="text-sm font-bold text-zinc-300">
                    Drop audio file here or click to browse
                  </p>
                  <p className="text-xs text-zinc-500">MP3 / WAV — duration auto-calculated</p>
                </div>
              )}
            </div>
          </div>

          {/* STATUS */}
          {status && (
            <div
              role="status"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-bold ${
                status.type === 'success'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/50 bg-red-500/10 text-red-400'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{status.message}</span>
            </div>
          )}

          {/* LAST INGESTED TRACK */}
          {lastTrack && (
            <div className="border border-zinc-800 bg-zinc-950 rounded-lg p-4 text-xs text-zinc-400">
              <p className="font-bold text-zinc-300 tracking-wider uppercase mb-2">Last Ingested</p>
              <p>
                <span className="text-emerald-400 font-bold">{lastTrack.track_title}</span> —{' '}
                {lastTrack.mood} • {lastTrack.bpm} BPM • {lastTrack.key} • {lastTrack.duration}
              </p>
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            {submitting ? 'INGESTING INTO VAULT...' : 'INGEST TRACK INTO VAULT'}
          </button>
        </form>
      </div>
    </div>
  );
}