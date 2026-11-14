import { Link } from 'react-router-dom'

import { SankofaSays } from '../components/SankofaSays'
import { useI18n } from '../i18n/useI18n'
import ui from '../styles/ui.module.css'

export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <>
      <h1>{t.notFound.title}</h1>
      <SankofaSays>
        <p>{t.notFound.text}</p>
      </SankofaSays>
      <Link to="/" className={ui.button}>
        {t.notFound.back}
      </Link>
    </>
  )
}
