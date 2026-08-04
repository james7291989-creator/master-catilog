# 🔐 APEX-SINGULARITY PLATFORM AUDIT — JAMES RODNEY ULTIMATE CATALOG

**Audit Target:** `src/`
**Stack:** React 19, Vite 8, Tailwind 3, Zustand 5, Supabase JS 2, Framer Motion 12
**Auditor:** Apex Hybrid — Vercel Principal Architect / Lead Pen-Tester / Core Web Audio Engineer
**Severity Legend:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW

---

## 1. BROWSER MEMORY & AUDIO HEAP CORRUPTION (CRITICAL)

### 1.1 Audio Buffer Bloat — 🟠 HIGH

**File & Line:** `src/components/PlayerBar.jsx:252-266`

**Threat Vector:** The `<audio>` element is rendered inside `PlayerBar`, which is mounted **only** on the `/` route (`src/App.jsx:28`). When the user navigates to `/mission`, `PlayerBar` unmounts and React destroys the DOM node — **but the media buffer is never explicitly released**. The browser's media cache retains the decoded audio buffer until the garbage collector reclaims it, which is non-deterministic. Rapid-fire play across 15 tracks causes the browser to hold multiple decoded WAV buffers (WAV is uncompressed — a 3-minute 24-bit/48kHz stereo WAV is ~50MB **per track**). With no `pause()` + `removeAttribute('src')` + `load()` teardown, RAM spikes linearly with track switches.

Additionally, `src/App.jsx:28` renders `<PlayerBar />` as a sibling that never unmounts during the session — the audio element persists for the entire SPA lifetime, holding the last track's buffer indefinitely.

**Omega Patch:** Add a teardown effect that releases the media buffer on unmount and on track change:

```jsx
// src/components/PlayerBar.jsx — replace the playback effect (lines 63-81) and add teardown
useEffect(() => {
  if (activeTrack && isPlaying && audioRef.current) {
    setAudioReady(false);
    setAudioError(false);
    audioRef.current.load();
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Playback interrupted:", error);
        setAudioError(true);
      });
    }
  }
}, [activeTrack]);

// ⚡ OMEGA: Explicit media-buffer teardown on unmount + track switch
useEffect(() => {
  const audio = audioRef.current;
  return () => {
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // Forces the browser to drop the decoded media buffer
    }
  };
}, [activeTrack]); // Re-runs on every track change, releasing the previous buffer
```

### 1.2 MediaSession API Integration — 🔴 CRITICAL (Missing Enterprise Feature)

**File & Line:** `src/components/PlayerBar.jsx` — **entire file, no MediaSession usage**

**Threat Vector:** Zero usage of `navigator.mediaSession`. On a Tier-1 B2B sync vault, enterprise buyers frequently audition tracks from their phone's lock screen or via Bluetooth car controls. Without MediaSession, the OS shows no track title/artist, and hardware play/pause/next buttons are dead. This is a **missing enterprise feature** that degrades the premium buyer experience and blocks lock-screen/Bluetooth control of the audition player.

**Omega Patch:** Register MediaSession metadata and action handlers inside a `useEffect` keyed on `activeTrack`:

```jsx
// src/components/PlayerBar.jsx — add after the playback effect
useEffect(() => {
  if (!('mediaSession' in navigator)) return;
  if (!activeTrack) {
    navigator.mediaSession.metadata = null;
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: formatTrackTitle(activeTrack.title),
    artist: 'James Rodney Arms Jr.',
    album: 'The Vault — Sync Catalog',
  });
  navigator.mediaSession.setActionHandler('play', () => {
    if (!isPlaying) togglePlay();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    if (isPlaying) togglePlay();
  });
  navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
  return () => {
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
  };
}, [activeTrack, isPlaying, togglePlay, playNextTrack]);
```

### 1.3 Unrevoked Object URLs — ✅ SYSTEM NOMINAL

**File & Line:** `src/components/Vault.jsx:243-261`, `src/store/usePlayerStore.js:39-55`

