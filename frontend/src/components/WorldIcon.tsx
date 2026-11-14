import { MoonStars, Planet, ShootingStar, type Icon, type IconProps } from '@phosphor-icons/react'

import type { BodySlug } from '../types/api'

const ICONS: Record<BodySlug, Icon> = {
  moon: MoonStars,
  mars: Planet,
  elsewhere: ShootingStar,
}

interface WorldIconProps extends IconProps {
  world: BodySlug
}

/** Icône d'un monde, décorative : le nom du monde est toujours écrit à côté. */
export function WorldIcon({ world, ...props }: WorldIconProps) {
  const IconComponent = ICONS[world]
  return <IconComponent aria-hidden="true" weight="duotone" {...props} />
}
