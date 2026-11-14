import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { Loading } from '../components/ui/Loading';
import Home from '../pages/Home';

// Chaque écran lourd est chargé à la demande.
const JourneyMap = lazy(() => import('../pages/JourneyMap'));
const ChapterPage = lazy(() => import('../pages/ChapterPage'));
const Tour = lazy(() => import('../pages/Tour'));
const MissionPage = lazy(() => import('../pages/MissionPage'));
const ExplorerPage = lazy(() => import('../pages/ExplorerPage'));
const ModelLab = lazy(() => import('../pages/ModelLab'));
const Sources = lazy(() => import('../pages/Sources'));
const Logbook = lazy(() => import('../pages/Logbook'));
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
            <Route path="/mission" element={<MissionPage />} />
            <Route path="/explorer" element={<ExplorerPage />} />
            {import.meta.env.DEV && <Route path="/labo" element={<ModelLab />} />}
            <Route path="/chapitre/:id" element={<ChapterPage />} />
            <Route path="/carnet" element={<Logbook />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