**Threat Vector:** The codebase **never calls `URL.createObjectURL()`** anywhere. Streaming uses direct Supabase public URLs (`getPublicUrl`) or Vite public `/` paths. Downloads use a native `<a href>` to the Supabase URL with a `?download=` query param. **There are zero Object URLs to revoke** — this section is mathematically flawless. No `URL.revokeObjectURL()` is required because no Blob URLs are ever created.

---

## 2. VIRTUAL DOM SINGULARITY & RENDER BOTTLENECKS

### 2.1 Reference Equality Breaches — 🟠 HIGH

**File & Line:** `src/components/PlayerBar.jsx:167-184` (inline `Equalizer`), `src/components/PlayerBar.jsx:42` & `src/components/Vault.jsx:12` (whole-store subscription)

**Threat Vector (A) — Inline Component Definition:** `const Equalizer = () => (...)` is defined **inside** the `PlayerBar` function body. Every render creates a brand-new function reference. React treats a new component type reference as a **different component**, forcing a full unmount/remount of the `Equalizer` subtree on **every** render. Since `onTimeUpdate` fires ~4×/sec (line 264) and calls `setCurrentTime` (line 108), the `Equalizer` is destroyed and recreated 4×/sec — destroying and recreating its DOM nodes and CSS animations each time. This is a cascading render bottleneck.

**Threat Vector (B) — Whole-Store Subscription:** `const { activeTrack, isPlaying, ... } = usePlayerStore()` (PlayerBar.jsx:42) and `const { activeTrack, isPlaying, setTrack, ... } = usePlayerStore()` (Vault.jsx:12) subscribe to the **entire Zustand store**. Zustand's default equality is reference-based on the whole state object. When `updateCurrentTime` fires (PlayerBar.jsx:95-101), it calls `set({ currentTime: time })` — this creates a new state object, re-rendering **every** component subscribed to the store, including `Vault`'s entire track grid, even though `Vault` never reads `currentTime`. This is a cascading re-render across the whole track grid on every time tick.

**Omega Patch (A):** Hoist `Equalizer` to module scope:

```jsx
// src/components/PlayerBar.jsx — hoist to module scope (outside the component)
const Equalizer = ({ isPlaying }) => (
  <div className="flex items-end gap-[3px] h-full shrink-0 py-1">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="w-[3px] rounded-full bg-white origin-bottom"
        style={{
          height: isPlaying ? '100%' : '30%',
          animation: isPlaying
            ? `equalizer ${0.5 + i * 0.08}s ease-in-out infinite`
            : 'none',
          animationDelay: `${i * 0.1}s`,
          opacity: isPlaying ? 0.8 : 0.2,
        }}
      />
    ))}
  </div>
);
```

**Omega Patch (B):** Use granular Zustand selectors to isolate re-renders:

```jsx
// src/components/PlayerBar.jsx — replace line 42
const activeTrack = usePlayerStore((s) => s.activeTrack);
const isPlaying = usePlayerStore((s) => s.isPlaying);
const togglePlay = usePlayerStore((s) => s.togglePlay);
const updateCurrentTime = usePlayerStore((s) => s.updateCurrentTime);
const sessionRestored = usePlayerStore((s) => s.sessionRestored);
const resumedFromTrack = usePlayerStore((s) => s.resumedFromTrack);
const playNextTrack = usePlayerStore((s) => s.playNextTrack);

// src/components/Vault.jsx — replace line 12
const activeTrack = usePlayerStore((s) => s.activeTrack);
const isPlaying = usePlayerStore((s) => s.isPlaying);
const setTrack = usePlayerStore((s) => s.setTrack);
const togglePlay = usePlayerStore((s) => s.togglePlay);
const setPlaylist = usePlayerStore((s) => s.setPlaylist);
```

### 2.2 Paint Thrashing (Layout Shifts) — 🟠 HIGH

**File & Line:** `src/components/PlayerBar.jsx:281-284` (progress fill `width`), `src/components/PlayerBar.jsx:286-294` (scrub thumb `left`)

