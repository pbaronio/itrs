import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import RideMap from '../components/map/RideMap.jsx'
import Icon from '../components/Icon.jsx'
import { MapButton, RoundButton } from '../components/Button.jsx'
import { SPEEDS, buildRide, rideAt } from '../data/ride.js'
import { useEntered } from '../useEntered.js'
import { haptic } from '../haptic.js'
import { RideComplete, Review, Report } from './RideFlows.jsx'
import { ALERT_M, ControlsPage, DataPage, NextTrackAlert, PageDots, RideActions } from './RidePages.jsx'
import './Ride.css'

/*
 * Navigazione, pagina 1: mappa (passo 3.1, contesto §4.11, Figma 3691:27462).
 * - Countdown (Figma 3773:35449, richiesta di Paolo): dopo Start compare in dissolvenza un fondo
 *   blu con 3, 2, 1 in Mona Sans; poi sfuma e scopre la mappa, e solo allora il giro parte.
 *   Intanto sotto la mappa carica.
 * - Giro simulato: il punto blu avanza da solo lungo il tracciato (data/ride.js); il pulsante
 *   in alto a destra accelera la simulazione (1×, 5×, 20×). Non è nel design: serve ai test [P].
 * - Mappa che segue il ciclista con la direzione di marcia in alto; tratto fatto in grigio.
 * - Controlli a sinistra: bussola (direzione in alto ↔ nord in alto), tipo di mappa, ricentra,
 *   segnalazione (giallo; il flusso arriva al passo 4.2).
 * - Pannello scuro: `TRACK 2 OF 4`, nome della track, distanza e salita che mancano alla fine
 *   della track, con le barre di avanzamento. I pallini delle 3 pagine (dati e controlli al 3.2).
 * - Pausa: ferma la simulazione e mostra stop + riprendi (Figma 3711:28250). Lo stop chiude il
 *   giro solo tenendolo premuto 4 secondi (3.3, RidePages.jsx). Anche Indietro chiude il giro.
 * - 3 pagine che scorrono in orizzontale (3.2): mappa, dati (scura), controlli (bianca).
 *   Scroll-snap nativo: sulla pagina mappa si scorre dal pannello (la mappa tiene il dito per
 *   spostarsi); sulle altre da tutta la pagina. I pallini sono toccabili.
 * - Avviso della track successiva sulla mappa (3.3, Figma 3711:29806).
 */
const PANEL_H = 245          // pannello del Figma (279) senza l'indicatore Home (34)
const DOT_ABOVE_PANEL = 106  // punto blu a ~106 px sopra il pannello (Figma: y 488 su 874)

export default function Ride({ item, open, onClose, onHome }) {
  const ride = useMemo(() => (item ? buildRide(item) : null), [item])
  const [shown, setShown] = useState(ride)
  useEffect(() => {
    if (ride) { setShown(ride); return }
    const t = setTimeout(() => setShown(null), 550)
    return () => clearTimeout(t)
  }, [ride])
  const entered = useEntered(open && Boolean(ride))
  if (!shown) return null
  return <RideScreen key={shown.item.id} ride={shown} entered={entered} active={open} onClose={onClose} onHome={onHome ?? onClose} />
}

const COUNT_FROM = 3

