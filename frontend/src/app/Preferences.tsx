import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { useStore } from '../store/useStore';
import { setSfxVolume } from '../audio/sfx';

/**
 * Applique les réglages de l'onglet Paramètres à tout le site :
 * thème (clair, sombre ou celui du système), animations réduites, volume des effets.
 * La scène spatiale reste toujours sombre ; seule l'interface suit le thème.
 */
export function Preferences({ children }: { children: ReactNode }) {
  const theme = useStore((s) => s.theme);
  const motion = useStore((s) => s.motion);
  const sfxVolume = useStore((s) => s.sfxVolume);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion;
  }, [motion]);

  useEffect(() => setSfxVolume(sfxVolume), [sfxVolume]);

  return <MotionConfig reducedMotion={motion === 'reduce' ? 'always' : motion === 'full' ? 'never' : 'user'}>{children}</MotionConfig>;
}
