import { ApiError } from '../api/client'
import { SankofaSays } from './SankofaSays'

/** Message de chargement, annoncé aux lecteurs d'écran. */
export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <p role="status" aria-live="polite">
      {label}
    </p>
  )
}

/** Message d'erreur dit par Sankofa, avec une explication adaptée à la cause. */
export function LoadError({ error }: { error: Error }) {
  const notFound = error instanceof ApiError && error.status === 404

  return (
    <div role="alert">
      <SankofaSays>
        {notFound ? (
          <p>Je ne trouve pas ce héros dans mes archives. Il s'est peut-être perdu dans l'espace !</p>
        ) : (
          <p>
            Oups, je n'arrive pas à joindre ma base de données. Vérifie ta connexion et recharge la page.
          </p>
        )}
      </SankofaSays>
    </div>
  )
}
