import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Port 3000 (au lieu de 5173 par défaut), accessible depuis le réseau local (adresse IP).
  server: { port: 3000, strictPort: true, host: true },
  preview: { port: 3000, strictPort: true, host: true },
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
