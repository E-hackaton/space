import { createBrowserRouter } from 'react-router-dom'

import { Layout } from './components/Layout'
import { AtlasPage } from './pages/AtlasPage'
import { CollectionPage } from './pages/CollectionPage'
import { HeroPage } from './pages/HeroPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

/** Toutes les routes de l'application. Les URL sont en français, comme l'interface. */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/atlas/:bodySlug', element: <AtlasPage /> },
      { path: '/heros/:slug', element: <HeroPage /> },
      { path: '/collection', element: <CollectionPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
