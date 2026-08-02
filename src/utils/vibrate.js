// =============================================================================
// PHASE 3: HAPTIC RESONANCE — physical touch feedback
// Triggers a 40ms device vibration on supported hardware
// =============================================================================

export default function hapticClick() {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(40);
  }
}