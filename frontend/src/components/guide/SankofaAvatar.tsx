import { motion, useReducedMotion } from 'motion/react';

/**
 * Sankofa, le robot guide : un personnage original (petite sonde ronde à un œil, antenne lumineuse).
 * Son nom vient du symbole akan Sankofa : « retourne chercher ce qui a été laissé derrière ».
 */
export function SankofaAvatar({ size = 96, talking = false }: { size?: number; talking?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="drop-shadow-[0_6px_14px_rgba(75,224,138,0.25)]"
    >
      {/* Antenne */}
      <line x1="60" y1="22" x2="60" y2="8" stroke="#c9ced6" strokeWidth="3" strokeLinecap="round" />
      <motion.circle
        cx="60"
        cy="7"
        r="5"
        fill="#4BE08A"
        animate={reduced ? undefined : { opacity: [1, 0.35, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      {/* Petits panneaux solaires */}
      <rect x="2" y="52" width="20" height="26" rx="3" fill="#1d2f5c" stroke="#5b7bd5" strokeWidth="1.5" />
      <rect x="98" y="52" width="20" height="26" rx="3" fill="#1d2f5c" stroke="#5b7bd5" strokeWidth="1.5" />
      <line x1="22" y1="65" x2="28" y2="65" stroke="#c9ced6" strokeWidth="3" />
      <line x1="92" y1="65" x2="98" y2="65" stroke="#c9ced6" strokeWidth="3" />
      {/* Corps */}
      <circle cx="60" cy="64" r="40" fill="#e8ecf2" />
      <circle cx="60" cy="64" r="40" fill="url(#sankofa-shade)" />
      <defs>
        <radialGradient id="sankofa-shade" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8a93a3" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      {/* Visière */}
      <rect x="30" y="44" width="60" height="38" rx="19" fill="#0b1430" />
      {/* Œil (cligne) */}
      <motion.ellipse
        cx="60"
        cy="63"
        rx="11"
        ry="11"
        fill="#4BE08A"
        animate={reduced ? undefined : { ry: [11, 11, 1.5, 11] }}
        transition={{ duration: 4, times: [0, 0.9, 0.95, 1], repeat: Infinity }}
      />
      <circle cx="64" cy="59" r="3.5" fill="#d9ffe9" />
      {/* Bouche lumineuse quand Sankofa parle */}
      <motion.rect
        x="50"
        y="88"
        width="20"
        height="4"
        rx="2"
        fill="#4BE08A"
        animate={talking && !reduced ? { scaleX: [1, 0.4, 1.1, 0.6, 1] } : { scaleX: 1 }}
        transition={{ duration: 0.6, repeat: talking ? Infinity : 0 }}
        style={{ transformOrigin: '60px 90px' }}
      />
    </motion.svg>
  );
}
