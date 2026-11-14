import { useEffect, useRef } from 'react';
import { player, worldObstacles } from './Player';
import { drive } from './state';

/*
 * Pilote automatique du véhicule : il agit sur les mêmes commandes que le clavier.
 * Il vise la cible, contourne les rochers qu'il voit devant lui et recule s'il se coince.
 */

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export function resetDrive() {
  Object.assign(drive, { forward: 0, back: 0, left: 0, right: 0, brake: 0 });
}

interface Options {
  enabled: boolean;
  /** Cible courante (lue à chaque image), ou null pour s'arrêter. */
  target: () => { x: number; z: number } | null;
  /** Distance d'arrivée (m). */
  arrive?: number;
  onArrive?: () => void;
}

export function useAutopilot({ enabled, target, arrive = 9, onArrive }: Options) {
  const cb = useRef(onArrive);
  cb.current = onArrive;
  const getTarget = useRef(target);
  getTarget.current = target;

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let reverseUntil = 0;
    let reverseSide = 1;
    let arrived = false;
    let stuckSince = 0;
    const tick = () => {
      const now = performance.now();
      const t = getTarget.current();
      resetDrive();
      if (t && player.active) {
        const dx = t.x - player.x;
        const dz = t.z - player.z;
        const dist = Math.hypot(dx, dz);
        if (dist < arrive) {
          drive.brake = 1;
          if (!arrived) {
            arrived = true;
            cb.current?.();
          }
        } else {
          arrived = false;
          // Coincé (choc, ou presque immobile alors qu'il accélère) : marche arrière en braquant.
          if (player.bump > 0.35 || (Math.abs(player.speed) < 0.6 && stuckSince && now - stuckSince > 1200)) {
            reverseUntil = now + 900;
            reverseSide = Math.random() < 0.5 ? 1 : -1;
            stuckSince = 0;
          }
          if (now < reverseUntil) {
            drive.back = 1;
            if (reverseSide > 0) drive.left = 1;
            else drive.right = 1;
          } else {
            if (Math.abs(player.speed) < 0.6) stuckSince ||= now;
            else stuckSince = 0;
            // Cap voulu (l'avant du véhicule est vers −z : cap = atan2(−dx, −dz)).
            let want = Math.atan2(-dx, -dz);
            // Évitement : le rocher le plus menaçant devant nous dévie le cap.
            const fx = -Math.sin(player.heading);
            const fz = -Math.cos(player.heading);
            let push = 0;
            for (const o of worldObstacles.list) {
              const ox = o.x - player.x;
              const oz = o.z - player.z;
              const ahead = ox * fx + oz * fz;
              if (ahead < 0 || ahead > 14 || ahead > dist) continue;
              const side = ox * -fz + oz * fx; // > 0 : l'obstacle est à droite
              const clear = o.r + 2.6;
              if (Math.abs(side) < clear) push += (Math.sign(side) || 1) * (1 - ahead / 14) * (clear - Math.abs(side)) * 0.35;
            }
            want += push;
            const diff = wrap(want - player.heading);
            if (diff > 0.06) drive.left = 1;
            else if (diff < -0.06) drive.right = 1;
            // On ralentit dans les virages serrés et à l'approche.
            const slow = Math.abs(diff) > 1.1 || dist < arrive * 2.5;
            drive.forward = slow && Math.abs(player.speed) > 7 ? 0 : 1;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      resetDrive();
    };
  }, [enabled, arrive]);
}