**Threat Vector:** The progress bar fill uses `style={{ width: `${progressPercent}%` }}` and the scrub thumb uses `style={{ left: `${progressPercent}%` }}`. Both `width` and `left` are **layout-triggering properties**. `onTimeUpdate` fires ~4×/sec, and each update forces the browser to recalculate layout (reflow) for the progress bar and its ancestors, then repaint. This is continuous layout thrashing during playback. The `Equalizer` correctly uses `transform: scaleY` (compositor-only), but the progress bar does not.

**Omega Patch:** Switch to compositor-only `transform: scaleX()` for the fill and `transform: translateX()` for the thumb:

```jsx
{/* Progress fill — compositor-only scaleX */}
<div
  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-400 to-yellow-400 origin-left"
  style={{ transform: `scaleX(${progressPercent / 100})` }}
/>
{/* Scrub thumb — compositor-only translateX */}
<div
  className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(34,211,238,0.9)]"
  style={{
    transform: `translateX(${progressPercent}%) translate(-50%, -50%)`,
    top: '50%',
    opacity: isScrubbingRef.current ? 1 : undefined,
  }}
/>
```

### 2.3 Missing Error Boundaries — 🔴 CRITICAL

**File & Line:** `src/main.jsx:6-9`, `src/App.jsx:7-35`

**Threat Vector:** There is **no `ErrorBoundary`** anywhere in the tree. If Supabase drops the connection and `Vault`'s fetch throws an uncaught error during render, or any child component throws (e.g., a malformed track object from the DB), React 19 unmounts the **entire root** and the user sees a **white screen**. The `fetchCatalog` catch (Vault.jsx:32-34) only handles the async fetch error, not render-phase errors. A single bad row in `sync_catalog` (e.g., `track.mood` being an object instead of a string, causing `.trim()` to throw at Vault.jsx:109) crashes the whole app.

**Omega Patch:** Add a class-based ErrorBoundary and wrap the app:

```jsx
// src/components/ErrorBoundary.jsx — NEW FILE
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('APEX ERROR BOUNDARY CAUGHT:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-black tracking-tight mb-4">VAULT OFFLINE</h1>
            <p className="text-zinc-400 text-sm mb-6">
              The secure connection was interrupted. Please refresh to re-establish the session.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg transition-all"
            >
              RECONNECT
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

```jsx
// src/main.jsx — wrap the app
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

---

## 3. CRYPTOGRAPHIC & INJECTION SECURITY (PEN-TEST)

### 3.1 XSS (Cross-Site Scripting) Vectors — 🟡 MEDIUM (Mitigated by React, but harden)

**File & Line:** `src/components/Vault.jsx:218` (`formatTrackTitle(track.track_title)`), `src/components/PlayerBar.jsx:228` (`formatTrackTitle(activeTrack.title)`), `src/components/LicenseModal.jsx:129` (`{trackTitle}`), `src/components/Vault.jsx:251` (`download` attribute), `src/components/Vault.jsx:247` (`encodeURIComponent(track.title + '_Temp.mp3')`)

**Threat Vector:** A malicious `track_title` like `<script>alert('hack')</script>` injected into Supabase is interpolated into JSX text nodes. **React's default JSX escaping neutralizes HTML/script injection in text nodes** — the string renders as literal text, not executable HTML. **However**, the `download` attribute (Vault.jsx:251) and the `?download=` URL param (Vault.jsx:247) are **not** HTML-escaped by React's text-node escaping — they're attribute values. A title containing `"` or path-traversal sequences (`../../`) could manipulate the download filename. Browsers sanitize `download` filenames against path traversal, but a title with control characters or a crafted `?download=` value could confuse the Supabase CDN's content-disposition header. **No `dangerouslySetInnerHTML` is used anywhere** — that's the only true XSS sink, and it's absent. The residual risk is filename/URL injection in the download path.

**Omega Patch:** Sanitize the download filename and URL param with a strict whitelist:

