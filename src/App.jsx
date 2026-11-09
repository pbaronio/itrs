import { useState } from 'react'
import { isPreview, isStandalone } from './pwa.js'
import InstallGuide from './screens/InstallGuide.jsx'
import BaseCheck from './screens/BaseCheck.jsx'

/*
 * Aperta dall'icona (standalone) → app.
 * Aperta nel browser → guida all'installazione, salvo anteprima (?preview).
 */
export default function App() {
  const [preview, setPreview] = useState(() => isPreview())
  const showApp = isStandalone() || preview

  return (
    <div className="app">
      {showApp ? <BaseCheck /> : <InstallGuide onPreview={() => setPreview(true)} />}
    </div>
  )
}
