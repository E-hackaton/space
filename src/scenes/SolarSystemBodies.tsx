import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { DeepSpace, Moon, Planet, Sun } from '../components/3d/Bodies';
import type { BodyId } from '../lib/solarSystem';

interface Props {
  animate: boolean;
  showLabels?: boolean;
  selected?: BodyId | null;
  onSelect?: (id: BodyId) => void;
  /** Astres dont la rotation est figée. */
  frozen?: BodyId[];
  /** La Lune reste sur son orbite (sinon elle se place en phase « vitrine »). */
  moonOrbiting?: boolean;
  /** Astres masqués. */
  hidden?: BodyId[];
}

export function SolarSystemBodies({ animate, showLabels = true, selected, onSelect, frozen = [], moonOrbiting = true, hidden = [] }: Props) {
  const { t } = useTranslation();
  const common = (id: BodyId) => ({
    animate,
    frozen: frozen.includes(id),
    hidden: hidden.includes(id),
    label: showLabels ? t(`bodies.${id}.name`) : undefined,
    selected: selected === id,
    onSelect,
  });
  return (
    <>
      <Sun />
      <Suspense fallback={null}>
        <Planet id="earth" {...common('earth')} />
        <Moon {...common('moon')} orbiting={moonOrbiting} />
      </Suspense>
      {/* Les autres astres se chargent ensuite, sans bloquer la Terre et la Lune. */}
      <Suspense fallback={null}>
        <Planet id="mars" {...common('mars')} />
      </Suspense>
      <Suspense fallback={null}>
        <Planet id="mercury" {...common('mercury')} />
        <Planet id="venus" {...common('venus')} />
        <Planet id="jupiter" {...common('jupiter')} />
        <Planet id="saturn" {...common('saturn')} />
        <DeepSpace {...common('deep-space')} />
      </Suspense>
    </>
  );
}
