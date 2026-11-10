import { useMemo } from 'react'
import { LEVELS } from '../data/itrs.js'
import { legsOf, profileOf } from '../data/garda.js'
import './ElevationProfile.css'

/*
 * Grafico altimetrico (Figma Profile/Elevation 3686:3855, istruzioni §6), 370×162.
 * - Linea 3 col colore di difficoltà di ogni track, area dello stesso colore al 12%.
 * - Separatori tratteggiati stroke-sub-200 tra le track, numeri 22 come sulla mappa.
 * - Due linee guida tratteggiate con quota, asse orizzontale con 0, metà e fine in km.
 * Passo 2.1: solo lettura. Il trascinamento collegato alla mappa arriva al passo 2.2.
 */
const W = 370
const H = 162
const AXIS_Y = 140           // asse orizzontale
const TOP = 14               // quota massima
const BOTTOM = 100           // quota minima: la curva resta sopra i numeri delle track
const NUM = 22               // numeri delle track
const NUM_Y = 108

// Due linee guida a quote "rotonde": il passo più grande che ne fa stare almeno due nel grafico
function gridLevels(min, max) {
  const steps = [1000, 500, 250, 200, 100, 50, 25, 20, 10]
  for (const step of steps) {
    const out = []
    for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(v)
    if (out.length >= 2) return [out[0], out[out.length - 1]]
  }
  return []
}

export default function ElevationProfile({ route }) {
  const data = useMemo(() => {
    const legs = legsOf(route)
    const total = legs[legs.length - 1].endKm
    const series = legs.map((leg) => ({ leg, pts: profileOf(leg.points, leg.startKm, leg.km) }))
    let min = Infinity, max = -Infinity
    for (const { pts } of series) for (const [, e] of pts) { if (e < min) min = e; if (e > max) max = e }
    if (max - min < 20) { min -= 10; max += 10 }
    const x = (km) => (km / total) * W
    const y = (e) => BOTTOM - ((e - min) / (max - min)) * (BOTTOM - TOP)

    const paths = series.map(({ leg, pts }) => {
      // Al massimo un punto ogni mezzo pixel
      const out = []
      let lastX = -1
      pts.forEach(([km, e], i) => {
        const px = x(km)
        if (px - lastX >= 0.5 || i === pts.length - 1) { out.push([px, y(e)]); lastX = px }
      })
      const line = out.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join('')
      const area = `${line}L${out[out.length - 1][0].toFixed(1)} ${AXIS_Y}L${out[0][0].toFixed(1)} ${AXIS_Y}Z`
      return { leg, line, area, x0: x(leg.startKm), x1: x(leg.endKm), yEnd: out[out.length - 1][1] }
    })

    const grid = gridLevels(min, max).map((v) => ({ v, y: y(v) }))
    const mid = Math.round(total / 2)
    const end = Math.floor(total)
    return { paths, grid, total, ticks: [
      { label: '0', x: 0, align: 'start' },
      { label: `${mid} km`, x: x(mid), align: 'middle' },
      { label: `${end} km`, x: Math.min(x(end), W), align: 'end' },
    ] }
  }, [route])

  return (
    <figure className="elevation" aria-label={`Elevation profile, ${route.distance}, ${route.climbLabel}`}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true">
        {data.grid.map(({ v, y }) => (
          <line key={v} className="elevation__grid" x1="0" x2={W} y1={y} y2={y} />
        ))}
        {data.paths.map(({ leg, area }) => (
          <path key={`a${leg.n}`} d={area} fill={LEVELS[leg.level].color} opacity=".12" />
        ))}
        {data.paths.slice(1).map(({ leg, x0 }, i) => (
          <line key={`b${leg.n}`} className="elevation__boundary" x1={x0} x2={x0} y1={data.paths[i].yEnd} y2={AXIS_Y} />
        ))}
        {data.paths.map(({ leg, line }) => (
          <path key={`l${leg.n}`} d={line} className="elevation__line" stroke={LEVELS[leg.level].color} />
        ))}
        <line className="elevation__axis" x1="0" x2={W} y1={AXIS_Y} y2={AXIS_Y} />
        {/* Quote sopra le linee guida, con un contorno bianco se la curva ci passa sopra */}
        {data.grid.map(({ v, y }) => (
          <text key={`g${v}`} className="elevation__label elevation__label--halo" x="0" y={y - 6}>{`${v} m`}</text>
        ))}
        {data.paths.map(({ leg, x0, x1 }) => (x1 - x0 >= NUM + 4) && (
          <g key={`n${leg.n}`} transform={`translate(${((x0 + x1) / 2 - NUM / 2).toFixed(1)} ${NUM_Y})`}>
            <circle className="elevation__num-bg" cx={NUM / 2} cy={NUM / 2} r={NUM / 2 - 0.75} />
            <text className="elevation__num" x={NUM / 2} y={NUM / 2 + 4} textAnchor="middle">{leg.n}</text>
          </g>
        ))}
        {data.ticks.map((t, i) => (
          <text key={i} className="elevation__label" x={t.x} y={H - 4} textAnchor={t.align}>{t.label}</text>
        ))}
      </svg>
    </figure>
  )
}
