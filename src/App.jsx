import { useEffect, useState } from 'react'
import { isPreview, isStandalone } from './pwa.js'
import InstallGuide from './screens/InstallGuide.jsx'
import BaseCheck from './screens/BaseCheck.jsx'
import Components from './screens/Components.jsx'
import TabBar from './components/TabBar.jsx'

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
      {showApp ? <Prototype /> : <InstallGuide onPreview={() => setPreview(true)} />}
    </div>
  )
}

/* Passo 0.3: galleria dei componenti nella tab Explore */
function Prototype() {
  const [tab, setTab] = useState('explore')
  const [baseCheck, setBaseCheck] = useState(false)

  return (
    <>
      {tab === 'explore' && (baseCheck
        ? <BaseCheckPage onBack={() => setBaseCheck(false)} />
        : <Components onBaseCheck={() => { setBaseCheck(true); window.scrollTo(0, 0) }} />)}
      {tab !== 'explore' && <NotDesigned />}
      <TabBar active={tab} onChange={setTab} />
    </>
  )
}

function BaseCheckPage({ onBack }) {
  return (
    <div className="page-with-tabs">
      <button type="button" className="back-link t-sm-em" onClick={onBack}>← Components</button>
      <BaseCheck />
    </div>
  )
}

// Record e Profile non sono progettati (contesto §7, punto 7)
function NotDesigned() {
  return (
    <main className="empty-state">
      <p className="t-md">Not designed yet.</p>
    </main>
  )
}
