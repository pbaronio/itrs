import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import MapView from '../components/map/MapView.jsx'
import Searchbar from '../components/Searchbar.jsx'
import RouteToggle from '../components/RouteToggle.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { Button, RoundButton, FabMap } from '../components/Button.jsx'
import { RouteCard, ListingCard } from '../components/Cards.jsx'
import { ROUTES, TRACKS, unionBox } from '../data/garda.js'
import { activeCount, emptyFilters, matches } from '../data/filters.js'
import Search from './Search.jsx'
import Filters from './Filters.jsx'
import RoutePage from './RoutePage.jsx'
import { TrackPage } from './TrackDetail.jsx'
import Ride from './Ride.jsx'
import { RideContext } from '../rideContext.js'
import { rideIdOf, rideItem } from '../data/ride.js'
import { ALL_BOUNDS } from '../data/garda.js'
import './Explore.css'

/*
 * Explore: mappa e overlay a 3 stati (passi 1.1 e 1.2).
 * - Stato 1 (86): handle e conteggio.
 * - Stato 2 (226): carosello delle route/track dell'area visibile; scorrendo, la mappa segue la card.
 * - Stato 3: listing a tutta pagina, senza maniglia visibile: si esce con uno swipe in giù dall'inizio della lista o col FAB Map (torna allo stato di prima).
 * Tap su un pin: percorso sulla mappa e overlay in stato 2 con la sua card (passo 1.3).
 * Caso limite (passo 1.3, contesto §4.4): nessuna route ma track nell'area visibile →
 *   overlay con `No routes in this area` e la CTA blu `See N tracks`, che passa alla vista Tracks.
 * Ricerca e filtri (passo 1.4): pagine sopra la mappa, ognuna è una voce della cronologia
 *   (Indietro le chiude). I filtri valgono per mappa, conteggi, carosello, listing e ricerca.
 * Pagine di dettaglio (passi 2.1–2.3): tap sulla card di una route (carosello o listing) → pagina
 *   route; tap sulla card di una track → pagina track. Pagine, mappe, Itinerary List e track in
 *   bottom sheet sono voci della cronologia (`layers`): Indietro le chiude una alla volta.
 */
