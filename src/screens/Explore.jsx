import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from '../components/map/MapView.jsx'
import Searchbar from '../components/Searchbar.jsx'
import RouteToggle from '../components/RouteToggle.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { RoundButton } from '../components/Button.jsx'
import { ROUTES, TRACKS } from '../data/garda.js'
import './Explore.css'

/*
 * Explore, mappa (passo 1.1). Atterraggio di default dell'app.
 * Dall'alto: searchbar, toggle Routes/Tracks, pulsanti tondi (tipo di mappa,
 * posizione), overlay in stato 1 sopra la tab bar.
 * Overlay a 3 stati e carosello: passo 1.2. Ricerca e filtri: passo 1.4.
 */
export default function Explore() {
  const [mode, setMode] = useState('routes')
  const [selectedId, setSelectedId] = useState(null)
  const [bounds, setBounds] = useState(null)
  const [styleKind, setStyleKind] = useState('topo')
  const [error, setError] = useState(null)
  const [errorKey, setErrorKey] = useState(0)
  const insets = useInsets()
  const mapRef = useRef(null)

  const items = mode === 'routes' ? ROUTES : TRACKS

  // Conteggi dell'area visibile: stesso numero nel toggle e nell'overlay (contesto §7.3)
  const counts = useMemo(() => {
    const inView = (list) => (bounds ? list.filter((it) => bounds.contains(it.pin)).length : list.length)
    return { routes: inView(ROUTES), tracks: inView(TRACKS) }
  }, [bounds])

  const changeMode = useCallback((next) => {
    setSelectedId(null)
    setMode(next)
  }, [])

  // Spazio libero per inquadrare un percorso: sotto il toggle, sopra l'overlay
  const padding = useMemo(() => ({
    top: insets.safeTop + 156,
    bottom: insets.tabH + 86 + 32,
    left: 72,
    right: 32,
  }), [insets])

  const count = counts[mode]
  const unit = mode === 'routes' ? (count === 1 ? 'Route' : 'Routes') : (count === 1 ? 'Track' : 'Tracks')
  const title = count === 0 ? `No ${mode} in this area` : `${count} ${unit}`

  return (
    <div className="explore">
      {error ? (
        <MapError kind={error} onRetry={() => { setError(null); setErrorKey((k) => k + 1) }} />
      ) : (
        <MapView
          key={errorKey}
          ref={mapRef}
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onViewChange={setBounds}
          styleKind={styleKind}
          padding={padding}
          onError={setError}
        />
      )}

      <div className="explore__veil" aria-hidden="true" />

      <div className="explore__top">
        <Searchbar placeholder={mode === 'routes' ? 'Search Routes or locations' : 'Search Tracks or locations'} />
        <RouteToggle value={mode} onChange={changeMode} counts={counts} />
        <div className="explore__buttons">
          <RoundButton
            icon="layers"
            label={styleKind === 'topo' ? 'Show satellite map' : 'Show topographic map'}
            aria-pressed={styleKind === 'satellite'}
            onClick={() => setStyleKind((k) => (k === 'topo' ? 'satellite' : 'topo'))}
          />
          <RoundButton icon="target" label="Show my position" onClick={() => mapRef.current?.recenter()} />
        </div>
      </div>

      <BottomSheet
        snaps={[86]}
        snap={0}
        bottom={insets.tabH}
        className="explore__overlay"
        label={title}
        header={<p className="t-display explore__overlay-title" aria-live="polite">{title}</p>}
      />
    </div>
  )
}

function MapError({ kind, onRetry }) {
  return (
    <div className="explore__error">
      <p className="t-md">
        {kind === 'key' ? 'The map is not available right now.' : 'Can’t load the map. Check your connection.'}
      </p>
      <button type="button" className="explore__retry t-md-em" onClick={onRetry}>Try again</button>
    </div>
  )
}

// Altezza della tab bar e margine sicuro in alto, misurati
function useInsets() {
  const [insets, setInsets] = useState({ tabH: 80, safeTop: 0 })
  useEffect(() => {
    const measure = () => {
      const probe = document.createElement('div')
      probe.style.cssText = 'position:absolute;visibility:hidden;padding-top:var(--safe-top)'
      document.body.appendChild(probe)
      const safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0
      probe.remove()
      const tabH = document.querySelector('.tab-bar')?.offsetHeight ?? 80
      setInsets((prev) => (prev.tabH === tabH && prev.safeTop === safeTop ? prev : { tabH, safeTop }))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return insets
}
