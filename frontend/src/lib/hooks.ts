import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  // Le réglage « Animations » des Paramètres l'emporte sur celui du système.
  const motion = useStore((s) => s.motion);
  return motion === 'reduce' ? true : motion === 'full' ? false : reduced;
}