const SNAP_PEEK = 86
const SNAP_HALF = 226
const SNAP_CTA = 136   // testata 56 + 4 + pulsante 60 + 16
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
  const [filters, setFilters] = useState(emptyFilters)
  const [overlay, setOverlay] = useState(null)     // null | 'search' | 'filters'
  const [pending, setPending] = useState(null)     // selezione dopo un cambio di vista (ricerca)
  // Pagine di dettaglio sopra la mappa (passi 2.1–2.3): pila di voci della cronologia, es.
  // [{ t: 'track', id }, { t: 'route', id }, { t: 'routeMap' }, { t: 'itinerary' }, { t: 'leg', n }]
  const [layers, setLayers] = useState([])
  const insets = useInsets()
  const mapRef = useRef(null)
  const searchRef = useRef(null)
  const prevSnap = useRef(0)

  // Elementi che passano i filtri: valgono per mappa, conteggi e liste
  const routes = useMemo(() => ROUTES.filter((it) => matches(it, filters, 'routes')), [filters])
  const tracks = useMemo(() => TRACKS.filter((it) => matches(it, filters, 'tracks')), [filters])
  const items = mode === 'routes' ? routes : tracks

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
    return { routes: inView(routes), tracks: inView(tracks) }
  }, [bounds, routes, tracks])

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

  // ---- Ricerca e filtri: pagine sopra la mappa, chiuse anche da Indietro ----
  // Lo stato della cronologia mantiene { preview: true } (anteprima nel browser, pwa.js)
  useEffect(() => {
    // Al primo avvio nessuna pagina sopra la mappa (es. dopo un ricaricamento)
    const st = history.state
    if (st && (st.overlay || st.layers)) {
      const { overlay: _o, layers: _l, ...rest } = st
      history.replaceState(Object.keys(rest).length ? rest : null, '')
    }
    const onPop = () => {
      setOverlay(history.state?.overlay ?? null)
      setLayers(history.state?.layers ?? [])
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const openOverlay = useCallback((name) => {
    history.pushState({ ...(history.state ?? {}), overlay: name }, '')
    // Sincrono: la ricerca mette a fuoco il campo nello stesso tocco (tastiera su iOS)
    flushSync(() => setOverlay(name))
    if (name === 'search') searchRef.current?.focus()
  }, [])
  // Pagine di dettaglio: push aggiunge una voce, replace cambia l'ultima (es. altra track
  // dal selettore), back torna indietro. Lo stato mantiene { preview: true } (pwa.js).
  const nav = useMemo(() => ({
    push(layer) {
      const next = [...(history.state?.layers ?? []), layer]
      history.pushState({ ...(history.state ?? {}), layers: next }, '')
      setLayers(next)
    },
    replace(layer) {
      const next = [...(history.state?.layers ?? []).slice(0, -1), layer]
      history.replaceState({ ...(history.state ?? {}), layers: next }, '')
      setLayers(next)
    },
    back() { history.back() },
    // Torna alla mappa togliendo tutte le pagine (fine giro: Go to the map)
    home() {
      const n = history.state?.layers?.length ?? 0
      if (n) history.go(-n)
    },
  }), [])
  // Fine giro → mappa come all'avvio dopo lo splash: niente pagine, niente selezione né filtri,
  // vista Routes, overlay in stato 1, mappa su tutto il Garda (richiesta di Paolo)
  const goHome = useCallback(() => {
    nav.home()
    setSelectedId(null)
    setFrozen(null)
    setMode('routes')
    setFilters(emptyFilters())
    setSnap(0)
    setStyleKind('topo')
    mapRef.current?.fitTo(ALL_BOUNDS, 22)
  }, [nav])
  const openRoute = useCallback((id) => nav.push({ t: 'route', id }), [nav])
  const openTrack = useCallback((id) => nav.push({ t: 'track', id }), [nav])
  // Navigazione (passo 3.1): giro sopra tutte le pagine, voce della cronologia
  const startRide = useCallback((it) => nav.push({ t: 'ride', id: rideIdOf(it) }), [nav])
  const rideLayer = layers.find((l) => l.t === 'ride')
  const openItem = useCallback((it) => (it.kind === 'route' ? openRoute(it.id) : openTrack(it.id)), [openRoute, openTrack])
  // La pagina route può aprirsi sopra una pagina track (Routes featuring this track)
  const routeAt = layers.findIndex((l) => l.t === 'route')
  const below = routeAt < 0 ? layers : layers.slice(0, routeAt)
  const routeLayers = routeAt < 0 ? [] : layers.slice(routeAt + 1)
  const trackLayer = below.find((l) => l.t === 'track')

  const closeOverlay = useCallback(() => {
    if (history.state?.overlay) history.back()
    else setOverlay(null)
  }, [])

  // Selezione chiesta dalla ricerca: dopo l'eventuale cambio di vista
  useEffect(() => {
    if (pending && items.some((it) => it.id === pending)) {
      select(pending)
      setPending(null)
    }
  }, [pending, items, select])

  const pickFromSearch = (it) => {
    closeOverlay()
    const next = it.kind === 'route' ? 'routes' : 'tracks'
    if (next !== mode) changeMode(next)
    else select(null)
    setPending(it.id)
  }
  const placeFromSearch = (place) => {
    closeOverlay()
    select(null)
    setSnap(0)
    mapRef.current?.fitTo(place.bbox)
  }
  const currentFromSearch = () => {
    closeOverlay()
    select(null)
    mapRef.current?.recenter()
  }

  const applyFilters = (next) => {
    closeOverlay()
    select(null)
    setFilters(next)
    // Se nell'area visibile non resta niente, la mappa inquadra i risultati
    const list = (mode === 'routes' ? ROUTES : TRACKS).filter((it) => matches(it, next, mode))
    if (list.length && bounds && !list.some((it) => bounds.contains(it.pin))) {
      mapRef.current?.fitTo(unionBox(list.map((it) => it.bbox)), 13)
    }
  }
  const filtersOn = activeCount(filters, mode)

  // Caso limite: zero route, ma track presenti nell'area visibile
  const tracksCta = mode === 'routes' && !selectedId && counts.routes === 0 && counts.tracks > 0
  useEffect(() => {
    if (tracksCta) setSnap(0)
  }, [tracksCta])

  // Spazio libero per inquadrare un percorso: sotto il toggle, sopra l'overlay
  const padding = useMemo(() => ({
    top: insets.safeTop + 156,
    bottom: insets.tabH + (tracksCta ? SNAP_CTA : snap === 0 ? SNAP_PEEK : SNAP_HALF) + 40,
    left: 72,
    right: 32,
  }), [insets, snap])

  // Stato 3: il foglio arriva sotto il toggle, la parte sopra diventa bianca
  const listTop = insets.safeTop + 134
  const snaps = useMemo(
    () => [SNAP_PEEK, SNAP_HALF, Math.max(SNAP_HALF + 100, insets.vh - insets.tabH - listTop)],
    [insets, listTop],
  )

  const sheetSnaps = useMemo(() => (tracksCta ? [SNAP_CTA] : snaps), [tracksCta, snaps])

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
          onSearch={() => openOverlay('search')}
          onFilters={() => openOverlay('filters')}
          filtersActive={filtersOn}
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
        snaps={sheetSnaps}
        snap={tracksCta ? 0 : snap}
        onSnapChange={changeSnap}
        bottom={insets.tabH}
        className="explore__overlay"
        label={title}
        hideHandleAtTop
        header={<p className="t-display explore__overlay-title" aria-live="polite">{title}</p>}
      >
        {tracksCta ? (
          <div className="explore__cta">
            <Button
              variant="confirm"
              onClick={() => { changeMode('tracks'); changeSnap(1) }}
            >
              {`See ${counts.tracks} ${counts.tracks === 1 ? 'track' : 'tracks'}`}
            </Button>
          </div>
        ) : listing ? (
          <Listing items={list} onPick={(id) => {
            select(id)
            changeSnap(1)
            openItem(list.find((it) => it.id === id))
          }} />
        ) : (
          <Carousel items={list} mode={mode} selectedId={selectedId} onPick={select} onOpen={(it) => { select(it.id); openItem(it) }} hidden={snap === 0} />
        )}
      </BottomSheet>

      {/* Fuori dal foglio: 24 sopra la tab bar (Figma 3625:17579), qualunque sia la safe area */}
      <div className={`explore__fab${listing ? ' is-visible' : ''}`} aria-hidden={!listing}>
        <FabMap
          tabIndex={listing ? undefined : -1}
          onClick={() => changeSnap(prevSnap.current === 2 ? 0 : prevSnap.current)}
        />
      </div>

      {/* Fuori da .explore (che crea un contesto di sovrapposizione): sopra la tab bar */}
      {createPortal(<RideContext.Provider value={startRide}>
      <Search
        ref={searchRef}
        open={overlay === 'search'}
        mode={mode}
        items={items}
        filtersOn={filtersOn > 0}
        onPick={pickFromSearch}
        onPlace={placeFromSearch}
        onCurrent={currentFromSearch}
        onClose={closeOverlay}
      />
      <Filters
        open={overlay === 'filters'}
        mode={mode}
        value={filters}
        items={mode === 'routes' ? ROUTES : TRACKS}
        onApply={applyFilters}
        onCancel={closeOverlay}
      />
      <TrackPage
        track={trackLayer ? TRACKS.find((t) => t.id === trackLayer.id) : null}
        open={Boolean(trackLayer)}
        layers={below}
        nav={nav}
        onOpenRoute={openRoute}
      />
      <RoutePage
        route={routeAt >= 0 ? ROUTES.find((r) => r.id === layers[routeAt].id) : null}
        open={routeAt >= 0}
        layers={routeLayers}
        nav={nav}
      />
      <Ride item={rideLayer ? rideItem(rideLayer.id) : null} open={Boolean(rideLayer)} onClose={nav.back} onHome={goHome} />
      </RideContext.Provider>, document.body)}
    </div>
  )
}


/* ---------- Stato 2: carosello, la mappa segue la card ---------- */
function Carousel({ items, mode, selectedId, onPick, onOpen, hidden }) {
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
          {/* Tap sulla card: pagina route (2.1) o pagina track (2.3) */}
          <RouteCard route={it} active={it.id === selectedId} onClick={() => onOpen(it)} />
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
    // Su iOS la safe area arriva dopo il primo disegno: si rimisura quando cambia la tab bar
    const bar = document.querySelector('.tab-bar')
    const ro = bar && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro) ro.observe(bar)
    const late = setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      ro?.disconnect()
      clearTimeout(late)
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [])
  return insets
}