```jsx
// src/components/Vault.jsx — add a sanitizer at module scope
const sanitizeFilename = (raw) => {
  if (!raw) return 'Untitled_Track';
  return raw
    .replace(/[^a-zA-Z0-9 _-]/g, '') // strip all non-safe chars (kills <script>, quotes, slashes)
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80) || 'Untitled_Track';
};

// Replace the download anchor (lines 243-261):
<a
  href={(() => {
    const url = track.file_path || track.url || track.audioUrl || '#';
    if (url.includes('supabase.co')) {
      return `${url}?download=${encodeURIComponent(sanitizeFilename(track.title) + '_Temp.mp3')}`;
    }
    return url;
  })()}
  download={`${sanitizeFilename(track.title)}_Temp_Master.mp3`}
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()}
  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer"
>
  Temp MP3
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
</a>
```

### 3.2 Client-Side Data Leaks — 🔴 CRITICAL (SERVICE ROLE KEY EXPOSED)

**File & Line:** `src/utils/supabaseClient.js:4-5`

**Threat Vector:** The Supabase key is **hardcoded in the client bundle**. Decoding the JWT payload reveals:

```
{"iss":"supabase","ref":"llbwsbhhomvnjfjuswxh","role":"service_role","iat":1784866377,"exp":2100442377}
```

The `"role":"service_role"` claim means this is the **service role key**, which **completely bypasses Row Level Security (RLS)**. It is shipped to every visitor's browser in the JS bundle. Any attacker can extract it from the network tab or the built `assets/*.js` file and use it to:
- **Read/write/delete every row** in `sync_catalog` and all other tables
- **Read/write/delete every file** in the `audio` storage bucket
- **Invoke admin functions** and manage the entire Supabase project

This is the single most critical vulnerability in the platform. The anon key (with RLS enforced) must be used in the client.

**Omega Patch:** Use the **anon key** via Vite env vars, and enforce RLS policies server-side:

```jsx
// src/utils/supabaseClient.js — OMEGA PATCH
import { createClient } from '@supabase/supabase-js';

// ⚡ SECURE: Use Vite env vars — NEVER hardcode keys in source.
// The anon key is safe for client use ONLY when RLS is enforced.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("CRITICAL: SUPABASE ENV KEYS MISSING. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```

```bash
# .env (root of project) — NEVER commit this file. Add to .gitignore.
VITE_SUPABASE_URL=https://llbwsbhhomvnjfjuswxh.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_ANON_KEY_HERE>
```

**⚠️ IMMEDIATE ACTION REQUIRED:** Rotate the exposed service role key in the Supabase dashboard immediately. It is compromised.

### 3.3 Forced-Download Bypasses — 🟠 HIGH

**File & Line:** `src/components/Vault.jsx:243-261`

**Threat Vector:** The download anchor uses `download` **combined with** `target="_blank"` (line 252). Per the HTML spec, the `download` attribute is **ignored when `target="_blank"` is set** in most browsers (Chrome, Firefox). Instead of forcing a download, the browser **navigates to the audio file in a new tab**, where the browser's built-in media player may attempt to play it or the browser may trigger its own download behavior — which can be flagged by aggressive malware heuristics as an unexpected media download. This breaks the "forced download" contract and can trigger browser security warnings.

**Omega Patch:** Remove `target="_blank"` so the `download` attribute is honored, and keep `rel` for safety:

```jsx
<a
  href={(() => {
    const url = track.file_path || track.url || track.audioUrl || '#';
    if (url.includes('supabase.co')) {
      return `${url}?download=${encodeURIComponent(sanitizeFilename(track.title) + '_Temp.mp3')}`;
    }
    return url;
  })()}
  download={`${sanitizeFilename(track.title)}_Temp_Master.mp3`}
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()}
  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer"
>
  Temp MP3
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
</a>
```

---

## 4. SUPABASE LATENCY & EDGE OPTIMIZATION

### 4.1 Payload Micro-Optimization — 🟠 HIGH

**File & Line:** `src/components/Vault.jsx:25-28`

