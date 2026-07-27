import { create } from 'zustand';

const usePlayerStore = create((set) => ({
  activeTrack: null,
  isPlaying: false,
  playTrack: (track) => set({ activeTrack: track, isPlaying: true }),
  setTrack: (track) => set({ activeTrack: track, isPlaying: true }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  openStems: (track) => console.log('Opening stems for', track.title),
}));

export default usePlayerStore;