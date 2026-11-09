import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from '../components/map/MapView.jsx'
import Searchbar from '../components/Searchbar.jsx'
import RouteToggle from '../components/RouteToggle.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { RoundButton, FabMap } from '../components/Button.jsx'
import { RouteCard, ListingCard } from '../components/Cards.jsx'
import { ROUTES, TRACKS } from '../data/garda.js'
import './Explore.css'

/*
 * Explore: mappa e overlay a 3 stati (passi 1.1 e 1.2).
 * - Stato 1 (86): handle e conteggio.
 * - Stato 2 (226): carosello delle route/track dell'area visibile; scorrendo, la mappa segue la card.
 * - Stato 3: listing a tutta pagina; il FAB Map torna allo stato di prima.
 * Tap su un pin: percorso sulla mappa e overlay in stato 2 con la sua card.
 * Ricerca e filtri: passo 1.4.
 */
const SNAP_PEEK = 86
const SNAP_HALF = 226
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Explore() {
  const [mode, setMode] = useState('routes')
  const [selectedId, setSelectedId] = useState(null)
  const [bounds, setBounds] = useState(null)
  const [snap, setSnap] = useState(0)
  const [frozen, setFrozen] = useState(null)       // elenco fermo mentre un percorso è selezionato
  const [styleKind, setStyleKind] = useState('topo')
  const [error, setError] = useState(null)
  const [errorKey, setErrorKey] = useState(0)
  const insets = useInsets()
  const mapRef = useRef(null)
  const prevSnap = useRef(0)

  const items = mode === 'routes' ? ROUTES : TRACKS

  // Elementi nell'area visibile, dal più vicino al centro
  const visible = useMemo(() => {
    if (!bounds) return items
    const c = bounds.getCenter()
    return items
      .filter((it) => bounds.contains(it.pin))
      .sort((a, b) => Math.hypot(a.pin[0] - c.lng, a.pin[1] - c.lat) - Math.hypot(b.pin[0] - c.lng, b.pin[1] - c.lat))
  }, [items, bounds])

  // Conteggi dell'area visibile: stesso numero nel toggle e nell'overlay (contesto §7.3)
  const liveCounts = useMemo(() => {
    const inView = (list) => (bounds ? list.filter((it) => bounds.contains(it.pin)).length : list.length)
    return { routes: inView(ROUTES), tracks: inView(TRACKS) }
  }, [bounds])

  const list = frozen ? frozen.ids.map((id) => items.find((it) => it.id === id)) : visible
  const counts = frozen ? frozen.counts : liveCounts

  const select = useCallback((id) => {
    if (!id) {
      setFrozen(null)
      setSelectedId(null)
      return
    }
    // Alla prima selezione l'elenco si ferma: la mappa che zooma non deve cambiare il carosello
    setFrozen((f) => f ?? {
      ids: visible.some((it) => it.id === id) ? visible.map((it) => it.id) : [id, ...visible.map((it) => it.id)],
      counts: liveCounts,
    })
    setSelectedId(id)
    setSnap((s) => (s === 0 ? 1 : s))
  }, [visible, liveCounts])

  const changeMode = useCallback((next) => {
    setSelectedId(null)
    setFrozen(null)
    setMode(next)
  }, [])

  const changeSnap = useCallback((i) => {
    setSnap((s) => {
      if (i === 2 && s !== 2) prevSnap.current = s
      return i
    })
  }, [])

  // Spazio libero per inquadrare un percorso: sotto il toggle, sopra l'overlay
  const padding = useMemo(() => ({
    top: insets.safeTop + 156,
    bottom: insets.tabH + (snap === 0 ? SNAP_PEEK : SNAP_HALF) + 40,
    left: 72,
    right: 32,
  }), [insets, snap])

  // Stato 3: il foglio arriva sotto il toggle, la parte sopra diventa bianca
  const listTop = insets.safeTop + 134
  const snaps = useMemo(
    () => [SNAP_PEEK, SNAP_HALF, Math.max(SNAP_HALF + 100, insets.vh - insets.tabH - listTop)],
    [insets, listTop],
  )

  const count = counts[mode]
  const unit = mode === 'routes' ? (count === 1 ? 'Route' : 'Routes') : (count === 1 ? 'Track' : 'Tracks')
  const title = count === 0 ? `No ${mode} in this area` : `${count} ${unit}`
  const listing = snap === 2

  return (
    <div className={`explore${listing ? ' is-listing' : ''}`} style={{ '--list-top': `${listTop}px` }}>
      {error ? (
        <MapError kind={error} onRetry={() => { setError(null); setErrorKey((k) => k + 1) }} />
      ) : (
        <MapView
          key={errorKey}
          ref={mapRef}
          items={items}
          selectedId={selectedId}
          onSelect={select}
          onViewChange={setBounds}
          styleKind={styleKind}
          padding={padding}
          onError={setError}
        />
      )}

      <div className="explore__veil" aria-hidden="true" />
      <div className="explore__list-bg" aria-hidden="true" />

      <div className="explore__top">
        <Searchbar
          onLight={listing}
          placeholder={mode === 'routes' ? 'Search Routes or locations' : 'Search Tracks or locations'}
        />
        <RouteToggle value={mode} onChange={changeMode} counts={counts} onLight={listing} />
        <div className="explore__buttons" aria-hidden={listing}>
          <RoundButton
            icon="layers"
            label={styleKind === 'topo' ? 'Show satellite map' : 'Show topographic map'}
            aria-pressed={styleKind === 'satellite'}
            tabIndex={listing ? -1 : undefined}
            onClick={() => setStyleKind((k) => (k === 'topo' ? 'satellite' : 'topo'))}
          />
          <RoundButton
            icon="target"
            label="Show my position"
            tabIndex={listing ? -1 : undefined}
            onClick={() => mapRef.current?.recenter()}
          />
        </div>
      </div>

      <BottomSheet
        snaps={snaps}
        snap={snap}
        onSnapChange={changeSnap}
        bottom={insets.tabH}
        className="explore__overlay"
        label={title}
        header={<p className="t-display explore__overlay-title" aria-live="polite">{title}</p>}
        footer={listing && (
          <div className="explore__fab"><FabMap onClick={() => changeSnap(prevSnap.current === 2 ? 0 : prevSnap.current)} /></div>
        )}
      >
        {listing ? (
          <Listing items={list} onPick={(id) => { select(id); changeSnap(1) }} />
        ) : (
          <Carousel items={list} mode={mode} selectedId={selectedId} onPick={select} hidden={snap === 0} />
        )}
      </BottomSheet>
    </div>
  )
}

