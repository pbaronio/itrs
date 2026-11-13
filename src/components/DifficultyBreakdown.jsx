import { LEVELS, FACTORS } from '../data/itrs.js'
import { difficultyBreakdown, fmtKm } from '../data/garda.js'
import LevelShape from './LevelShape.jsx'
import './DifficultyBreakdown.css'

/*
 * Come è calcolata la difficoltà di una route (richiesta di Paolo, 13 nov; esempio del cliente
 * "Details on Technical Difficulty"): quota della route per livello di difficoltà dei segmenti,
 * più la parte su strada e ciclabile, non classificata.
 * - Ciambella 176: un arco per parte, dal livello più facile al più difficile, poi la strada;
 *   2 px di stacco bianco tra gli archi. In entrata gli archi si disegnano uno dopo l'altro in
 *   senso orario (stroke-dashoffset), poi compaiono centro e legenda. *Riduci movimento*: niente.
 * - Legenda come Surface type: forma del livello 18 (colore + forma), nome, % • km.
 * - Strada: viola `--road-unrated` (#BE88DB), indicato da Paolo come nell'esempio del cliente.
 */
const SIZE = 176
const STROKE = 22
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R
const GAP = 2
const DRAW_MS = 900            // durata totale del disegno
const DELAY_MS = 280           // dopo l'apertura del foglio

const NAME = (key) => (key === 'road' ? 'Road (not rated)' : FACTORS.difficulty.names[key])
const pct = (share) => `${(share * 100).toFixed(1)}%`

// Frase di sintesi: livello prevalente tra i tratti classificati, poi gli altri; quota su strada
function summary(parts) {
  const rated = parts.filter((p) => p.key !== 'road')
  const ratedTot = rated.reduce((a, p) => a + p.share, 0)
  const road = parts.find((p) => p.key === 'road')
  const out = []
  if (rated.length) {
    const sorted = [...rated].sort((a, b) => b.share - a.share)
    const [top, ...rest] = sorted
    // Nella frase i livelli vanno dal più facile al più difficile (ordine di `parts`)
    const inOrder = (a) => a.sort((x, y) => parts.indexOf(x) - parts.indexOf(y)).map((p) => NAME(p.key))
    const some = inOrder(rest.filter((p) => p.share / ratedTot >= 0.25))
    const few = inOrder(rest.filter((p) => p.share / ratedTot < 0.25))
    const list = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0])
    let s = `${rest.length ? 'Mostly' : 'Only'} ${NAME(top.key)} sections`
    if (some.length) s += `, with some ${list(some)}`
    if (few.length) s += `${some.length ? ' and' : ', with'} a few ${list(few)}`
    out.push(`${s}.`)
  }
  if (road && road.share >= 0.05) out.push(`${Math.round(road.share * 100)}% of the route is on roads and cycle paths, which are not rated.`)
  return out.join(' ')
}

export default function DifficultyBreakdown({ route }) {
  const parts = difficultyBreakdown(route)
  let at = 0
  const arcs = parts.map((p, i) => {
    const len = p.share * C
    const arc = {
      ...p,
      len: Math.max(len - (parts.length > 1 ? GAP : 0), 1),
      rotate: -90 + (at / C) * 360,
      delay: DELAY_MS + (at / C) * DRAW_MS,
      dur: Math.max(60, p.share * DRAW_MS),
      color: p.key === 'road' ? 'var(--road-unrated)' : LEVELS[p.key].color,
      i,
    }
    at += len
    return arc
  })
  const label = parts.map((p) => `${NAME(p.key)} ${pct(p.share)}`).join(', ')

  return (
    <section className="diff-breakdown" aria-labelledby="diff-breakdown-title">
      <h3 id="diff-breakdown-title" className="t-md-em diff-breakdown__title">Details on technical difficulty</h3>
      <p className="t-md diff-breakdown__text">{summary(parts)}</p>

      <div className="diff-breakdown__chart" role="img" aria-label={`Share of the route by difficulty: ${label}`}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle className="diff-breakdown__track" cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={STROKE} />
          {arcs.map((a) => (
            <circle
              key={a.key}
              className="diff-breakdown__arc"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              strokeWidth={STROKE}
              stroke={a.color}
              strokeDasharray={`${a.len} ${C}`}
              transform={`rotate(${a.rotate} ${SIZE / 2} ${SIZE / 2})`}
              style={{ '--len': a.len, '--delay': `${a.delay}ms`, '--dur': `${a.dur}ms` }}
            />
          ))}
        </svg>
        <div className="diff-breakdown__center" style={{ '--delay': `${DELAY_MS + DRAW_MS * 0.6}ms` }}>
          <span className="t-lg-em">{route.distance}</span>
          <span className="t-sm diff-breakdown__center-label">total</span>
        </div>
      </div>

      <ul className="diff-breakdown__legend">
        {parts.map((p, i) => (
          <li key={p.key} style={{ '--delay': `${DELAY_MS + DRAW_MS * 0.5 + i * 60}ms` }}>
            {p.key === 'road'
              ? <span className="diff-breakdown__swatch" aria-hidden="true" />
              : <LevelShape level={p.key} size={18} />}
            <span className="t-md-em">{NAME(p.key)}</span>
            <span className="t-md diff-breakdown__value">{`${pct(p.share)} • ${fmtKm(p.km)}`}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