function RideScreen({ ride, entered, active, onClose, onHome }) {
  const [state, setState] = useState(() => rideAt(ride, 0))
  const [speedAt, setSpeedAt] = useState(0)
  const [paused, setPaused] = useState(false)
  const [follow, setFollow] = useState(true)
  const [north, setNorth] = useState(false)
  const [styleKind, setStyleKind] = useState('topo')
  const [error, setError] = useState(null)
  const [topPad, setTopPad] = useState(0)
  const [count, setCount] = useState(COUNT_FROM)      // 3, 2, 1, poi 0 = via
  const [page, setPage] = useState(0)                 // 0 mappa, 1 dati, 2 controlli
  const [end, setEnd] = useState(null)                // fine giro: stato del giro in quel momento
  const [review, setReview] = useState(false)         // review dopo Ride complete
  const [report, setReport] = useState(null)          // segnalazione: stato del giro all'apertura
  const pagerRef = useRef(null)
  const pageRef = useRef(null)
  const panelRef = useRef(null)
  const mapRef = useRef(null)
  const needleRef = useRef(null)
  const sim = useRef({ t: 0, speed: SPEEDS[0], running: true })
  sim.current.speed = SPEEDS[speedAt]
  const flowOpen = Boolean(end || report)
  sim.current.running = active && !paused && count === 0 && !flowOpen

  // Countdown: un numero al secondo, si parte solo quando il fondo blu è sparito.
  // Parte quando la pagina è entrata, così il 3 si vede per intero.
  useEffect(() => {
    if (!entered || count === 0) return
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [entered, count])

  // Punto blu sopra il pannello, come nel Figma: margine in alto per spostare il centro della mappa
  useLayoutEffect(() => {
    const measure = () => {
      const h = pageRef.current?.clientHeight || window.innerHeight
      const panel = panelRef.current?.offsetHeight || PANEL_H
      const y = h - panel - DOT_ABOVE_PANEL
      setTopPad(Math.max(0, 2 * y - h))
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (pageRef.current) ro?.observe(pageRef.current)
    return () => ro?.disconnect()
  }, [])

  // Simulazione: a ogni frame la mappa, 5 volte al secondo il pannello
  useEffect(() => {
    let raf = 0
    let prev = performance.now()
    let lastUi = 0
    const tick = (now) => {
      const dt = Math.min(0.25, (now - prev) / 1000)
      prev = now
      const s = sim.current
      if (s.running && s.t < ride.totalSec) s.t = Math.min(ride.totalSec, s.t + dt * s.speed)
      const st = rideAt(ride, s.t)
      mapRef.current?.update(st)
      if (now - lastUi > 200) { lastUi = now; setState(st) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ride])

  /*
   * Pagine (3.2, rev. 1): scorrimento gestito a mano, non con lo scroll nativo. Con lo scroll-snap,
   * su iPhone dalla pagina dati non si tornava più alla mappa. Il dito trascina la fila delle
   * pagine (sulla mappa solo dal pannello scuro, altrove da tutta la pagina); si cambia pagina
   * oltre un quarto di larghezza o con uno swipe veloce; ai bordi la fila fa un po' di elastico.
   */
  const trackRef = useRef(null)
  const drag = useRef(null)
  const dragged = useRef(false)
  const width = () => pagerRef.current?.clientWidth || window.innerWidth
  const place = (x, animate) => {
    const el = trackRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.style.transition = animate && !reduce ? 'transform var(--dur-base) var(--ease-out)' : 'none'
    el.style.transform = `translate3d(${x}px, 0, 0)`
  }
  useLayoutEffect(() => { place(-page * width(), true) }, [page])
  useEffect(() => {
    const onResize = () => place(-page * width(), false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [page])
  const goTo = (i) => setPage(Math.max(0, Math.min(2, i)))

  const onPointerDown = (e) => {
    if (e.button > 0 || flowOpen) return
    const t = e.target
    if (page === 0 && !t.closest('.ride__panel')) return            // sulla mappa la mappa si sposta
    if (t.closest('.ride__round--stop, .switch, textarea, input')) return
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), on: false }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0
    if (!d.on) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return }   // gesto verticale: scorre la pagina
      d.on = true
      try { pagerRef.current.setPointerCapture(e.pointerId) } catch { /* già rilasciato */ }
    }
    const edge = (page === 0 && dx > 0) || (page === 2 && dx < 0)
    place(-page * width() + (edge ? dx * 0.3 : dx), false)
  }
  const onPointerUp = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || !d.on || e.pointerId !== d.id) return
    dragged.current = true
    setTimeout(() => { dragged.current = false }, 0)
    const dx = e.clientX - d.x0
    const v = dx / Math.max(1, performance.now() - d.t0)        // px/ms
    const w = width()
    let next = page
    if (dx < -w / 4 || v < -0.4) next = page + 1
    else if (dx > w / 4 || v > 0.4) next = page - 1
    next = Math.max(0, Math.min(2, next))
    if (next === page) place(-page * w, true)
    else setPage(next)
  }
  const onPointerCancel = () => {
    if (drag.current?.on) place(-page * width(), true)
    drag.current = null
  }

  // Android: barra di sistema scura sulla pagina dati, chiara altrove
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    const prev = meta.content
    if (active && page === 1) meta.content = getComputedStyle(pageRef.current ?? document.documentElement).getPropertyValue('--nav-dark').trim() || prev
    return () => { meta.content = prev }
  }, [active, page])

  // Track successiva: negli ultimi ALERT_M metri della track; vibrazione quando compare
  const nextLeg = !state.finished && state.legEndLeftKm * 1000 <= ALERT_M ? ride.legs[state.leg.n] ?? null : null
  const alertN = nextLeg?.n ?? 0
  useEffect(() => { if (alertN) haptic() }, [alertN])

  const pause = () => setPaused(true)
  const resume = () => setPaused(false)
  // Fine giro: tenendo premuto stop, oppure arrivati in fondo (dopo un attimo) → Ride complete
  const endRide = () => { setPaused(true); setEnd(rideAt(ride, sim.current.t)) }
  useEffect(() => {
    if (!state.finished || end) return
    const t = setTimeout(() => setEnd(rideAt(ride, ride.totalSec)), 1200)
    return () => clearTimeout(t)
  }, [state.finished, end, ride])
  // Segnalazione dal pulsante giallo o dai controlli: il giro si ferma finché è aperta
  const openReport = () => setReport(rideAt(ride, sim.current.t))
  const actionProps = { paused, onPause: pause, onResume: resume, onEnd: endRide }

  const many = ride.legs.length > 1
  const label = many ? `Track ${state.leg.n} of ${ride.legs.length}` : 'Track'
  const speed = SPEEDS[speedAt]

  return (
    <div
      ref={pageRef}
      className={`ride${entered ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Navigation, ${ride.item.name}`}
      aria-hidden={!active}
    >
      <div
        ref={pagerRef}
        className="ride__pager"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={(e) => { if (dragged.current) { e.stopPropagation(); e.preventDefault() } }}
      >
        <div ref={trackRef} className="ride__track">
        {/* Pagina 1: mappa */}
        <section className="ride-page ride-page--map" aria-label="Map" aria-hidden={page !== 0} inert={page !== 0 || flowOpen}>
          {error ? (
            <div className="ride__error">
              <p className="t-md">{error === 'key' ? 'The map is not available right now.' : 'Can’t load the map. Check your connection.'}</p>
            </div>
          ) : (
            <RideMap
              ref={mapRef}
              ride={ride}
              styleKind={styleKind}
              topPad={topPad}
              onError={setError}
              onFollowChange={setFollow}
              needleRef={needleRef}
            />
          )}

          <div className="ride__blur" aria-hidden="true" />

          <NextTrackAlert leg={nextLeg} metersLeft={state.legEndLeftKm * 1000} />

          <div className={`ride__controls${nextLeg ? ' is-pushed' : ''}`}>
            <button
              type="button"
              className="btn-round ride__compass"
              aria-label={north ? 'North up. Show direction of travel up' : 'Direction of travel up. Show north up'}
              aria-pressed={north}
              onClick={() => setNorth(mapRef.current?.toggleNorth() ?? false)}
            >
              <span ref={needleRef} className="ride__needle-wrap" aria-hidden="true">
                <svg className="ride__needle" viewBox="0 0 12 8"><path d="M6 0 12 8H0Z" /></svg>
                <span className="t-xs-em">N</span>
              </span>
            </button>
            <RoundButton
              icon="layers"
              label={styleKind === 'topo' ? 'Show satellite map' : 'Show topographic map'}
              aria-pressed={styleKind === 'satellite'}
              onClick={() => setStyleKind((k) => (k === 'topo' ? 'satellite' : 'topo'))}
            />
            <RoundButton
              icon="target"
              label={follow ? 'Following your position' : 'Recenter on your position'}
              aria-pressed={follow}
              onClick={() => mapRef.current?.recenter()}
            />
            <button type="button" className="btn-round ride__report" aria-label="Report a hazard" onClick={openReport}>
              <Icon name="warning" size={24} />
            </button>
          </div>

          <MapButton
            className={`ride__speed${nextLeg ? ' is-hidden' : ''}`}
            aria-label={`Simulation speed ${speed}×. Tap to change`}
            onClick={() => setSpeedAt((i) => (i + 1) % SPEEDS.length)}
          >
            <span aria-hidden="true">{speed}×</span>
          </MapButton>

          <RideActions {...actionProps} size={80} className="ride__actions" />

          <section ref={panelRef} className="ride__panel" aria-label="Current track">
            <p className="t-label ride__label">{label}</p>
            <h2 className="t-2xl-em ride__name">{state.leg.track.name}</h2>
            <div className="ride__stats">
              <Stat label="Distance" value={state.legLeftKm.toFixed(1)} unit="km" frac={state.legKmFrac} spoken={`${state.legLeftKm.toFixed(1)} kilometres to the end of the track`} />
              <Stat label="Climb" value={String(Math.round(state.legLeftUp))} unit="m" frac={state.legUpFrac} spoken={`${Math.round(state.legLeftUp)} metres of climbing left in the track`} />
            </div>
            <PageDots page={page} onGo={goTo} className="ride__dots" />
          </section>
        </section>

        {/* Pagina 2: dati */}
        <section className="ride-page ride-page--data" aria-label="Ride data" aria-hidden={page !== 1} inert={page !== 1 || flowOpen}>
          <DataPage
            ride={ride}
            state={state}
            paused={paused}
            actions={<RideActions {...actionProps} size={90} light className="ride-data__actions" />}
            dots={<PageDots page={page} onGo={goTo} className="ride-data__dots" />}
          />
        </section>

        {/* Pagina 3: controlli */}
        <section className="ride-page ride-page--controls" aria-label="Controls" aria-hidden={page !== 2} inert={page !== 2 || flowOpen}>
          <ControlsPage elapsed={state.t} onBack={() => goTo(0)} onReport={openReport} />
        </section>
        </div>
      </div>

      {end && <RideComplete ride={ride} end={end} onRate={() => setReview(true)} onClose={onClose} />}
      {end && review && <Review onClose={() => setReview(false)} onDone={onHome} />}
      {report && <Report ride={ride} at={report} onClose={() => setReport(null)} />}

      <div className={`ride-countdown${count === 0 ? ' is-done' : ''}`} aria-hidden={count === 0}>
        {count > 0 && (
          <span key={count} className="t-display ride-countdown__num" role="timer" aria-live="assertive">{count}</span>
        )}
      </div>
    </div>
  )
}

// Nav/Stat: label sm/emphasized, valore Mona Sans 60 con l'unità, barra di avanzamento blu
function Stat({ label, value, unit, frac, spoken }) {
  return (
    <div className="ride-stat">
      <p className="t-sm-em ride-stat__label">{label}</p>
      <p className="ride-stat__value" aria-label={spoken}>
        <span className="t-display ride-stat__num" aria-hidden="true">{value}</span>
        <span className="ride-stat__unit" aria-hidden="true">{unit}</span>
      </p>
      <div className="ride-stat__bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${frac})` }} />
      </div>
    </div>
  )
}
