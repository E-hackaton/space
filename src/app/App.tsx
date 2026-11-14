import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { Loading } from '../components/ui/Loading';
import Home from '../pages/Home';

// Chaque écran lourd est chargé à la demande.
const JourneyMap = lazy(() => import('../pages/JourneyMap'));
const ChapterPage = lazy(() => import('../pages/ChapterPage'));
const Tour = lazy(() => import('../pages/Tour'));
const Sources = lazy(() => import('../pages/Sources'));
const NotFound = lazy(() => import('../pages/NotFound'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<Layout />}>
            <Route path="/carte" element={<JourneyMap />} />
            <Route path="/visite" element={<Tour />} />
            <Route path="/chapitre/:id" element={<ChapterPage />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