/* ---------- Stato 2: carosello, la mappa segue la card ---------- */
function Carousel({ items, mode, selectedId, onPick, hidden }) {
  const ref = useRef(null)
  const programmatic = useRef(false)
  const timer = useRef(0)

  // Nuovo elenco senza selezione: si riparte dalla prima card
  const idsKey = items.map((it) => it.id).join(',')
  useEffect(() => {
    const el = ref.current
    if (!el || selectedId) return
    programmatic.current = true
    el.scrollLeft = 0
  }, [idsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Card del percorso selezionato al centro (tap su un pin)
  useEffect(() => {
    const el = ref.current
    const card = selectedId && el?.querySelector(`[data-id="${selectedId}"]`)
    if (!card) return
    const target = el.scrollLeft + slideCenter(el, card) - el.clientWidth / 2
    if (Math.abs(el.scrollLeft - target) < 2) return
    programmatic.current = true
    el.scrollTo({ left: target, behavior: reducedMotion() ? 'auto' : 'smooth' })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { programmatic.current = false }, 600)
  }, [selectedId, items])

  // Fine dello scorrimento: la card al centro diventa la selezione
  const onScroll = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (programmatic.current) { programmatic.current = false; return }
      const el = ref.current
      if (!el) return
      let best = null, dist = Infinity
      for (const card of el.querySelectorAll('[data-id]')) {
        const d = Math.abs(slideCenter(el, card) - el.clientWidth / 2)
        if (d < dist) { dist = d; best = card }
      }
      const id = best?.dataset.id
      if (id && id !== selectedId && (selectedId || el.scrollLeft > 4)) onPick(id)
    }, 140)
  }

  if (!items.length) {
    return (
      <p className="t-md explore__empty">
        {`No ${mode} here. Move the map to see more.`}
      </p>
    )
  }
  return (
    <div ref={ref} className={`explore__carousel${hidden ? ' is-hidden' : ''}`} onScroll={onScroll}>
      {items.map((it) => (
        <div key={it.id} data-id={it.id} className="explore__slide">
          <RouteCard route={it} active={it.id === selectedId} onClick={() => onPick(it.id)} />
        </div>
      ))}
    </div>
  )
}

// Centro di una card rispetto al bordo sinistro visibile del carosello
function slideCenter(el, card) {
  const a = el.getBoundingClientRect()
  const b = card.getBoundingClientRect()
  return b.left - a.left + b.width / 2
}

/* ---------- Stato 3: listing ---------- */
function Listing({ items, onPick }) {
  const [saved, setSaved] = useState(() => new Set())
  const toggle = (id) => setSaved((s) => {
    const next = new Set(s)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  if (!items.length) return <p className="t-md explore__empty">Nothing in this area. Move the map to see more.</p>
  return (
    <div className="explore__list">
      {items.map((it) => (
        <ListingCard key={it.id} route={it} saved={saved.has(it.id)} onSave={() => toggle(it.id)} onClick={() => onPick(it.id)} />
      ))}
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

// Altezza della finestra e della tab bar, margine sicuro in alto: misurati
function useInsets() {
  const [insets, setInsets] = useState({ tabH: 80, safeTop: 0, vh: window.innerHeight })
  useEffect(() => {
    const measure = () => {
      const probe = document.createElement('div')
      probe.style.cssText = 'position:absolute;visibility:hidden;padding-top:var(--safe-top)'
      document.body.appendChild(probe)
      const safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0
      probe.remove()
      const tabH = document.querySelector('.tab-bar')?.offsetHeight ?? 80
      const vh = window.innerHeight
      setInsets((p) => (p.tabH === tabH && p.safeTop === safeTop && p.vh === vh ? p : { tabH, safeTop, vh }))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return insets
}
