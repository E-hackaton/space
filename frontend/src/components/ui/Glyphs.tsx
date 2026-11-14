import { useId, type ReactNode } from 'react';

/*
 * Images de l'interface, dessinées en SVG avec un vrai modelé (lumière, ombre propre, reflet),
 * à la place des emojis. Toutes décoratives (aria-hidden) : le texte voisin porte le sens.
 */

type PlanetKind = 'moon' | 'mars' | 'earth' | 'deep-space' | 'jezero' | 'gale';

const PALETTE: Record<string, { light: string; mid: string; dark: string; rim: string }> = {
  moon: { light: '#f4f5f7', mid: '#a9adb6', dark: '#3b3e46', rim: '#cfd8ff' },
  mars: { light: '#f3b07a', mid: '#c4552e', dark: '#4a160b', rim: '#ff9a6a' },
  earth: { light: '#9fe0ff', mid: '#2a7fd6', dark: '#0a2350', rim: '#7cc6ff' },
  'deep-space': { light: '#cdb8ff', mid: '#5b3fbe', dark: '#120a33', rim: '#9b7bff' },
};

/** Une planète en volume : sphère éclairée de côté, terminateur doux, relief et halo. */
export function PlanetGlyph({ body, size = 40, className = '' }: { body: PlanetKind; size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const kind = body === 'jezero' || body === 'gale' ? 'mars' : body;
  const c = PALETTE[kind];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`b${id}`} cx="34%" cy="30%" r="75%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="45%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
        <radialGradient id={`n${id}`} cx="85%" cy="80%" r="70%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#000" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`h${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor={c.rim} stopOpacity="0" />
          <stop offset="88%" stopColor={c.rim} stopOpacity="0.55" />
          <stop offset="100%" stopColor={c.rim} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <circle cx="50" cy="50" r="38" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="49" fill={`url(#h${id})`} />
      <circle cx="50" cy="50" r="38" fill={`url(#b${id})`} />
      <g clipPath={`url(#c${id})`} opacity="0.55">
        {kind === 'moon' && (
          <>
            <ellipse cx="38" cy="40" rx="9" ry="7" fill="#7d818b" />
            <ellipse cx="60" cy="58" rx="12" ry="9" fill="#868a93" />
            <circle cx="45" cy="66" r="4" fill="#6f737c" />
            <circle cx="66" cy="34" r="3" fill="#767a83" />
          </>
        )}
        {kind === 'mars' && (
          <>
            <path d="M12 46 C30 40 44 52 62 46 S84 40 92 46 L92 56 C74 52 60 62 42 56 S20 54 12 58Z" fill="#7a2a14" />
            <ellipse cx="50" cy="15" rx="18" ry="5" fill="#fff4ea" opacity="0.9" />
            <circle cx="66" cy="66" r="4" fill="#8e3a1e" />
          </>
        )}
        {kind === 'earth' && (
          <>
            <path d="M22 36 C30 26 44 28 46 38 S38 52 30 54 S18 46 22 36Z" fill="#3fa45b" />
            <path d="M56 50 C64 44 76 48 76 58 S66 74 58 70 S50 56 56 50Z" fill="#3fa45b" />
            <path d="M18 30 C40 24 60 26 84 22" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
          </>
        )}
        {kind === 'deep-space' && (
          <>
            <circle cx="36" cy="38" r="2" fill="#fff" />
            <circle cx="62" cy="56" r="1.4" fill="#e9e1ff" />
            <circle cx="48" cy="70" r="1.6" fill="#bfe3ff" />
            <path d="M14 60 C34 48 64 52 90 36" stroke="#d8c8ff" strokeWidth="5" fill="none" opacity="0.35" strokeLinecap="round" />
          </>
        )}
      </g>
      <circle cx="50" cy="50" r="38" fill={`url(#n${id})`} />
      <ellipse cx="36" cy="30" rx="10" ry="6" fill="#fff" opacity="0.28" transform="rotate(-30 36 30)" />
    </svg>
  );
}

/** Médaille en relief (badge gagné au quiz). */
export function MedalGlyph({ size = 22, earned = true }: { size?: number; earned?: boolean }) {
  const id = useId().replace(/:/g, '');
  const gold = earned ? ['#fff3c4', '#e6b13c', '#7a5212'] : ['#e6e9ef', '#8f96a3', '#3b404a'];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <radialGradient id={`m${id}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={gold[0]} />
          <stop offset="50%" stopColor={gold[1]} />
          <stop offset="100%" stopColor={gold[2]} />
        </radialGradient>
      </defs>
      <path d="M13 2 L20 14 L27 2" fill="none" stroke={earned ? '#4BE08A' : '#5b6170'} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="20" cy="25" r="12" fill={`url(#m${id})`} />
      <circle cx="20" cy="25" r="8.5" fill="none" stroke={gold[2]} strokeOpacity="0.5" strokeWidth="1.2" />
      <path d="M20 19.5 L21.7 23 L25.5 23.4 L22.6 26 L23.4 29.8 L20 27.9 L16.6 29.8 L17.4 26 L14.5 23.4 L18.3 23Z" fill={gold[0]} opacity="0.9" />
      <ellipse cx="15.5" cy="20.5" rx="3.5" ry="2" fill="#fff" opacity="0.45" transform="rotate(-35 15.5 20.5)" />
    </svg>
  );
}

const PATHS: Record<string, ReactNode> = {
  sound: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M17 9l5 6M22 9l-5 6" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  book: <path d="M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5V19c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5zM12 6v13.5" />,
  sources: <path d="M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6" />,
  bolt: <path d="M13 2L5 14h6l-1 8 8-12h-6z" fill="currentColor" />,
  map: <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" />,
  play: <path d="M7 5l12 7-12 7z" fill="currentColor" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />,
  wind: <path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7" />,
  lock: <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
  keys: <path d="M3 7h18v10H3zM6 10h1M9 10h1M12 10h1M15 10h1M18 10h0M7 14h10" />,
};

/** Icône au trait (même épaisseur partout), héritant de la couleur du texte. */
export function Icon({ name, size = 18, className = '' }: { name: keyof typeof PATHS; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`inline-block shrink-0 align-[-0.2em] ${className}`} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