**Threat Vector:** The query uses `.select('*')` (line 27), fetching **every column** of every row in `sync_catalog`. If the table contains large columns (e.g., `file_path`, `lyrics`, `metadata`, `stems` JSON blobs), this bloats the payload and increases TTFB. The UI only renders `track_title`, `mood`, `bpm`, `key`, `asset_type`, and `file_name` — the rest is dead weight over the wire.

**Omega Patch:** Strictly project only the columns the UI consumes:

```jsx
// src/components/Vault.jsx — replace lines 25-28
const { data, error } = await supabase
  .from('sync_catalog')
  .select('id, track_title, mood, bpm, key, asset_type, file_name')
  .order('track_title', { ascending: true });
```

### 4.2 Optimistic UI — 🟡 MEDIUM

**File & Line:** `src/components/Vault.jsx:69-99` (play), `src/components/LicenseModal.jsx:44-53` (submit)

**Threat Vector (A) — Play:** `handlePlayClick` calls `setTrack(mappedTrack)` which synchronously updates Zustand — the UI reacts instantly. **This is correct optimistic UI.** ✅

**Threat Vector (B) — License Submit:** `handleSubmit` (LicenseModal.jsx:44-53) uses a **fake `setTimeout`** that only `console.log`s the form data. There is **no real network request** — the lead is silently dropped. This is not an optimistic-UI problem; it's a **functional gap**: enterprise license inquiries are never delivered to the admin inbox. The form shows "APPLICATION RECEIVED" but nothing is sent.

**Omega Patch:** Wire the license form to a real submission endpoint (e.g., Supabase insert into a `license_inquiries` table with RLS insert policy, or a serverless function):

```jsx
// src/components/LicenseModal.jsx — replace handleSubmit (lines 44-53)
import { supabase } from '../utils/supabaseClient';

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    const { error } = await supabase
      .from('license_inquiries')
      .insert({
        full_name: formData.fullName,
        company: formData.company,
        production_title: formData.productionTitle,
        budget_range: formData.budgetRange,
        project_details: formData.projectDetails,
        track_id: track?.id,
        track_title: track?.track_title,
        created_at: new Date().toISOString(),
      });
    if (error) throw error;
    setIsSubmitted(true);
  } catch (err) {
    console.error('License submission failed:', err);
    // Show inline error state
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 5. THE APEX REFACTORING DIRECTIVES

Every vulnerability and optimization flagged in Sections 1–4 above is accompanied by its three mandatory directives. The compliance matrix below consolidates them:

| # | Finding | File & Line | Threat Vector | Omega Patch |
|---|---------|-------------|---------------|-------------|
| 1 | Service role key exposed | `utils/supabaseClient.js:5` | RLS bypass — full DB/storage admin | §3.2 — env-var anon key |
| 2 | No Error Boundary | `main.jsx:6`, `App.jsx:7` | White screen on render throw | §2.3 — class ErrorBoundary |
| 3 | MediaSession missing | `PlayerBar.jsx` (entire) | No lock-screen/Bluetooth controls | §1.2 — mediaSession handlers |
| 4 | Audio buffer not released | `PlayerBar.jsx:252-266` | RAM spikes on rapid-fire play | §1.1 — teardown effect |
| 5 | Inline `Equalizer` remounts | `PlayerBar.jsx:167-184` | 4×/sec unmount/remount | §2.1A — hoist to module scope |
| 6 | Whole-store subscription | `PlayerBar.jsx:42`, `Vault.jsx:12` | Cascading grid re-renders | §2.1B — granular selectors |
| 7 | Layout-triggering progress bar | `PlayerBar.jsx:281-294` | Reflow 4×/sec | §2.2 — compositor transforms |
| 8 | `download` + `target="_blank"` | `Vault.jsx:252` | Forced download bypass | §3.3 — remove `target` |
| 9 | `.select('*')` | `Vault.jsx:27` | Payload bloat / slow TTFB | §4.1 — column projection |
| 10 | localStorage write amp | `usePlayerStore.js:95-101` | Main-thread jank 4×/sec | §5.2 — throttle to 1/sec |
| 11 | Fake license form | `LicenseModal.jsx:44-53` | Leads silently dropped | §4.2 — real Supabase insert |
| 12 | Download filename injection | `Vault.jsx:247,251` | Filename/URL manipulation | §3.1 — `sanitizeFilename` |
| 13 | `window.location.reload()` | `PlayerBar.jsx:310` | Full state wipe | §5.1 — `clearSession()` |
| 14 | Duplicate title formatters | 4 files | Inconsistent display | §5.3 — shared utility |
| 15 | CORS dependency | `PlayerBar.jsx:254` | Silent playback failure | §5.5 — gate analyzer |
| 16 | Dead `wavesurfer.js` | `package.json:19` | Bundle bloat | §5.4 — remove dep |
| 17 | Object URL lifecycle | — | — | ✅ SYSTEM NOMINAL |

---

## 6. ADDITIONAL APEX FINDINGS

### 6.1 `window.location.reload()` on CLOSE — 🟡 MEDIUM

**File & Line:** `src/components/PlayerBar.jsx:310`

**Threat Vector:** The "CLOSE ✕" button triggers a full page reload, wiping the SPA state, re-fetching the entire catalog, and re-running all animations. This is a heavy operation that also loses the in-memory playlist. The store already has a `clearSession()` action (usePlayerStore.js:103-106) that is never used.

**Omega Patch:**

```jsx
// src/components/PlayerBar.jsx — replace line 310
<button
  onClick={clearSession}
  className="text-zinc-700 hover:text-zinc-300 text-[10px] font-bold tracking-[0.2em] transition-colors uppercase"
