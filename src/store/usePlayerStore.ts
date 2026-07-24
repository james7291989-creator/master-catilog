import { create } from 'zustand';

interface PlayerState {
  activeTrack: any | null;
  isPlaying: boolean;
  playTrack: (track: any) => void;
  togglePlay: () => void;
  openStems: (track: any) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  activeTrack: null,
  isPlaying: false,
  playTrack: (track) => set({ activeTrack: track, isPlaying: true }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  openStems: (track) => console.log("Opening stems for", track.title),
}));
