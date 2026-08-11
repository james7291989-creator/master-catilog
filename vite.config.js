import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ⚡ V24.2 VITE CONFIG SURGERY — ruthless code splitting.
// The lazy `chunkSizeWarningLimit: 1000` suppression is REMOVED so the
// default 500KB warning fires, surfacing any oversized chunk.
// Strict manualChunks isolate heavy vendors into dedicated cacheable chunks.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Isolate the animation engine into its own cache-bustable chunk
          if (id.includes('framer-motion') || id.includes('motion-dom')) {
            return 'vendor-animation';
          }
          // Isolate the icon set — huge but rarely changes
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // Isolate the state management engine
          if (id.includes('zustand')) {
            return 'vendor-state';
          }
          // Isolate the Supabase client + auth + realtime stack
          if (
            id.includes('@supabase') ||
            id.includes('supabase-js') ||
            id.includes('gotrue-js') ||
            id.includes('realtime-js') ||
            id.includes('storage-js') ||
            id.includes('postgrest-js')
          ) {
            return 'vendor-supabase';
          }
          // Isolate React + ReactDOM + React Router into the core runtime chunk
          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('react/') ||
            id.includes('react ')
          ) {
            return 'vendor-react';
          }
        },
      },
    },
  },
});