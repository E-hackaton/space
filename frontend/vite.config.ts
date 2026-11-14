import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En développement, Vite redirige /api et /media vers Django (port 8000).
// Le navigateur ne voit qu'une seule origine : pas de souci de CORS, et le même code
// fonctionne en production quand Django sert aussi le frontend.
const DJANGO_DEV_SERVER = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': DJANGO_DEV_SERVER,
      '/media': DJANGO_DEV_SERVER,
    },
  },
})
