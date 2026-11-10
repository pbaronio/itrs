import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import RideMap from '../components/map/RideMap.jsx'
import Icon from '../components/Icon.jsx'
import { MapButton, RoundButton } from '../components/Button.jsx'
import { SPEEDS, buildRide, rideAt } from '../data/ride.js'
import { useEntered } from '../useEntered.js'
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
 * - Pausa (provvisoria fino al 3.3): ferma la simulazione e mostra stop nero (quadrato
 *   bianco) + riprendi blu (play scuro), Figma 3711:28250; lo stop per ora chiude subito il giro, al 3.3 diventa stop tenendo
 *   premuto 4 secondi. Anche Indietro chiude il giro.
 */
const PANEL_H = 245          // pannello del Figma (279) senza l'indicatore Home (34)
const DOT_ABOVE_PANEL = 106  // punto blu a ~106 px sopra il pannello (Figma: y 488 su 874)

export default function Ride({ item, open, onClose }) {
  const ride = useMemo(() => (item ? buildRide(item) : null), [item])
  const [shown, setShown] = useState(ride)
  useEffect(() => {
    if (ride) { setShown(ride); return }
    const t = setTimeout(() => setShown(null), 550)
    return () => clearTimeout(t)
  }, [ride])
  const entered = useEntered(open && Boolean(ride))
  if (!shown) return null
  return <RideScreen key={shown.item.id} ride={shown} entered={entered} active={open} onClose={onClose} />
}

const COUNT_FROM = 3

function RideScreen({ ride, entered, active, onClose }) {
  const [state, setState] = useState(() => rideAt(ride, 0))
  const [speedAt, setSpeedAt] = useState(0)
  const [paused, setPaused] = useState(false)
  const [follow, setFollow] = useState(true)
  const [north, setNorth] = useState(false)
  const [styleKind, setStyleKind] = useState('topo')
  const [error, setError] = useState(null)
  const [topPad, setTopPad] = useState(0)
  const [count, setCount] = useState(COUNT_FROM)      // 3, 2, 1, poi 0 = via
  const pageRef = useRef(null)
  const panelRef = useRef(null)
  const mapRef = useRef(null)
  const needleRef = useRef(null)
  const sim = useRef({ t: 0, speed: SPEEDS[0], running: true })
  sim.current.speed = SPEEDS[speedAt]
  sim.current.running = active && !paused && count === 0

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

      <div className="ride__controls">
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
        <button type="button" className="btn-round ride__report" aria-label="Report a hazard">
          <Icon name="warning" size={24} />
        </button>
      </div>

      <MapButton
        className="ride__speed"
        aria-label={`Simulation speed ${speed}×. Tap to change`}
        onClick={() => setSpeedAt((i) => (i + 1) % SPEEDS.length)}
      >
        <span aria-hidden="true">{speed}×</span>
      </MapButton>

      <div className="ride__actions">
        {paused ? (
          <>
            <button type="button" className="ride__round ride__round--stop" aria-label="End the ride" onClick={onClose}>
              <Icon name="stop" size={32} />
            </button>
            <button type="button" className="ride__round ride__round--resume" aria-label="Resume" onClick={() => setPaused(false)}>
              <Icon name="play" size={32} />
            </button>
          </>
        ) : (
          <button type="button" className="ride__round" aria-label="Pause" onClick={() => setPaused(true)}>
            <Icon name="pause" size={32} />
          </button>
        )}
      </div>

      <section ref={panelRef} className="ride__panel" aria-label="Current track">
        <p className="t-label ride__label">{label}</p>
        <h2 className="t-2xl-em ride__name">{state.leg.track.name}</h2>
        <div className="ride__stats">
          <Stat label="Distance" value={state.legLeftKm.toFixed(1)} unit="km" frac={state.legKmFrac} spoken={`${state.legLeftKm.toFixed(1)} kilometres to the end of the track`} />
          <Stat label="Climb" value={String(Math.round(state.legLeftUp))} unit="m" frac={state.legUpFrac} spoken={`${Math.round(state.legLeftUp)} metres of climbing left in the track`} />
        </div>
        <div className="ride__dots" aria-label="Page 1 of 3: map">
          <span className="is-active" /><span /><span />
        </div>
      </section>

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
