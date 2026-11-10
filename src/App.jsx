import { useEffect, useState } from 'react'
import { isPreview, isStandalone } from './pwa.js'
import InstallGuide from './screens/InstallGuide.jsx'
import BaseCheck from './screens/BaseCheck.jsx'
import Components from './screens/Components.jsx'
import Explore from './screens/Explore.jsx'
import TabBar from './components/TabBar.jsx'
import Splash from './components/Splash.jsx'

/*
 * Aperta dall'icona (standalone) → app.
 * Aperta nel browser → guida all'installazione, salvo anteprima (?preview).
 * Dall'anteprima, Indietro del browser torna alla guida.
 * All'avvio dall'icona: splash di 2 secondi sopra l'app, che intanto carica la mappa.
 */
export default function App() {
  const [preview, setPreview] = useState(() => isPreview())
  // Splash solo all'avvio dell'app installata (non nella guida né nell'anteprima nel browser)
  const [splash, setSplash] = useState(() => isStandalone())
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
      {splash && <Splash onDone={() => setSplash(false)} />}
    </div>
  )
}

/*
 * Explore: mappa (passo 1.1). Record e Profile non sono progettati.
 * La galleria dei componenti (passo 0.3) resta raggiungibile da Profile, per le revisioni.
 */
function Prototype() {
  const [tab, setTab] = useState('explore')
  const [page, setPage] = useState(null)   // null | 'components' | 'base'

  const open = (next) => { setPage(next); window.scrollTo(0, 0) }

  // La mappa resta montata anche nelle altre tab: non si ricaricano le tile
  let content = null
  if (tab === 'record') content = <NotDesigned />
  else if (page === 'components') content = <Components onBaseCheck={() => open('base')} />
  else if (page === 'base') content = <BaseCheckPage onBack={() => open('components')} />
  else if (tab === 'profile') content = <NotDesigned onGallery={() => open('components')} />

  return (
    <>
      <div hidden={tab !== 'explore'}><Explore /></div>
      {content}
      <TabBar active={tab} onChange={(t) => { setTab(t); setPage(null) }} />
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
function NotDesigned({ onGallery }) {
  return (
    <main className="empty-state">
      <div className="empty-state__body">
        <p className="t-md">Not designed yet.</p>
        {onGallery && (
          <button type="button" className="back-link t-sm-em" onClick={onGallery}>Component gallery</button>
        )}
      </div>
    </main>
  )
}