>
  CLOSE ✕
</button>
```

### 6.2 localStorage Write Amplification — 🟠 HIGH

**File & Line:** `src/store/usePlayerStore.js:95-101` (`updateCurrentTime`), `src/components/PlayerBar.jsx:106-114` (`handleTimeUpdate`)

**Threat Vector:** `handleTimeUpdate` fires ~4×/sec during playback and calls `updateCurrentTime`, which synchronously writes the entire session object (including the full track object) to `localStorage` **4×/sec**. Synchronous `localStorage.setItem` blocks the main thread and causes jank, plus constant GC pressure from serializing the track object repeatedly.

**Omega Patch:** Throttle persistence to once per second:

```jsx
// src/components/PlayerBar.jsx — replace handleTimeUpdate (lines 106-114)
const lastPersistRef = useRef(0);

function handleTimeUpdate() {
  if (audioRef.current) {
    setCurrentTime(audioRef.current.currentTime);
    if (!isScrubbingRef.current && isPlaying) {
      const now = Date.now();
      if (now - lastPersistRef.current > 1000) {
        lastPersistRef.current = now;
        updateCurrentTime(audioRef.current.currentTime);
      }
    }
  }
}
```

### 6.3 Duplicate Title-Formatting Logic — 🟡 MEDIUM

**File & Line:** `src/store/usePlayerStore.js:28-34`, `src/components/Vault.jsx:42-48`, `src/components/PlayerBar.jsx:9-29`, `src/components/LicenseModal.jsx:21-26`

**Threat Vector:** Four separate, **inconsistent** implementations of `formatTrackTitle`. The store version (line 28) only strips leading underscores and extensions; the PlayerBar version (line 9) additionally title-cases words and collapses repeated `(Remix)`. This causes the same track to display differently in the grid vs. the player bar vs. the license modal — a data-consistency defect that erodes enterprise trust.

**Omega Patch:** Extract a single shared utility:

```jsx
// src/utils/formatTrackTitle.js — NEW FILE (single source of truth)
export default function formatTrackTitle(rawString) {
  if (!rawString) return 'Untitled Master';
  let cleaned = rawString
    .replace(/^_+/, '')
    .replace(/_+$/, '')
    .replace(/\.(wav|mp3|flac|aiff?|ogg)$/i, '')
    .replace(/(\(Remix\)\s*){2,}/gi, '(Remix)')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  cleaned = cleaned
    .split(' ')
    .map((w) => {
      if (!w) return w;
      if (w === w.toUpperCase() && w.length > 1) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
  return cleaned || 'Untitled Master';
}
```

### 6.4 Dead Dependency — 🟢 LOW

**File & Line:** `package.json:19`

**Threat Vector:** `wavesurfer.js` is declared as a dependency but never imported anywhere in `src/`. It bloats the install and, if tree-shaking fails, the bundle.

**Omega Patch:** Remove `"wavesurfer.js": "^7.12.11"` from `package.json`.

### 6.5 `crossOrigin="anonymous"` CORS Dependency — 🟡 MEDIUM

**File & Line:** `src/components/PlayerBar.jsx:254`

**Threat Vector:** The `<audio>` element sets `crossOrigin="anonymous"` (required for `createMediaElementSource` in the Web Audio analyzer). If the Supabase public bucket or the Vite public `/` directory does not send `Access-Control-Allow-Origin: *` headers, the audio will **fail to load entirely** — the analyzer's CORS requirement breaks playback. This is a silent functional failure risk.

**Omega Patch:** Verify CORS headers on both the Supabase bucket and the Vite public assets. For Vite, add a `public/_headers` or configure the server. For Supabase, ensure the bucket's CORS policy allows the origin. If CORS cannot be guaranteed, gate the analyzer so it degrades gracefully:

```jsx
// src/components/PlayerBar.jsx — guard the analyzer
const spectrum = useAudioAnalyzer(
  audioRef.current,
  isPlaying && !!activeTrack && !audioError
);
```

---

## AUDIT SUMMARY

| # | Finding | Severity | File:Line |
|---|---------|----------|-----------|
| 1 | **Service role key hardcoded in client bundle (RLS bypass)** | 🔴 CRITICAL | `utils/supabaseClient.js:5` |
| 2 | **No Error Boundary — white screen on any render throw** | 🔴 CRITICAL | `main.jsx:6`, `App.jsx:7` |
| 3 | **MediaSession API missing — no lock-screen/Bluetooth controls** | 🔴 CRITICAL | `PlayerBar.jsx` (entire) |
| 4 | Audio buffer never released on unmount/track change | 🟠 HIGH | `PlayerBar.jsx:252-266` |
| 5 | Inline `Equalizer` component remounts 4×/sec | 🟠 HIGH | `PlayerBar.jsx:167-184` |
| 6 | Whole-store Zustand subscription cascades re-renders | 🟠 HIGH | `PlayerBar.jsx:42`, `Vault.jsx:12` |
| 7 | Progress bar uses layout-triggering `width`/`left` | 🟠 HIGH | `PlayerBar.jsx:281-294` |
| 8 | `download` + `target="_blank"` breaks forced download | 🟠 HIGH | `Vault.jsx:252` |
| 9 | `.select('*')` fetches entire rows | 🟠 HIGH | `Vault.jsx:27` |
| 10 | localStorage write amplification 4×/sec | 🟠 HIGH | `usePlayerStore.js:95-101` |
| 11 | License form is fake — no real submission | 🟡 MEDIUM | `LicenseModal.jsx:44-53` |
| 12 | Download filename/URL injection (mitigated by React, harden) | 🟡 MEDIUM | `Vault.jsx:247,251` |
| 13 | `window.location.reload()` on CLOSE | 🟡 MEDIUM | `PlayerBar.jsx:310` |
| 14 | Duplicate/inconsistent title formatters | 🟡 MEDIUM | 4 files |
| 15 | `crossOrigin="anonymous"` CORS failure risk | 🟡 MEDIUM | `PlayerBar.jsx:254` |
| 16 | Dead `wavesurfer.js` dependency | 🟢 LOW | `package.json:19` |
| 17 | Object URL lifecycle | ✅ SYSTEM NOMINAL | — |

**⚠️ URGENT:** Rotate the exposed service role key immediately. It grants full database and storage admin access to anyone who inspects the client bundle.