import { Medal } from '@phosphor-icons/react'

import { fetchEquipmentList } from '../api/heroes'
import { CollectibleCard } from '../components/CollectibleCard'
import { SankofaSays } from '../components/SankofaSays'
import { LoadError, Loading } from '../components/StatusMessage'
import { rankFor } from '../content/ranks'
import { useApi } from '../hooks/useApi'
import { useCollection } from '../hooks/useCollection'
import ui from '../styles/ui.module.css'
import styles from './CollectionPage.module.css'

export function CollectionPage() {
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
      <h1>Ma collection</h1>

      <section className={styles.rank} aria-labelledby="grade">
        <Medal size={48} weight="duotone" aria-hidden="true" className={styles.medal} />
        <div className={styles.rankText}>
          <p className={ui.eyebrow}>Ton grade</p>
          <h2 id="grade">{current.title}</h2>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuenow={unlockedCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Cartes gagnées"
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className={ui.muted}>
            {unlockedCount} carte{unlockedCount > 1 ? 's' : ''} sur {total}
            {next && ` · Prochain grade : ${next.title}`}
          </p>
        </div>
      </section>

      <SankofaSays>
        <p>{collectionMessage(unlockedCount, total)}</p>
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

function collectionMessage(unlocked: number, total: number): string {
  if (unlocked === 0) return `Tu n'as encore aucune carte. Il y en a ${total} à gagner : lis l'histoire d'un héros et réussis son défi !`
  if (unlocked === total) return `Incroyable : tu as les ${total} cartes ! Grâce à toi, aucun de ces héros ne sera oublié.`
  return `Tu as ${unlocked} carte${unlocked > 1 ? 's' : ''} sur ${total}. Continue l'exploration !`
}
