import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// En développement, Vite redirige /api et /media vers Django (port 8000).
// Le navigateur ne voit qu'une seule origine : pas de souci de CORS, et le même code
// fonctionne en production quand Caddy sert le frontend et Django sur le même domaine.
const DJANGO_DEV_SERVER = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [
    react(),
    // PWA : l'app s'installe sur l'écran d'accueil et fonctionne hors ligne.
    VitePWA({
      registerType: 'autoUpdate', // une nouvelle version s'installe d'elle-même au prochain chargement
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: "Sankofa · Les héros oubliés de l'espace",
        short_name: 'Sankofa',
        description:
          "Découvre les machines que la NASA a laissées sur la Lune, sur Mars et dans l'espace profond, et la science qu'elles ont rendue possible.",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#07173F',
        theme_color: '#07173F',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Mis en cache à l'installation : le code, les styles, les polices et les cartes NASA.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        // Polices : seuls les alphabets latins servent (FR/EN). Les autres jeux de caractères ne sont
        // jamais téléchargés par le navigateur ; les pré-cacher gaspillerait la data mobile.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Toute navigation hors ligne renvoie l'app (React Router affiche la bonne page)…
        navigateFallback: '/index.html',
        // …sauf les routes servies par Django.
        navigateFallbackDenylist: [/^\/api\//, /^\/admin/, /^\/static\//, /^\/media\//],
        runtimeCaching: [
          {
            // Textes de l'API : le réseau d'abord (contenu à jour), le cache si on est hors ligne.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sankofa-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 3600 },
            },
          },
          {
            // Voix ElevenLabs et photos : elles ne changent pas (le nom contient une empreinte).
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sankofa-media',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': DJANGO_DEV_SERVER,
      '/media': DJANGO_DEV_SERVER,
    },
  },
})
