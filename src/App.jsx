import HeroSection from './components/HeroSection';
import Vault from './components/Vault';
import PlayerBar from './components/PlayerBar';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white font-body pb-28 overflow-x-hidden">
      {/* BACKGROUND IMAGE — grayscale, high contrast, low brightness — stripped of all color */}
      <div
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bg.jpg')",
          filter: 'grayscale(100%) contrast(120%) brightness(40%)',
        }}
      />

      <div className="relative z-10">
        <HeroSection />
        <Vault />
      </div>
      <PlayerBar />
    </div>
  );
}