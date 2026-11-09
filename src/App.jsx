import { useEffect, useState } from 'react'
import { isPreview, isStandalone } from './pwa.js'
import InstallGuide from './screens/InstallGuide.jsx'
import BaseCheck from './screens/BaseCheck.jsx'

/*
 * Aperta dall'icona (standalone) → app.
 * Aperta nel browser → guida all'installazione, salvo anteprima (?preview).
 * Dall'anteprima, Indietro del browser torna alla guida.
 */
export default function App() {
  const [preview, setPreview] = useState(() => isPreview())
  const showApp = isStandalone() || preview

  useEffect(() => {
    const sync = () => {
      setPreview(isPreview())
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  return (
    <div className="app">
      {showApp ? <BaseCheck /> : <InstallGuide onPreview={() => setPreview(true)} />}
    </div>
  )
}
