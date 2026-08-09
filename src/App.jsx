import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HeroSection from './components/HeroSection';
import Vault from './components/Vault';
import PlayerBar from './components/PlayerBar';
import Mission from './pages/Mission';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-black text-white font-body pb-44 lg:pb-52 overflow-x-hidden">
              {/* BACKGROUND IMAGE — grayscale, high contrast, low brightness — stripped of all color
                  ⚡ THE BREATH ENGINE: the deep background inhales/exhales on a 20s
                  GPU-accelerated loop. Content sits on z-10 above it, so text stays
                  perfectly crisp while the void breathes behind the vault. */}
              <div
                className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat animate-breathe"
                style={{
                  backgroundImage: "url('/bg.jpg')",
                  filter: 'grayscale(100%) contrast(120%) brightness(40%)',
                }}
              />

              <div className="relative z-10">
                <HeroSection />
                <Vault />
              </div>
              {/* ⚡ APEX PLAYER INSULATION: fixed glass chassis sits above all
                  content, insulated by the pb-44/lg:pb-52 viewport clearance so
                  no tracklist item or bio section is ever covered on scroll. */}
              <PlayerBar />
            </div>
          }
        />
        <Route path="/mission" element={<Mission />} />
      </Routes>
    </BrowserRouter>
  );
}
