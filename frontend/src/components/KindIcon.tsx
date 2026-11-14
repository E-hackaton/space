import {
  Crosshair,
  Drone,
  Footprints,
  Jeep,
  Planet,
  Rocket,
  RocketLaunch,
  Sparkle,
  type Icon,
  type IconProps,
} from '@phosphor-icons/react'

import type { EquipmentKind } from '../types/api'

/** Une icône par type d'engin (bibliothèque Phosphor, recommandée par la charte Space Apps). */
const ICONS: Record<EquipmentKind, Icon> = {
  lander: Rocket,
  descent_stage: Footprints,
  rover: Jeep,
  helicopter: Drone,
  instrument: Crosshair,
  orbiter: Planet,
  probe: RocketLaunch,
  telescope: Sparkle,
}

interface KindIconProps extends IconProps {
  kind: EquipmentKind
}

/** Icône décorative : le type est toujours écrit en texte à côté. */
export function KindIcon({ kind, ...props }: KindIconProps) {
  const IconComponent = ICONS[kind]
  return <IconComponent aria-hidden="true" {...props} />
}
