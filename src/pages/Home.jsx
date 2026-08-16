import HeroSection from '../components/HeroSection';
import Vault from '../components/Vault';

// ⚡ V24.2 HOME ROUTE — extracted from App.jsx into its own lazy chunk.
// Background + Hero + Vault all render here; the Mission route loads
// independently so the home page never pays for Mission's chunk.
// ⚡ ZERO-CRASH AUDIO RULE: PlayerBar is NOT rendered here — it lives
// globally in App.jsx OUTSIDE <Routes> so navigation never kills audio.
export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-body pb-44 lg:pb-52 overflow-x-hidden">
      {/* BACKGROUND IMAGE — grayscale, high contrast, low brightness — stripped of all color.
          ⚡ V24 OPTIMIZATION: The CSS filter (grayscale/contrast/brightness) has been
          BAKED directly into /bg.jpg pixels at build time — zero runtime filter cost.
          ⚡ THE BREATH ENGINE: the deep background inhales/exhales on a 20s
          GPU-accelerated loop (transform + opacity only). Content sits on z-10
          above it, so text stays perfectly crisp while the void breathes behind
          the vault. */}
      <div
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat animate-breathe"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />

      <div className="relative z-10">
        <HeroSection />
        <Vault />
      </div>
    </div>
  );
}