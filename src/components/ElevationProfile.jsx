import { useEffect, useMemo, useRef, useState } from 'react'
import { LEVELS } from '../data/itrs.js'
import { fmtKm, legsOf, profileOf } from '../data/garda.js'
import { haptic } from '../haptic.js'
import './ElevationProfile.css'

/*
 * Grafico altimetrico (Figma Profile/Elevation 3686:3855, istruzioni §6, contesto §4.6), 370×162.
 * - Linea 3 col colore di difficoltà di ogni track, area dello stesso colore al 12%.
 * - Separatori tratteggiati stroke-sub-200 tra le track, numeri 22 come sulla mappa.
 * - Due linee guida tratteggiate con quota, asse orizzontale con 0, metà e fine in km.
 * - Trascinamento (variante Scrubbing, passo 2.2): col dito sul grafico compaiono una linea
 *   verticale, un punto nero sulla curva e una maniglia nera sull'asse. I valori del punto
 *   (distanza, quota, pendenza, track e livello) vanno a chi usa il grafico con `onScrub`,
 *   che li mostra nella riga in alto e muove il punto sulla mappa. Al rilascio `onScrub(null)`.
 *   Vibrazione leggera al cambio di track [P]. Da tastiera: frecce, Home, Fine, Esc.
 */
const W = 370
const H = 162
const AXIS_Y = 140           // asse orizzontale
const TOP = 14               // quota massima
const BOTTOM = 100           // quota minima: la curva resta sopra i numeri delle track
const NUM = 22               // numeri delle track
const NUM_Y = 108
const GRADE_SPAN = 0.1       // pendenza misurata su ±100 m

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

// Ultimo indice con kms[i] <= km
function indexAt(kms, km) {
  let lo = 0, hi = kms.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (kms[mid] <= km) lo = mid; else hi = mid - 1
  }
  return lo
}

