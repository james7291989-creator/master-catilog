import { useRef, useEffect, useState, useCallback } from 'react';

// =============================================================================
// PILLAR 2: AMBIENT AUDIO REACTIVITY
// Extracts real-time frequency data from a given <audio> element
// Returns normalized bass/mid/treble values from 0–1
//
// ⚡ MODULE-LEVEL SINGLETON PATCH:
// AudioContext + MediaElementSourceNode are created ONCE at module scope and
// reused across ALL component instances and lifecycle cycles. This prevents
// InvalidStateError from calling createMediaElementSource on an element that
// already has one, even across unmount/remount cycles (Strict Mode, HMR, etc.)
// =============================================================================

// --- Module-level singletons (survive component lifecycle) ---
let moduleCtx = null;
let moduleSource = null;
let moduleAnalyser = null;
let moduleInitialized = false;

export default function useAudioAnalyzer(audioElement, isActive = false) {
  const rafRef = useRef(null);
  const [spectrum, setSpectrum] = useState({ bass: 0, mid: 0, treble: 0 });

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  // Full teardown — only called on unmount
  const fullCleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (moduleSource) {
      try { moduleSource.disconnect(); } catch { /* silent */ }
    }
    if (moduleAnalyser) {
      try { moduleAnalyser.disconnect(); } catch { /* silent */ }
    }
    if (moduleCtx?.state !== 'closed') {
      try { moduleCtx?.close(); } catch { /* silent */ }
    }
    moduleCtx = null;
    moduleSource = null;
    moduleAnalyser = null;
    moduleInitialized = false;
  }, []);

  useEffect(() => {
    if (!audioElement || !isActive) {
      cleanup();
      setSpectrum({ bass: 0, mid: 0, treble: 0 });
      return;
    }

    const init = async () => {
      try {
        // ⚡ MODULE-LEVEL SINGLETON: Only create AudioContext + source ONCE
        if (!moduleInitialized) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          // ⚡ WAKE-UP: Resume AudioContext if suspended (browser autoplay policy)
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          moduleCtx = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          moduleAnalyser = analyser;

          const source = ctx.createMediaElementSource(audioElement);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          moduleSource = source;

          moduleInitialized = true;
        } else {
          // Resume context if suspended (browser autoplay policy)
          if (moduleCtx?.state === 'suspended') {
            await moduleCtx.resume();
          }
        }

        const dataArray = new Uint8Array(moduleAnalyser.frequencyBinCount);

        const tick = () => {
          if (!moduleAnalyser) return;
          moduleAnalyser.getByteFrequencyData(dataArray);

          const len = dataArray.length;
          const bassRange = Math.floor(len * 0.1);
          const midRange = Math.floor(len * 0.5);

          let bassSum = 0, midSum = 0, trebleSum = 0;

          for (let i = 0; i < len; i++) {
            const val = dataArray[i] / 255;
            if (i < bassRange) bassSum += val;
            else if (i < midRange) midSum += val;
            else trebleSum += val;
          }

          const bass = Math.min(bassSum / Math.max(bassRange, 1), 1);
          const mid = Math.min(midSum / Math.max(midRange - bassRange, 1), 1);
          const treble = Math.min(trebleSum / Math.max(len - midRange, 1), 1);

          setSpectrum({ bass, mid, treble });
          rafRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch {
        // Analyzer init is best-effort; the player continues without visuals.
        setSpectrum({ bass: 0, mid: 0, treble: 0 });
      }
    };

    // Wait for audio element to have a valid src & ready state
    if (audioElement.readyState >= 2) {
      init();
    } else {
      const handleCanPlay = () => init();
      audioElement.addEventListener('canplay', handleCanPlay);
      return () => {
        audioElement.removeEventListener('canplay', handleCanPlay);
        cleanup();
      };
    }

    return cleanup;
  }, [audioElement, isActive, cleanup]);

  // Full teardown on unmount
  useEffect(() => {
    return () => fullCleanup();
  }, [fullCleanup]);

  return spectrum;
}
