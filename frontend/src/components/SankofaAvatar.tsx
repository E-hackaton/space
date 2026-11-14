interface SankofaAvatarProps {
  size?: number
  /** Texte alternatif. Laisser vide si l'avatar est décoratif (un nom est déjà écrit à côté). */
  title?: string
}

/**
 * Sankofa, le robot-guide. C'est un personnage original : il ne reprend aucun élément de marque NASA.
 *
 * Sur sa poitrine, un cœur à deux spirales s'inspire du symbole Adinkra Sankofa
 * (« retourne chercher ce que tu as laissé derrière toi »).
 */
export function SankofaAvatar({ size = 96, title }: SankofaAvatarProps) {
  const decorative = !title

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={title}
    >
      {/* Antenne */}
      <line x1="60" y1="8" x2="60" y2="24" stroke="#EAFE07" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="8" r="6" fill="#EAFE07" />
      {/* Tête */}
      <rect x="22" y="22" width="76" height="52" rx="22" fill="#2E96F5" />
      <rect x="32" y="33" width="56" height="30" rx="15" fill="#07173F" />
      {/* Yeux */}
      <circle cx="49" cy="48" r="6" fill="#EAFE07" />
      <circle cx="71" cy="48" r="6" fill="#EAFE07" />
      {/* Corps */}
      <rect x="32" y="78" width="56" height="34" rx="14" fill="#0960E1" />
      {/* Cœur Sankofa stylisé : deux spirales qui se rejoignent en pointe */}
      <path
        d="M60 104 L48 92 C42 86 46 80 52 82 C56 83 56 88 52 88 M60 104 L72 92 C78 86 74 80 68 82 C64 83 64 88 68 88"
        fill="none"
        stroke="#EAFE07"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
