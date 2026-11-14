import { ApiError } from '../api/client'
import { useI18n } from '../i18n/useI18n'
import { SankofaSays } from './SankofaSays'

/** Message de chargement, annoncé aux lecteurs d'écran. */
export function Loading({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <p role="status" aria-live="polite">
      {label ?? t.common.loading}
    </p>
  )
}

/** Message d'erreur dit par Sankofa, avec une explication adaptée à la cause. */
export function LoadError({ error }: { error: Error }) {
  const { t } = useI18n()
  const notFound = error instanceof ApiError && error.status === 404

  return (
    <div role="alert">
      <SankofaSays>
        <p>{notFound ? t.errors.heroNotFound : t.errors.network}</p>
      </SankofaSays>
    </div>
  )
}
