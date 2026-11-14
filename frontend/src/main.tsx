import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

// Polices de la charte Space Apps, hébergées avec l'app (aucun appel à un service externe).
import '@fontsource/fira-sans/700.css'
import '@fontsource/fira-sans/900.css'
import '@fontsource/overpass/400.css'
import '@fontsource/overpass/400-italic.css'
import '@fontsource/overpass/700.css'

import { router } from './router'
import './styles/theme.css'
import './styles/worlds.css'
import './styles/global.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error("L'élément #root est introuvable dans index.html.")

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
