import { useEffect } from 'react';
import { drive } from './state';

const MAP: Record<string, keyof typeof drive> = {
  ArrowUp: 'forward', KeyW: 'forward', KeyZ: 'forward',
  ArrowDown: 'back', KeyS: 'back',
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'brake',
};

/** Flèches, WASD ou ZQSD (clavier français) pour conduire ; Espace pour freiner. */
export function useKeyboardDrive(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const set = (e: KeyboardEvent, v: number) => {
      const k = MAP[e.code];
      if (!k) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      e.preventDefault();
      drive[k] = v;
    };
    const down = (e: KeyboardEvent) => set(e, 1);
    const up = (e: KeyboardEvent) => set(e, 0);
    const reset = () => Object.keys(drive).forEach((k) => (drive[k as keyof typeof drive] = 0));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', reset);
      reset();
    };
  }, [enabled]);
}