export default function ElevationProfile({ route, onScrub }) {
  const data = useMemo(() => {
    const legs = legsOf(route)
    const total = legs[legs.length - 1].endKm
    const series = legs.map((leg) => ({ leg, pts: profileOf(leg.points, leg.startKm, leg.km) }))
    let min = Infinity, max = -Infinity
    for (const { pts } of series) for (const [, e] of pts) { if (e < min) min = e; if (e > max) max = e }
    if (max - min < 20) { min -= 10; max += 10 }
    const x = (km) => (km / total) * W
    const y = (e) => BOTTOM - ((e - min) / (max - min)) * (BOTTOM - TOP)

    // Tutti i punti della route in fila: km, quota (media mobile), posizione e track
    const kms = [], eles = [], lngs = [], lats = []
    series.forEach(({ pts }, li) => {
      const points = legs[li].points
      pts.forEach(([km, e], i) => {
        if (kms.length && km < kms[kms.length - 1]) return
        kms.push(km); eles.push(e); lngs.push(points[i][0]); lats.push(points[i][1])
      })
    })

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
    return { legs, paths, grid, total, x, y, kms, eles, lngs, lats, ticks: [
      { label: '0', x: 0, align: 'start' },
      { label: `${mid} km`, x: x(mid), align: 'middle' },
      { label: `${end} km`, x: Math.min(x(end), W), align: 'end' },
    ] }
  }, [route])

  // Valori del grafico a una distanza (interpolati tra i due punti vicini)
  const sampleAt = (km) => {
    const { kms, eles, lngs, lats, legs, total } = data
    km = Math.min(Math.max(km, 0), total)
    const eleAt = (k) => {
      const i = indexAt(kms, k)
      if (i >= kms.length - 1) return eles[eles.length - 1]
      const t = (k - kms[i]) / ((kms[i + 1] - kms[i]) || 1)
      return eles[i] + (eles[i + 1] - eles[i]) * t
    }
    const i = indexAt(kms, km)
    const j = Math.min(i + 1, kms.length - 1)
    const t = j > i ? (km - kms[i]) / ((kms[j] - kms[i]) || 1) : 0
    const a = Math.max(0, km - GRADE_SPAN)
    const b = Math.min(total, km + GRADE_SPAN)
    const grade = b > a ? ((eleAt(b) - eleAt(a)) / ((b - a) * 1000)) * 100 : 0
    // Track: dai confini ufficiali (startKm/endKm), non dai punti
    let li = legs.findIndex((leg) => km < leg.endKm)
    if (li < 0) li = legs.length - 1
    return {
      km,
      ele: eleAt(km),
      grade: Math.round(grade),
      lngLat: [lngs[i] + (lngs[j] - lngs[i]) * t, lats[i] + (lats[j] - lats[i]) * t],
      leg: legs[li],
    }
  }

  const [scrub, setScrub] = useState(null)     // campione mostrato (null = nessun trascinamento)
  const svgRef = useRef(null)
  const active = useRef(null)                  // pointerId del dito o del mouse che trascina
  const lastLeg = useRef(null)
  const cb = useRef(onScrub)
  cb.current = onScrub

  const show = (s, withHaptic) => {
    if (withHaptic && lastLeg.current != null && s.leg.n !== lastLeg.current) haptic()
    lastLeg.current = s.leg.n
    setScrub(s)
    cb.current?.(s)
  }
  const clear = () => {
    lastLeg.current = null
    setScrub(null)
    cb.current?.(null)
  }
  const kmFromClient = (clientX) => {
    const rect = svgRef.current.getBoundingClientRect()
    return ((clientX - rect.left) / rect.width) * data.total
  }

  // Il grafico tiene per sé tocco e mouse: il pannello sotto non deve trascinarsi
  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const stop = (e) => e.stopPropagation()
    el.addEventListener('touchstart', stop, { passive: true })
    el.addEventListener('mousedown', stop)
    return () => {
      el.removeEventListener('touchstart', stop)
      el.removeEventListener('mousedown', stop)
    }
  }, [])

  // Nuova route: niente cursore rimasto
  useEffect(() => { setScrub(null); lastLeg.current = null }, [route.id])

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (active.current != null) return
    active.current = e.pointerId
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* puntatore già finito */ }
    show(sampleAt(kmFromClient(e.clientX)), false)
  }
  const onPointerMove = (e) => {
    if (e.pointerId !== active.current) return
    show(sampleAt(kmFromClient(e.clientX)), true)
  }
  const onPointerEnd = (e) => {
    if (e.pointerId !== active.current) return
    active.current = null
    clear()
  }

  const onKeyDown = (e) => {
    const step = data.total / (e.shiftKey ? 10 : 100)
    const from = scrub ? scrub.km : 0
    let km = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') km = from + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') km = from - step
    else if (e.key === 'Home') km = 0
    else if (e.key === 'End') km = data.total
    else if (e.key === 'Escape' && scrub) { e.preventDefault(); clear(); return }
    if (km == null) return
    e.preventDefault()
    show(sampleAt(km), false)
  }

  const cx = scrub ? data.x(scrub.km) : 0
  const cy = scrub ? data.y(scrub.ele) : 0

  return (
    <figure
      className={`elevation${scrub ? ' is-scrubbing' : ''}`}
      role="slider"
      tabIndex={0}
      aria-label={`Elevation profile, ${route.distance}, ${route.climbLabel}. Drag to explore the route`}
      aria-valuemin={0}
      aria-valuemax={Number(data.total.toFixed(2))}
      aria-valuenow={scrub ? Number(scrub.km.toFixed(2)) : 0}
      aria-valuetext={scrub ? scrubLabel(scrub, data.legs.length) : 'Start'}
      onKeyDown={onKeyDown}
      onBlur={() => scrub && clear()}
    >
      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
      >
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
        {/* Cursore: linea verticale, punto sulla curva, maniglia sull'asse */}
        {scrub && (
          <g className="elevation__cursor">
            <line className="elevation__cursor-line" x1={cx} x2={cx} y1="0" y2={AXIS_Y} />
            <circle className="elevation__cursor-dot" cx={cx} cy={cy} r="7" />
            <circle className="elevation__cursor-handle" cx={cx} cy={AXIS_Y} r="5" />
          </g>
        )}
      </svg>
    </figure>
  )
}

// Valori del punto per la riga in alto e per i lettori di schermo
export function fmtGrade(grade) {
  return `${grade > 0 ? '+' : grade < 0 ? '\u2212' : ''}${Math.abs(grade)}%`
}
export function fmtEle(ele) {
  return `${Math.round(ele)} m`
}
function scrubLabel(s, count) {
  return `${fmtKm(s.km)}, ${fmtEle(s.ele)}, grade ${fmtGrade(s.grade)}, track ${s.leg.n} of ${count}`
}
