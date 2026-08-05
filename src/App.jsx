import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HeroSection from './components/HeroSection';
import Vault from './components/Vault';
import SyncVault from './components/SyncVault';
import PlayerBar from './components/PlayerBar';
import Mission from './pages/Mission';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
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
                <SyncVault />
              </div>
              <PlayerBar />
            </div>
          }
        />
        <Route path="/mission" element={<Mission />} />
      </Routes>
    </BrowserRouter>
  );
}
