import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js pèse ~290 Ko gzip, chargé à la demande : avertissement attendu.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Isole la 3D dans son propre fichier, chargé seulement quand une scène s'affiche.
        manualChunks(id) {
          if (/node_modules\/(three|@react-three)\//.test(id)) return 'three';
        },
      },
    },
  },
});
