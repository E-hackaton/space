import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { Loading } from '../components/ui/Loading';
import { PlanetGlyph } from '../components/ui/Glyphs';
import { StatusPill } from '../components/story/StatusPill';
import { MiniGlobe } from '../components/expedition/MiniGlobe';
import { atlasPoints, isSurfaceBody, SURFACE_BODIES, type SurfaceBody } from '../lib/atlas';
import { formatDate, useCatalog } from '../lib/machines';
import { webglAvailable } from '../lib/device';
import { usePrefersReducedMotion } from '../lib/hooks';
import { useStore } from '../store/useStore';
import { playDetect } from '../audio/sfx';
import { EngineFigure, figureOf } from '../components/figures/EngineFigure';

const AtlasScene = lazy(() => import('../scenes/atlas/AtlasScene'));

/** Carte du voyage : l'atlas 3D vivant de la Lune et de Mars, avec tous les objets oubliés. */
export default function JourneyMap() {
  const { t, i18n } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const [params, setParams] = useSearchParams();
  const body: SurfaceBody = isSurfaceBody(params.get('astre')) ? (params.get('astre') as SurfaceBody) : 'moon';
  const { machines, status } = useCatalog();
  const found = useStore((s) => s.completedMachines);
  const points = useMemo(() => atlasPoints(machines, body), [machines, body]);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => setSelected(null), [body]);
  const m = points.find((p) => p.machine.id === selected)?.machine;
  const select = (id: string) => {
    setSelected(id);
    playDetect();
  };

  return (
    <section className="relative flex-1 bg-space text-white">
      <h1 className="sr-only">{t('map.title')}</h1>
      <div className="relative h-[calc(100vh-3.5rem)] min-h-[32rem] w-full overflow-hidden">
        {webglAvailable && (
          <Suspense fallback={<Loading />}>
            <AtlasScene key={body} body={body} points={points} selected={selected} found={found} animate={!reduced} onSelect={select} />
          </Suspense>
        )}

        {/* Choix de l'astre : les planètes elles-mêmes */}
        <nav aria-label={t('map.title')} className="absolute left-4 top-4 z-30 flex flex-col gap-4">
          {SURFACE_BODIES.map((b) => (
            <button key={b} type="button" onClick={() => setParams({ astre: b })} aria-pressed={b === body} className={`group flex flex-col items-center transition ${b === body ? '' : 'opacity-50 hover:opacity-100'}`}>
              <PlanetGlyph body={b} size={b === body ? 56 : 44} className="transition group-hover:scale-110" />
              <span className={`font-display text-lg font-extrabold uppercase leading-none ${b === body ? 'text-white' : 'text-slate-300'}`}>{t(`bodies.${b}.name`)}</span>
            </button>
          ))}
        </nav>

        {/* Fiche courte de l'objet choisi */}
        <AnimatePresence>
          {m && (
            <motion.div key={m.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute right-4 top-1/2 z-30 w-[min(24rem,calc(100%-2rem))] -translate-y-1/2">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{m.mission}</p>
              <p className="font-display text-4xl font-extrabold uppercase leading-none">{m.name}</p>
              <div className="mt-2">
                <StatusPill active={m.status === 'active'} />
              </div>
              <p className="mt-3 text-slate-200">{m.location}</p>
              {m.arrivalDate && <p className="text-sm text-slate-400">{formatDate(m.arrivalDate, i18n.language)}</p>}
              {figureOf(m.id) && (
                <div className="mt-3 h-72 overflow-hidden rounded-[4px] ring-1 ring-white/15">
                  <EngineFigure id={m.id} name={m.name} />
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/mission?astre=${body}&mode=auto&machine=${m.id}`} className="btn-primary">
                  {t('atlas.goThere')}
                </Link>
                <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>
                  {t('atlas.back')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carte plate : aussi la liste accessible de tous les objets */}
        <div className="absolute bottom-3 left-3 z-30 w-[min(16rem,calc(100%-1.5rem))]">
          <MiniGlobe body={body} points={points} found={found} target={selected} onPick={select} />
        </div>
        {status === 'error' && (
          <p role="alert" className="absolute inset-x-0 top-24 z-40 mx-auto w-fit rounded-xl bg-red-500/90 px-4 py-2 text-sm">
            {t('errors.api')}
          </p>
        )}
        <p className="pointer-events-none absolute bottom-3 right-3 z-20 text-[11px] text-slate-400">{t('app.notToScale')}</p>
      </div>
    </section>
  );
}
