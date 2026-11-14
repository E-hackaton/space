import { Link } from 'react-router-dom'

import { SankofaSays } from '../components/SankofaSays'
import ui from '../styles/ui.module.css'

export function NotFoundPage() {
  return (
    <>
      <h1>Perdu dans l'espace</h1>
      <SankofaSays>
        <p>Cette page n'existe pas… ou alors elle dérive très loin, comme Pioneer 10 !</p>
      </SankofaSays>
      <Link to="/" className={ui.button}>
        Retour à la base
      </Link>
    </>
  )
}
