import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import LevelShape from '../components/LevelShape.jsx'
import { SwitchRow } from '../components/Controls.jsx'
import { FACTORS, LEVELS } from '../data/itrs.js'
import { haptic } from '../haptic.js'

/*
 * Navigazione, passi 3.2 e 3.3: pagina dati, pagina controlli e pulsanti di pausa condivisi.
 * Figma: dati 3711:28555 (pausa 3711:28764, stop 3711:28866), controlli 3711:28955,
 * stop tenendo premuto 3711:28405, avviso track successiva 3711:29806.
 */

export const HOLD_MS = 4000

// Tempo del giro: m:ss sotto l'ora, h:mm oltre (pagina dati); h:mm:ss nella pillola [P]
const pad = (n) => String(n).padStart(2, '0')
export function shortTime(sec) {
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}` : `${m}:${pad(s % 60)}`
}
export function clockTime(sec) {
  const s = Math.floor(sec)
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}
function spokenTime(sec) {
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return [h && `${h} h`, `${m} min`, !h && `${s % 60} s`].filter(Boolean).join(' ')
}

/*
 * Stop tenendo premuto 4 secondi (contesto §4.11, Figma 3711:28405 e 3711:28866):
 * durante la pressione un anello accent/stop si riempie sul bordo del pulsante; lasciando prima
 * l'anello torna indietro e compare per 2 s il suggerimento "Hold to end the ride" [P].
 * Funziona anche da tastiera (Spazio o Invio tenuti premuti).
 */
export function HoldStop({ size, className = '', onDone, onHint }) {
  const ringRef = useRef(null)
  const hold = useRef(null)
  const r = size / 2
  const len = 2 * Math.PI * r

  const setFrac = (f, animate) => {
    const el = ringRef.current
    if (!el) return
    el.style.transition = animate ? 'stroke-dashoffset var(--dur-base) var(--ease-out)' : 'none'
    el.style.strokeDashoffset = String(len * (1 - f))
  }
  const start = () => {
    if (hold.current) return
    haptic()
    const t0 = performance.now()
    const step = (now) => {
      const f = Math.min(1, (now - t0) / HOLD_MS)
      setFrac(f, false)
      if (f >= 1) { hold.current = null; haptic(); onDone(); return }
      hold.current.raf = requestAnimationFrame(step)
    }
    hold.current = { raf: requestAnimationFrame(step) }
  }
  const release = () => {
    if (!hold.current) return
    cancelAnimationFrame(hold.current.raf)
    hold.current = null
    setFrac(0, true)
    onHint?.()
  }
  useEffect(() => () => hold.current && cancelAnimationFrame(hold.current.raf), [])

  return (
    <button
      type="button"
      className={`ride__round ride__round--stop ${className}`}
      style={{ width: size, height: size }}
      aria-label="End the ride. Press and hold for 4 seconds"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); start() }}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start() } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') release() }}
    >
      <Icon name="stop" size={32} />
      <svg className="hold-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          ref={ringRef}
          cx={r} cy={r} r={r}
          strokeDasharray={len}
          strokeDashoffset={len}
          transform={`rotate(-90 ${r} ${r})`}
        />
      </svg>
    </button>
  )
}

// Pausa / stop + riprendi, uguali sulla mappa (80, pausa nera) e sulla pagina dati (90, pausa bianca)
export function RideActions({ paused, onPause, onResume, onEnd, size, light, className = '' }) {
  const [hint, setHint] = useState(false)
  useEffect(() => {
    if (!hint) return
    const t = setTimeout(() => setHint(false), 2000)
    return () => clearTimeout(t)
  }, [hint])
  useEffect(() => { if (!paused) setHint(false) }, [paused])

  return (
    <div className={`ride-actions ${className}`}>
      <p className={`ride-actions__hint t-sm-em${hint ? ' is-shown' : ''}`} role="status">
        {hint ? 'Hold to end the ride' : ''}
      </p>
      {paused ? (
        <>
          <HoldStop size={size} className={light ? 'ride__round--stop-soft' : ''} onDone={onEnd} onHint={() => setHint(true)} />
          <button type="button" className="ride__round ride__round--resume" style={{ width: size, height: size }} aria-label="Resume" onClick={onResume}>
            <Icon name="play" size={32} />
          </button>
        </>
      ) : (
        <button
          type="button"
          className={`ride__round${light ? ' ride__round--light' : ''}`}
          style={{ width: size, height: size }}
          aria-label="Pause"
          onClick={onPause}
        >
          <Icon name="pause" size={32} />
        </button>
      )}
    </div>
  )
}

// Pallini delle 3 pagine: toccabili (sul computer non c'è lo swipe)
const PAGE_NAMES = ['map', 'ride data', 'controls']
export function PageDots({ page, onGo, className = '' }) {
  return (
    <div className={`ride-dots ${className}`} role="tablist" aria-label="Navigation pages">
      {PAGE_NAMES.map((name, i) => (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={page === i}
          aria-label={`Page ${i + 1} of 3: ${name}`}
          className={page === i ? 'is-active' : ''}
          onClick={() => onGo(i)}
        >
          <span />
        </button>
      ))}
    </div>
  )
}

/*
 * Pagina dati (Figma 3711:28555): fondo scuro. In alto tempo, velocità e metri saliti
 * (4xl Mona Sans, label sm/emphasized text-disabled-400); al centro la track corrente con
 * forma del livello e la distanza fatta in Mona Sans 140 con `km of 12.75`; barra della route
 * a segmenti colorati per difficoltà (larghi quanto le track) con l'indicatore accent/stop.
 */
export function DataPage({ ride, state, paused, actions, dots }) {
  const many = ride.legs.length > 1
  const level = state.leg.level
  const speed = paused || state.finished ? 0 : Math.round(state.speedKmh)
  const levelName = FACTORS.difficulty.names[level]
  return (
    <div className="ride-data">
      <dl className="ride-data__top">
        <div>
          <dt className="t-sm-em">Time</dt>
          <dd className="t-display" aria-label={spokenTime(state.t)}>{shortTime(state.t)}</dd>
        </div>
        <div>
          <dt className="t-sm-em">km/h speed</dt>
          <dd className="t-display">{speed}</dd>
        </div>
        <div>
          <dt className="t-sm-em">m climbed</dt>
          <dd className="t-display">{Math.round(state.upDone)}</dd>
        </div>
      </dl>

      <div className="ride-data__main">
        <p className="t-md-em ride-data__track">
          <LevelShape level={level} size={14} title={levelName} />
          <span>{many ? `${state.leg.n}/${ride.legs.length} ` : ''}{state.leg.track.name}</span>
        </p>
        <p className="ride-data__dist" aria-label={`${state.km.toFixed(2)} of ${ride.totalKm.toFixed(2)} kilometres`}>
          <span className="t-display ride-data__km" aria-hidden="true">{state.km.toFixed(2)}</span>
          <span className="t-md ride-data__of" aria-hidden="true">km of {ride.totalKm.toFixed(2)}</span>
        </p>
      </div>

      <div className="ride-data__route" aria-hidden="true">
        {ride.legs.map((leg) => {
          const here = leg.n === state.leg.n
          const f = here ? Math.min(1, Math.max(0, (state.km - leg.startKm) / leg.km)) : 0
          return (
            <span key={leg.n} className="ride-data__seg" style={{ flexGrow: leg.km, background: LEVELS[leg.level].color }}>
              {here && <i className="ride-data__pos" style={{ left: `${f * 100}%` }} />}
            </span>
          )
        })}
      </div>

      {actions}
      {dots}
    </div>
  )
}
/*
 * Pagina controlli (Figma 3711:28955): fondo bianco, titolo CONTROLS, card sabbia
 * (Share live location, Report a hazard) e interruttori Nav/Switch; pillola blu col tempo
 * del giro per tornare alla mappa. Interruttori e condivisione cambiano solo stato [P];
 * Report a hazard senza azione fino al passo 4.2.
 */
export function ControlsPage({ elapsed, onBack }) {
  const [live, setLive] = useState(false)
  const [lock, setLock] = useState(false)
  const [voice, setVoice] = useState(true)
  const [autoPause, setAutoPause] = useState(true)
  return (
    <div className="ride-controls">
      <h2 className="t-display ride-controls__title">Controls</h2>
      <div className="ride-controls__cards">
        <button type="button" className="ride-controls__card" aria-pressed={live} onClick={() => setLive((v) => !v)}>
          <span>
            <span className="t-lg-em">Share live location</span>
            <span className="t-sm ride-controls__detail">{live ? 'On' : 'Off'}</span>
          </span>
          <Icon name="radar" size={24} />
        </button>
        <button type="button" className="ride-controls__card">
          <span>
            <span className="t-lg-em">Report a hazard</span>
            <span className="t-sm ride-controls__detail">Warn other riders</span>
          </span>
          <Icon name="warning" size={24} />
        </button>
      </div>
      <div className="ride-controls__settings">
        <SwitchRow title="Lock screen" detail="Prevents accidental touches" checked={lock} onChange={setLock} />
        <SwitchRow title="Voice cues" detail="Next track and difficulty" checked={voice} onChange={setVoice} />
        <SwitchRow title="Auto-pause" detail="When you stop riding" checked={autoPause} onChange={setAutoPause} last />
      </div>
      <button type="button" className="ride-controls__pill t-md-em" aria-label={`Back to the map. Ride time ${spokenTime(elapsed)}`} onClick={onBack}>
        <Icon name="arrowLeft" size={20} />
        <span>{clockTime(elapsed)}</span>
      </button>
    </div>
  )
}

/*
 * Avviso della track successiva (Figma 3711:29806): card brand-dark in alto sulla mappa con
 * `NEXT TRACK`, pillola blu-950 con forma e nome del livello, nome della track e `200 m ahead`.
 * Compare negli ultimi 300 m della track [P] e sparisce quando la nuova track inizia.
 */
export const ALERT_M = 300
export function NextTrackAlert({ leg, metersLeft }) {
  const shown = Boolean(leg)
  const [last, setLast] = useState(leg)
  useEffect(() => { if (leg) setLast(leg) }, [leg])
  const l = leg || last
  const m = Math.max(10, Math.round(metersLeft / 10) * 10)
  return (
    <>
      <section className={`ride-next${shown ? ' is-shown' : ''}`} aria-hidden={!shown} aria-label="Next track">
        {l && (
          <>
            <div className="ride-next__head">
              <p className="t-label ride-next__label">Next track</p>
              <span className="ride-next__level">
                <LevelShape level={l.level} size={14} />
                <span className="t-display">{FACTORS.difficulty.names[l.level]}</span>
              </span>
            </div>
            <p className="t-lg-em ride-next__name">{l.track.name}</p>
            <p className="t-sm ride-next__dist">{m} m ahead</p>
          </>
        )}
      </section>
      <p className="sr-only" role="status">
        {shown ? `Next track: ${l.track.name}, ${FACTORS.difficulty.names[l.level]}` : ''}
      </p>
    </>
  )
}
