/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de base de l'API Django, ex. « https://sankofa-api.onrender.com ». Vide = même origine. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
