import HeroSection from './components/HeroSection';
import Vault from './components/Vault';
import PlayerBar from './components/PlayerBar';

export default function App() {
  return (
    <div className="min-h-screen bg-transparent text-white font-body pb-28 overflow-x-hidden selection:bg-cyan-500/30">
      <div className="relative z-10">
        <HeroSection />
        <Vault />
      </div>
      <PlayerBar />
    </div>
  );
}