import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { player } from '../../world/Player';
import type { Site } from '../../world/expeditionLayout';

/** Boussole du pilote manuel : la flèche montre la direction de la machine visée, vue du véhicule. */
export function Compass({ target }: { target: Site }) {
  const { t } = useTranslation();
  const arrow = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const want = Math.atan2(-(target.x - player.x), -(target.z - player.z));
      const b = Math.atan2(Math.sin(want - player.heading), Math.cos(want - player.heading));
      if (arrow.current) arrow.current.style.transform = `rotate(${(-b * 180) / Math.PI}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <div className="compass" role="status" aria-label={t('expedition.heading', { name: target.machine.name })}>
      <span className="compass-dial" aria-hidden="true">
        <span ref={arrow} className="compass-arrow">▲</span>
      </span>
      <span className="block truncate font-display text-lg font-extrabold uppercase leading-none">{target.machine.name}</span>
    </div>
  );
}
