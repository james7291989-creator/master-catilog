import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ⚡ V24.2 ROUTE-BASED CODE SPLITTING — each route is a lazy chunk.
// Only the chunk for the active route is fetched; the rest load on demand.
// This shreds the monolithic bundle into route-scoped payloads.
const HomePage = lazy(() => import('./pages/Home'));
const Mission = lazy(() => import('./pages/Mission'));

// ⚡ SLEEK MINIMAL LOADING STATE — never blanks out during chunk fetch.
function RouteFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
          Loading Vault...
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mission" element={<Mission />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}