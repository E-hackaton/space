import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { PlanetGlyph, Icon } from '../components/ui/Glyphs';
import { EngineFigure, figureOf } from '../components/figures/EngineFigure';
import { LOCAL_DIAGRAMS, resolveMedia, searchNasa, type MediaItem } from '../lib/nasaMedia';
import { useCatalog, type MachineSummary } from '../lib/machines';

type Body = 'all' | 'moon' | 'mars';

/** Médias du projet pour une machine : figure 3D interactive et schémas annotés. */
function localItems(m: MachineSummary, t: (k: string) => string): MediaItem[] {
  const out: MediaItem[] = [];
  const fig = figureOf(m.id);
  if (fig) out.push({ id: `fig-${m.id}`, machine: m.id, kind: 'figure', title: m.name, credit: t('gallery.figureCredit'), thumb: '', src: fig });
  for (const [i, d] of (LOCAL_DIAGRAMS[m.id] ?? []).entries())
    out.push({ id: `dia-${m.id}-${i}`, machine: m.id, kind: 'diagram', title: d.title, credit: t('gallery.diagramCredit'), thumb: d.src, src: d.src });
  return out;
}

/** Galerie : photos et vidéos réelles de la NASA pour chaque machine, figures 3D et schémas du projet. */
export default function Gallery() {
  const { t, i18n } = useTranslation();
  const { machines } = useCatalog();
  const [body, setBody] = useState<Body>('all');
  const [machine, setMachine] = useState<string>('all');
  const [nasa, setNasa] = useState<MediaItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [open, setOpen] = useState<MediaItem | null>(null);

  const list = useMemo(() => machines.filter((m) => (m.body === 'moon' || m.body === 'mars') && (body === 'all' || m.body === body)), [machines, body]);
  const shown = useMemo(() => (machine === 'all' ? list : list.filter((m) => m.id === machine)), [list, machine]);

  // Médias de la NASA pour les machines affichées.
  useEffect(() => {
    if (!shown.length) return;
    const ctrl = new AbortController();
    setStatus('loading');
    Promise.allSettled(shown.map((m) => searchNasa(m.id, ctrl.signal))).then((res) => {
      if (ctrl.signal.aborted) return;
      const ok = res.filter((r): r is PromiseFulfilledResult<MediaItem[]> => r.status === 'fulfilled');
      // Une machine à la fois, en alternant : la galerie n'est pas noyée sous une seule machine.
      const per = machine === 'all' ? 4 : 12;
      setNasa(ok.flatMap((r) => r.value.slice(0, per)));
      setStatus(ok.length ? 'ready' : 'offline');
    });
    return () => ctrl.abort();
  }, [shown, machine]);

  // Machine par machine, médias entremêlés (figure, photos, schéma, vidéos) : une galerie variée.
  const items = useMemo(
    () =>
      shown.flatMap((m) => {
        const local = localItems(m, t);
        const theirs = nasa.filter((n) => n.machine === m.id);
        const out: MediaItem[] = [];
        for (let i = 0; i < Math.max(local.length, theirs.length); i++) {
          if (theirs[2 * i]) out.push(theirs[2 * i]);
          if (local[i]) out.push(local[i]);
          if (theirs[2 * i + 1]) out.push(theirs[2 * i + 1]);
        }
        return [...out, ...theirs.slice(2 * Math.max(local.length, Math.ceil(theirs.length / 2)))];
      }),
    [shown, nasa, t],
  );
  const nameOf = (id: string) => machines.find((m) => m.id === id)?.name ?? id;

  return (
    <div className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 dark:bg-space dark:text-slate-100">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">{t('gallery.title')}</h1>

        {/* Filtres : astre puis machine */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(['all', 'moon', 'mars'] as Body[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => (setBody(b), setMachine('all'))}
              aria-pressed={body === b}
              className={`flex items-center gap-2 rounded-[4px] px-3 py-1.5 text-sm ring-1 transition ${body === b ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-space dark:ring-white' : 'ring-slate-300 hover:bg-slate-100 dark:ring-white/20 dark:hover:bg-white/10'}`}
            >
              {b !== 'all' && <PlanetGlyph body={b} size={20} />}
              {b === 'all' ? t('gallery.all') : t(`bodies.${b}.name`)}
            </button>
          ))}
          <span className="mx-1 h-6 w-px bg-slate-300 dark:bg-white/15" aria-hidden="true" />
          <select value={machine} onChange={(e) => setMachine(e.target.value)} aria-label={t('gallery.machine')} className="rounded-[4px] bg-white px-2 py-1.5 text-sm ring-1 ring-slate-300 dark:bg-space dark:ring-white/20">
            <option value="all">{t('gallery.allMachines')}</option>
            {list.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {status === 'loading' && (
          <p className="mt-6 flex items-center gap-3 text-slate-500 dark:text-slate-400" role="status">
            <span className="loader-ring !h-6 !w-6" aria-hidden="true" /> {t('chapter.loading')}
          </p>
        )}
        {status === 'offline' && <p className="mt-6 text-sm text-amber-700 dark:text-dormant">{t('gallery.offline')}</p>}

        {/* Mosaïque */}
        <ul className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((it, i) => (
            <motion.li key={it.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }} className="mb-4 break-inside-avoid">
              <button type="button" onClick={() => setOpen(it)} className="group block w-full overflow-hidden rounded-md bg-white text-left ring-1 ring-slate-200 transition hover:ring-slate-400 dark:bg-white/5 dark:ring-white/10 dark:hover:ring-white/30">
                <div className="relative">
                  {it.kind === 'figure' ? (
                    // Vignette légère : la figure (jusqu'à plusieurs Mo) ne se charge qu'à l'ouverture.
                    <div className="grid h-48 place-items-center bg-gradient-to-br from-[#0b1430] to-[#03050d] text-white">
                      <span className="text-center">
                        <span className="block font-display text-3xl font-extrabold uppercase">3D</span>
                        <span className="text-xs text-slate-300">{t('gallery.figureHint')}</span>
                      </span>
                    </div>
                  ) : (
                    <img src={it.thumb} alt={it.title} loading="lazy" className="block w-full bg-slate-200 object-cover transition group-hover:scale-[1.02] dark:bg-white/5" />
                  )}
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-[3px] bg-space/80 px-2 py-0.5 text-xs font-semibold text-white">
                    {it.kind === 'video' && <Icon name="play" size={12} />}
                    {t(`gallery.kinds.${it.kind}`)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 font-semibold leading-snug">{it.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {nameOf(it.machine)}
                    {it.date && ` · ${new Date(it.date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      <AnimatePresence>{open && <Lightbox item={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

/** Le média en grand : image haute définition, vidéo lue sur place ou figure 3D manipulable. */
function Lightbox({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const { t } = useTranslation();
  const [src, setSrc] = useState<string | null>(item.kind === 'figure' || item.kind === 'diagram' ? (item.src ?? null) : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (item.kind !== 'image' && item.kind !== 'video') return;
    let live = true;
    resolveMedia(item)
      .then((u) => live && setSrc(u))
      .catch(() => live && (setSrc(item.thumb), setFailed(item.kind === 'video')));
    return () => {
      live = false;
    };
  }, [item]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex flex-col bg-space/95 p-3 text-white sm:p-6" role="dialog" aria-modal="true" aria-label={item.title} onClick={onClose}>
      <div className="mb-3 flex items-start justify-between gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="font-display text-2xl font-extrabold uppercase leading-tight">{item.title}</p>
          <p className="text-sm text-slate-300">
            {item.credit}
            {item.date && ` · ${item.date}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {item.page && (
            <a href={item.page} target="_blank" rel="noreferrer" className="btn-ghost">
              {t('gallery.source')}
            </a>
          )}
          <button type="button" className="btn-ghost" onClick={onClose} autoFocus>
            <Icon name="close" /> {t('figure.close')}
          </button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 place-items-center" onClick={(e) => e.stopPropagation()}>
        {!src ? (
          <span className="loader-ring" aria-label={t('chapter.loading')} />
        ) : item.kind === 'figure' ? (
          <div className="h-full w-full overflow-hidden rounded-md">
            <EngineFigure id={item.machine} name={item.title} />
          </div>
        ) : item.kind === 'video' && !failed ? (
          <video src={src} controls autoPlay playsInline className="max-h-full max-w-full rounded-md bg-black" />
        ) : (
          <img src={src} alt={item.title} className="max-h-full max-w-full rounded-md object-contain" />
        )}
      </div>
    </motion.div>
  );
}
