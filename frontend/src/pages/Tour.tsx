import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { PlanetGlyph } from '../components/ui/Glyphs';
import { SankofaAvatar } from '../components/guide/SankofaAvatar';
import { speak } from '../audio/speech';
import { useStore } from '../store/useStore';
import type { Vehicle, WorldId } from '../world/state';

const SITES: WorldId[] = ['moon', 'jezero', 'gale'];
const VEHICLES: Vehicle[] = ['rover', 'lrv'];
type Pilot = 'auto' | 'manual';

/** Visite 3D : choisir le site, l'engin et le pilote, puis on arrive directement au sol. */
export default function Tour() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const voiceOn = useStore((s) => s.voiceOn);
  const [site, setSite] = useState<WorldId>('moon');
  const [vehicle, setVehicle] = useState<Vehicle>('lrv');
  const [pilot, setPilot] = useState<Pilot>('auto');
  useEffect(() => {
    if (voiceOn) speak(t('visit.hello'), i18n.language);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = () => navigate(`/explorer?monde=${site}&engin=${vehicle}&pilote=${pilot}`);
  const option = (on: boolean) => `visit-option ${on ? 'visit-option-on' : ''}`;

  return (
    <section className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden bg-space px-4 py-10 text-white">
      <div className="living-bg" aria-hidden="true" />
      <h1 className="sr-only">{t('tour.title')}</h1>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative flex items-center gap-3">
        <SankofaAvatar size={64} talking />
        <p className="max-w-md text-lg">{t('visit.hello')}</p>
      </motion.div>

      <fieldset className="relative flex flex-wrap justify-center gap-10">
        <legend className="visit-legend">{t('visit.where')}</legend>
        {SITES.map((w, i) => (
          <motion.button key={w} type="button" onClick={() => setSite(w)} aria-pressed={site === w} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`planet-pick ${site === w ? '' : 'opacity-45 hover:opacity-100'}`}>
            <PlanetGlyph body={w} size={site === w ? 130 : 104} className="transition-all duration-500" />
            <span className="planet-pick-name !text-2xl">{t(`explorer.worlds.${w}`)}</span>
            <span className="text-xs text-slate-400">{t(`explorer.who.${w}`)}</span>
          </motion.button>
        ))}
      </fieldset>

      <div className="relative flex flex-wrap justify-center gap-12">
        <fieldset className="flex flex-col items-center gap-1">
          <legend className="visit-legend">{t('visit.vehicle')}</legend>
          {VEHICLES.map((v) => (
            <button key={v} type="button" onClick={() => setVehicle(v)} aria-pressed={vehicle === v} className={option(vehicle === v)}>
              {t(`visit.vehicles.${v}`)}
            </button>
          ))}
        </fieldset>
        <fieldset className="flex flex-col items-center gap-1">
          <legend className="visit-legend">{t('expedition.pilot')}</legend>
          {(['auto', 'manual'] as Pilot[]).map((p) => (
            <button key={p} type="button" onClick={() => setPilot(p)} aria-pressed={pilot === p} className={option(pilot === p)}>
              {t(`expedition.modes.${p}`)}
            </button>
          ))}
        </fieldset>
      </div>

      <button type="button" onClick={go} className="hero-cta relative">
        <span>{t('visit.go')}</span>
      </button>
      {vehicle === 'lrv' && site !== 'moon' && <p className="relative -mt-6 max-w-md text-center text-xs text-slate-400">{t('visit.lrvNote')}</p>}
    </section>
  );
}
