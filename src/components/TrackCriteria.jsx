import { LEVELS, FACTORS } from '../data/itrs.js'
import { CRITERIA } from '../data/garda.js'
import LevelShape, { SHAPE_PATHS } from './LevelShape.jsx'
import './DifficultyBreakdown.css'
import './TrackCriteria.css'

/*
 * Come è calcolata la difficoltà di una track (richiesta di Paolo, 13 nov; esempio del cliente):
 * una barra per criterio, lunga quanto il livello (1 passo = Beginner … 4 = Expert), col colore
 * del livello e la sua forma bianca in fondo alla barra (mai solo colore). Sotto, la scala con le
 * forme dei livelli allineate ai passi. Criteri senza l'elemento (es. nessun salto): "None".
 * In entrata le barre crescono da sinistra una dopo l'altra; *Riduci movimento*: niente.
 */
const STEPS = ['green', 'blue', 'red', 'black']
const DELAY_MS = 280
const STAGGER_MS = 45

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1)

function summary(track) {
  const top = CRITERIA.filter((c) => track.criteria[c.key] === track.difficulty).map((c) => lower(c.label))
  const list = top.length > 1 ? `${top.slice(0, -1).join(', ')} and ${top[top.length - 1]}` : top[0]
  return `Each criterion is rated on its own; the hardest sets the level. ${FACTORS.difficulty.names[track.difficulty]} comes from the ${list}.`
}

export default function TrackCriteria({ track }) {
  const steps = track.difficulty === 'orange' ? [...STEPS, 'orange'] : STEPS
  const rows = CRITERIA.map((c) => ({ ...c, level: track.criteria?.[c.key] ?? null }))
  return (
    <section className="track-criteria diff-section" aria-labelledby="track-criteria-title">
      <h3 id="track-criteria-title" className="t-md-em diff-section__title">Details on technical difficulty</h3>
      <p className="t-md diff-section__text">{summary(track)}</p>

      <ul className="track-criteria__rows" style={{ '--steps': steps.length }}>
        {rows.map((r, i) => {
          const n = r.level ? steps.indexOf(r.level) + 1 : 0
          return (
            <li key={r.key} className="track-criteria__row">
              <span className="t-sm track-criteria__label">{r.label}</span>
              <span className="track-criteria__track">
                {r.level ? (
                  <span
                    className="track-criteria__bar"
                    style={{ '--n': n, '--color': LEVELS[r.level].color, '--delay': `${DELAY_MS + i * STAGGER_MS}ms` }}
                    role="img"
                    aria-label={`${r.label}: ${FACTORS.difficulty.names[r.level]}`}
                  >
                    <svg className="track-criteria__shape" width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
                      {SHAPE_PATHS[LEVELS[r.level].shape]('var(--gray-0)')}
                    </svg>
                  </span>
                ) : (
                  <span className="t-sm track-criteria__none">None</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {/* Scala: forme dei livelli al centro di ogni passo */}
      <div className="track-criteria__scale" style={{ '--steps': steps.length }} aria-hidden="true">
        <span />
        <span className="track-criteria__steps">
          {steps.map((s) => <span key={s}><LevelShape level={s} size={14} /></span>)}
        </span>
      </div>
    </section>
  )
}
