import LevelShape from './LevelShape.jsx'
import { PLAY, FLAG } from './map/markers.js'
import { FACTORS, LEVELS } from '../data/itrs.js'
import { fmtClimb, fmtKm, legsOf } from '../data/garda.js'
import './TrackTimeline.css'

/*
 * Lista track della route a timeline (Figma "Track timeline" 3697:1497, componente
 * Route/Track row 3697:1482; istruzioni §6 "Lista track della route").
 * Start, una riga per track, Finish. Il binario sotto il numero prende il colore di
 * difficoltà della track. Tap su una riga: apre la track in bottom sheet (onOpen(leg)).
 * Distanza e salita nel verso di percorrenza della route (track al contrario: salita = discesa).
 */
export default function TrackTimeline({ route, onOpen, activeN }) {
  const legs = legsOf(route)
  return (
    <ol className="timeline" aria-label={`Tracks of ${route.name}`}>
      <li className="timeline__end">
        <Rail end="start" />
        <span className="timeline__content timeline__content--end">
          <span className="t-md-em timeline__title">Start</span>
          <span className="t-sm timeline__detail">0 km</span>
        </span>
      </li>

      {legs.map((leg) => {
        const climb = leg.reverse ? leg.track.descent : leg.track.climb
        const name = FACTORS.difficulty.names[leg.level]
        return (
          <li key={leg.n}>
            <button
              type="button"
              className={`timeline__row${activeN === leg.n ? ' is-active' : ''}`}
              onClick={() => onOpen?.(leg)}
              aria-label={`Track ${leg.n}, ${leg.track.name}, ${name}, ${fmtKm(leg.km)}, ${fmtClimb(climb)}`}
            >
              <span className="timeline__rail" aria-hidden="true">
                <span className="timeline__num t-xs-em">{leg.n}</span>
                <span className="timeline__connector" style={{ background: LEVELS[leg.level].color }} />
              </span>
              <span className="timeline__content" aria-hidden="true">
                <span className="t-md-em timeline__title">{leg.track.name}</span>
                <span className="t-sm timeline__meta">
                  <span className="timeline__level"><LevelShape level={leg.level} size={12} />{name}</span>
                  <span className="timeline__dot">•</span>
                  <span>{fmtKm(leg.km)}</span>
                  <span className="timeline__dot">•</span>
                  <span>{fmtClimb(climb)}</span>
                </span>
              </span>
              <img
                className="timeline__thumb"
                src={leg.track.photo}
                style={{ objectPosition: leg.track.photoPosition }}
                alt=""
                draggable="false"
                loading="lazy"
              />
            </button>
          </li>
        )
      })}

      <li className="timeline__end">
        <Rail end="finish" />
        <span className="timeline__content">
          <span className="t-md-em timeline__title">Finish</span>
          <span className="t-sm timeline__detail">{route.loop ? `${route.distance} • back to start` : route.distance}</span>
        </span>
      </li>
    </ol>
  )
}

// Partenza e arrivo: cerchio 24 nero con play o bandierina bianca (come sulla mappa)
function Rail({ end }) {
  return (
    <span className={`timeline__rail timeline__rail--${end}`} aria-hidden="true">
      <span className="timeline__marker">
        <svg viewBox="4 4 20 20" width="24" height="24">
          {end === 'start'
            ? <path d={PLAY} fill="currentColor" />
            : <path d={FLAG} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      </span>
      {end === 'start' && <span className="timeline__connector timeline__connector--start" />}
    </span>
  )
}
