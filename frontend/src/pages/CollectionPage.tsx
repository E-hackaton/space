import { Medal } from '@phosphor-icons/react'

import { fetchEquipmentList } from '../api/heroes'
import { CollectibleCard } from '../components/CollectibleCard'
import { SankofaSays } from '../components/SankofaSays'
import { LoadError, Loading } from '../components/StatusMessage'
import { rankFor } from '../content/ranks'
import { useApi } from '../hooks/useApi'
import { useCollection } from '../hooks/useCollection'
import type { Messages } from '../i18n/messages/fr'
import { useI18n } from '../i18n/useI18n'
import ui from '../styles/ui.module.css'
import styles from './CollectionPage.module.css'

export function CollectionPage() {
  const { t } = useI18n()
  const equipment = useApi('equipment:all', (signal) => fetchEquipmentList(undefined, signal))
  const { has } = useCollection()

  if (equipment.status === 'loading') return <Loading />
  if (equipment.status === 'error') return <LoadError error={equipment.error} />

  // On ne compte que les cartes de héros qui existent encore dans l'API.
  const unlockedCount = equipment.data.filter((item) => has(item.slug)).length
  const total = equipment.data.length
  const { current, next } = rankFor(unlockedCount, total)
  const percent = total === 0 ? 0 : Math.round((unlockedCount / total) * 100)

  return (
    <>
      <h1>{t.collection.title}</h1>

      <section className={styles.rank} aria-labelledby="grade">
        <Medal size={48} weight="duotone" aria-hidden="true" className={styles.medal} />
        <div className={styles.rankText}>
          <p className={ui.eyebrow}>{t.collection.rankEyebrow}</p>
          <h2 id="grade">{t.collection.ranks[current]}</h2>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuenow={unlockedCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={t.collection.cardsLabel}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className={ui.muted}>
            {t.collection.cards(unlockedCount, total)}
            {next !== null && t.collection.nextRank(t.collection.ranks[next] ?? '')}
          </p>
        </div>
      </section>

      <SankofaSays>
        <p>{collectionMessage(unlockedCount, total, t)}</p>
      </SankofaSays>

      <ul className={ui.grid}>
        {equipment.data.map((item) => (
          <li key={item.slug} className="reveal">
            <CollectibleCard equipment={item} unlocked={has(item.slug)} />
          </li>
        ))}
      </ul>
    </>
  )
}

function collectionMessage(unlocked: number, total: number, t: Messages): string {
  if (unlocked === 0) return t.collection.messageNone(total)
  if (unlocked === total) return t.collection.messageAll(total)
  return t.collection.messageSome(unlocked, total)
}
