import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Sankofa, le robot guide : un personnage original (petite sonde ronde à un œil, antenne lumineuse).
 * Son nom vient du symbole akan Sankofa : « retourne chercher ce qui a été laissé derrière ».
 * Dessiné en SVG avec un modelé 3D : lumière en haut à gauche, reflet du ciel, ombre au sol.
 */
export function SankofaAvatar({ size = 96, talking = false }: { size?: number; talking?: boolean }) {
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const u = (name: string) => `url(#${name}${id})`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 130" aria-hidden="true" className="overflow-visible">
      <defs>
        <radialGradient id={`body${id}`} cx="36%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor="#e3e7ee" />
          <stop offset="78%" stopColor="#8e97a8" />
          <stop offset="100%" stopColor="#4a5266" />
        </radialGradient>
        <radialGradient id={`rim${id}`} cx="78%" cy="82%" r="55%">
          <stop offset="55%" stopColor="#6fb4ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#6fb4ff" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`visor${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2a55" />
          <stop offset="55%" stopColor="#070d22" />
          <stop offset="100%" stopColor="#0f1d3d" />
        </linearGradient>
        <radialGradient id={`eye${id}`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#eafff3" />
          <stop offset="35%" stopColor="#7ef2ae" />
          <stop offset="100%" stopColor="#1f9a57" />
        </radialGradient>
        <radialGradient id={`glow${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4BE08A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#4BE08A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`metal${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6d7586" />
          <stop offset="45%" stopColor="#f2f4f8" />
          <stop offset="100%" stopColor="#5c6475" />
        </linearGradient>
        <linearGradient id={`panel${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3d63c9" />
          <stop offset="60%" stopColor="#1a2f6e" />
          <stop offset="100%" stopColor="#0d1a40" />
        </linearGradient>
        <radialGradient id={`shadow${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`bodyclip${id}`}>
          <circle cx="60" cy="66" r="36" />
        </clipPath>
      </defs>

      {/* Ombre au sol : elle rétrécit quand le robot monte */}
      <motion.ellipse
        cx="60"
        cy="121"
        rx="30"
        ry="5"
        fill={u('shadow')}
        animate={reduced ? undefined : { rx: [30, 24, 30], opacity: [1, 0.7, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.g animate={reduced ? undefined : { y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        {/* Panneaux solaires en perspective, derrière le corps */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={s < 0 ? 'M28 62 L8 54 L4 80 L26 76 Z' : 'M92 62 L112 54 L116 80 L94 76 Z'} fill={u('panel')} stroke="#9fb6ff" strokeOpacity="0.5" strokeWidth="0.8" />
            <path d={s < 0 ? 'M17 58 L14 78 M6 67 L27 69' : 'M103 58 L106 78 M114 67 L93 69'} stroke="#9fb6ff" strokeOpacity="0.35" strokeWidth="0.7" />
            <path d={s < 0 ? 'M9 55 L7 64' : 'M111 55 L113 64'} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        ))}

        {/* Antenne métallique et ampoule */}
        <rect x="58.5" y="14" width="3" height="18" rx="1.5" fill={u('metal')} />
        <motion.circle cx="60" cy="12" r="11" fill={u('glow')} animate={reduced ? undefined : { opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
        <circle cx="60" cy="12" r="5" fill={u('eye')} />
        <circle cx="58.3" cy="10.4" r="1.6" fill="#fff" opacity="0.9" />

        {/* Corps sphérique */}
        <circle cx="60" cy="66" r="36" fill={u('body')} />
        <circle cx="60" cy="66" r="36" fill={u('rim')} />
        {/* Joint équatorial, qui suit la courbure */}
        <g clipPath={u('bodyclip')}>
          <path d="M22 84 Q60 98 98 84" stroke="#5e6779" strokeOpacity="0.55" strokeWidth="1.4" fill="none" />
          <path d="M22 86 Q60 100 98 86" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" fill="none" />
        </g>

        {/* Visière en verre bombé, avec ombre de contact */}
        <rect x="31" y="48" width="58" height="34" rx="17" fill="#2b3346" opacity="0.35" transform="translate(1.5 2)" />
        <rect x="31" y="48" width="58" height="34" rx="17" fill={u('visor')} />
        <rect x="31" y="48" width="58" height="34" rx="17" fill="none" stroke="#c9d3e6" strokeOpacity="0.55" strokeWidth="1.2" />

        {/* Œil : lueur, iris, pupille ; il cligne */}
        <circle cx="60" cy="65" r="16" fill={u('glow')} />
        <motion.ellipse
          cx="60"
          cy="65"
          rx="10"
          ry="10"
          fill={u('eye')}
          animate={reduced ? undefined : { ry: [10, 10, 1.2, 10] }}
          transition={{ duration: 4.5, times: [0, 0.9, 0.95, 1], repeat: Infinity }}
        />
        <circle cx="60" cy="65" r="3.6" fill="#0b4a2a" opacity="0.8" />
        <circle cx="63.5" cy="61.5" r="2.4" fill="#ffffff" opacity="0.95" />

        {/* Reflet en arc sur la visière */}
        <path d="M38 56 Q50 50 66 51" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* Haut-parleur : s'allume quand Sankofa parle */}
        <g transform="translate(60 92)">
          {[-6, -2, 2, 6].map((x, i) => (
            <motion.rect
              key={x}
              x={x - 1}
              y={-3}
              width="2"
              height="6"
              rx="1"
              fill={talking ? '#4BE08A' : '#7a8396'}
              animate={talking && !reduced ? { scaleY: [1, 0.3 + (i % 2) * 0.5, 1.2, 0.5, 1] } : { scaleY: 0.6 }}
              transition={{ duration: 0.5 + i * 0.07, repeat: talking ? Infinity : 0 }}
              style={{ transformOrigin: `${x}px 0px` }}
            />
          ))}
        </g>

        {/* Reflet spéculaire principal */}
        <ellipse cx="44" cy="42" rx="9" ry="5" fill="#ffffff" opacity="0.75" transform="rotate(-35 44 42)" />
      </motion.g>
    </svg>
  );
}
