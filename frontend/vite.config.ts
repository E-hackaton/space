import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// En développement, Vite redirige /api et /media vers Django (port 8000) : une seule origine,
// donc pas de CORS, et le même code marche en production (Caddy sert le site et Django sur le même domaine).
const DJANGO_DEV_SERVER = 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA : l'app s'installe sur l'écran d'accueil et fonctionne hors ligne.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'FORBITS · Their missions ended. Their stories live on.',
        short_name: 'FORBITS',
        description:
          "Pars en voyage dans le Système solaire et rencontre les machines que la NASA a laissées sur la Lune, sur Mars et au-delà.",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#060B1A',
        theme_color: '#060B1A',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Pré-cache : le code, les styles et les icônes. Les textures, modèles 3D et trajets (lourds)
        // sont mis en cache au premier usage seulement, pour ne pas consommer la data mobile d'avance.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'data/api/**/*.json'],
        // Figures 3D interactives des engins (1 à 5 Mo chacune) : en cache seulement après la première ouverture.
        globIgnores: ['engins/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Routes servies par Django : jamais remplacées par l'app.
        navigateFallbackDenylist: [/^\/api\//, /^\/admin/, /^\/static\//, /^\/media\//],
        runtimeCaching: [
          {
            // Copie statique des voix (backend : manage.py export_static_api).
            urlPattern: ({ url }) => url.pathname.startsWith('/static-media/'),
            handler: 'CacheFirst',
            options: { cacheName: 'forbits-static-media', expiration: { maxEntries: 300 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/engins/'),
            handler: 'CacheFirst',
            options: { cacheName: 'forbits-engins', expiration: { maxEntries: 12 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            // Textes de l'API : le réseau d'abord (contenu à jour), le cache si on est hors ligne.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'forbits-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 3600 },
            },
          },
          {
            // Voix ElevenLabs (le nom de fichier contient une empreinte : elles ne changent jamais).
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'forbits-media',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
              // Les lecteurs audio (Safari, iPhone) demandent des morceaux de fichier.
              rangeRequests: true,
            },
          },
          {
            // Textures NASA, modèles 3D et trajets des rovers.
            urlPattern: ({ url }) => /^\/(textures|models|data)\//.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'forbits-3d',
              expiration: { maxEntries: 80, maxAgeSeconds: 30 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  // Port 3000, accessible depuis le réseau local (test sur téléphone).
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: { '/api': DJANGO_DEV_SERVER, '/media': DJANGO_DEV_SERVER },
  },
  preview: { port: 3000, strictPort: true, host: true, proxy: { '/api': DJANGO_DEV_SERVER, '/media': DJANGO_DEV_SERVER } },
  build: {
    // three.js pèse ~350 Ko gzip, chargé à la demande : avertissement attendu.
    chunkSizeWarningLimit: 1400,
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
