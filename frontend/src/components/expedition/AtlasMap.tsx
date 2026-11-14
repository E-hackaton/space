import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mapXY, SURFACES, type AtlasPoint, type SurfaceBody } from '../../lib/atlas';
import { Icon } from '../ui/Glyphs';

interface Props {
  body: SurfaceBody;
  points: AtlasPoint[];
  found: string[];
  target: string | null;
  onPick: (id: string) => void;
}

/**
 * Carte plate des objets oubliés d'un astre (projection équirectangulaire, vraies coordonnées).
 * Chaque objet est un bouton : la carte est aussi la liste accessible au clavier.
 */
export function AtlasMap({ body, points, found, target, onPick }: Props) {
  const { t } = useTranslation();
  const [big, setBig] = useState(false);

  return (
    <div className={`atlas-map ${big ? 'atlas-map-big' : ''}`}>
      <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-1.5">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest">
          <Icon name="map" /> {t('expedition.map', { body: t(`bodies.${body}.name`) })}
          <span className="ml-2 font-sans text-xs font-normal normal-case tracking-normal text-slate-300">
            {found.length}/{points.length}
          </span>
        </p>
        <button type="button" onClick={() => setBig(!big)} className="rounded-full px-2 text-xs ring-1 ring-white/25 hover:bg-white/10" aria-pressed={big}>
          {big ? '−' : '+'}
          <span className="sr-only">{t('expedition.mapSize')}</span>
        </button>
      </div>
      <div className="relative aspect-[2/1] overflow-hidden rounded-lg" style={{ backgroundImage: `url(${SURFACES[body].texture})`, backgroundSize: '100% 100%' }}>
        <div className="atlas-map-grid" aria-hidden="true" />
        <ul>
          {points.map((p) => {
            const [x, y] = mapXY(p.shown);
            const active = p.machine.status === 'active';
            const isFound = found.includes(p.machine.id);
            return (
              <li key={p.machine.id} className="absolute" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
                <button
                  type="button"
                  onClick={() => onPick(p.machine.id)}
                  className={`atlas-pin ${active ? 'atlas-pin-active' : 'atlas-pin-dormant'} ${target === p.machine.id ? 'atlas-pin-target' : ''}`}
                  aria-label={`${p.machine.name} · ${active ? t('status.active') : t('status.dormant')}${isFound ? ` · ${t('expedition.found')}` : ''}`}
                  title={p.machine.name}
                >
                  {isFound ? '✓' : ''}
                </button>
                {big && <span className="atlas-pin-label">{p.machine.name}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
