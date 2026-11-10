/*
 * Giro simulato (passo 3.1, piano: "il giro avanza da solo, con un tasto per accelerare").
 * Il ciclista virtuale segue il tracciato vero della route o della track, alla velocità di una
 * MTB: 14 km/h in piano più 1 h ogni 600 m di salita (come la durata stimata delle card),
 * 20 km/h in discesa. Il tempo simulato avanza col tempo reale moltiplicato per la velocità
 * scelta (1×, 5×, 20×).
 * Distanze e salite si scalano sui valori ufficiali di ogni track (km e +m mostrati nelle pagine),
 * così pannello, liste e grafico dicono gli stessi numeri.
 */
import { ROUTES, TRACK_BY_KEY, legsOf, profileOf, trackAsRoute } from './garda.js'

export const SPEEDS = [1, 5, 20]

// Route o track (anche dentro una route, nel suo verso) dall'id usato nella cronologia
export function rideItem(id) {
  if (!id) return null
  if (id.startsWith('track:')) {
    const [, trackId, rev] = id.split(':')
    const track = TRACK_BY_KEY[trackId]
    return track ? trackAsRoute(track, rev === 'r') : null
  }
  return ROUTES.find((r) => r.id === id) ?? null
}

// Id da mettere nella cronologia per una route, una track della mappa o una track di una route
export function rideIdOf(item) {
  if (item.kind === 'route') return item.id
  if (item.trackId) return item.id
  return trackAsRoute(item).id
}

const R = 6371008.8
const rad = (d) => (d * Math.PI) / 180
function meters(a, b) {
  const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export function bearingOf(a, b) {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]))
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/*
 * Percorso del giro: un punto per vertice del tracciato con
 * lngLat, km lungo il giro, quota smussata, secondi dalla partenza, n della track,
 * km fatti nella track, frazione della salita della track già fatta.
 */
const CACHE = new Map()
export function buildRide(item) {
  if (CACHE.has(item.id)) return CACHE.get(item.id)
  const legs = legsOf(item)
  const pts = []
  let t = 0
  for (const leg of legs) {
    const profile = profileOf(leg.points, leg.startKm, leg.km)
    const climb = leg.reverse ? leg.track.descent : leg.track.climb
    // salita smussata cumulata, poi scalata sulla salita ufficiale della track
    const ups = [0]
    for (let i = 1; i < profile.length; i++) ups.push(ups[i - 1] + Math.max(0, profile[i][1] - profile[i - 1][1]))
    const upTot = ups[ups.length - 1] || 1
    leg.points.forEach((p, i) => {
      if (i === 0 && pts.length) return            // il primo punto coincide con l'ultimo della track prima
      const km = profile[i][0]
      const ele = profile[i][1]
      const prev = pts[pts.length - 1]
      if (prev) {
        const dKm = Math.max(0, km - prev.km)
        const dz = ele - prev.ele
        const h = dz >= 0 ? dKm / 14 + dz / 600 : dKm / 20
        t += h * 3600
      }
      pts.push({ lngLat: [p[0], p[1]], km, ele, t, n: leg.n, legKm: km - leg.startKm, legUp: (ups[i] / upTot) * climb })
    })
  }
  const ride = { item, legs, pts, totalKm: legs[legs.length - 1].endKm, totalSec: t }
  CACHE.set(item.id, ride)
  return ride
}

// Indice del segmento [i, i+1] che contiene il tempo t (ricerca binaria)
function segmentAt(pts, key, v) {
  let lo = 0, hi = pts.length - 1
  if (v <= pts[0][key]) return 0
  if (v >= pts[hi][key]) return hi - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (pts[mid][key] <= v) lo = mid
    else hi = mid
  }
  return lo
}
const lerp = (a, b, f) => a + (b - a) * f

// Stato del giro al tempo simulato t (secondi)
export function rideAt(ride, t) {
  const { pts, legs } = ride
  const time = Math.max(0, Math.min(t, ride.totalSec))
  const i = segmentAt(pts, 't', time)
  const a = pts[i], b = pts[i + 1] ?? pts[i]
  const f = b.t > a.t ? (time - a.t) / (b.t - a.t) : 0
  const km = lerp(a.km, b.km, f)
  // la track è quella del punto d'arrivo del segmento (il punto di giunzione chiude la track prima)
  const leg = legs.find((l) => l.n === b.n) ?? legs[0]
  const sameLeg = a.n === b.n
  const legKm = sameLeg ? lerp(a.legKm, b.legKm, f) : f * b.legKm
  const legUp = sameLeg ? lerp(a.legUp, b.legUp, f) : f * b.legUp
  const climb = leg.reverse ? leg.track.descent : leg.track.climb
  // direzione: verso un punto circa 30 m più avanti
  const j = segmentAt(pts, 'km', Math.min(km + 0.03, ride.totalKm))
  const ahead = pts[Math.min(j + 1, pts.length - 1)]
  const lngLat = [lerp(a.lngLat[0], b.lngLat[0], f), lerp(a.lngLat[1], b.lngLat[1], f)]
  const segH = b.t > a.t ? (b.t - a.t) / 3600 : 0
  return {
    t: time,
    finished: time >= ride.totalSec,
    index: i,                                   // ultimo vertice già passato
    lngLat,
    km,
    heading: bearingOf(lngLat, ahead.lngLat),
    speedKmh: segH ? (b.km - a.km) / segH : 0,
    leg,
    legLeftKm: Math.max(0, leg.km - legKm),
    legKmFrac: leg.km ? Math.min(1, legKm / leg.km) : 1,
    legLeftUp: Math.max(0, climb - legUp),
    legUpFrac: climb ? Math.min(1, legUp / climb) : 1,
  }
}

// Linee per la mappa: tratto fatto (grigio) e tratto da fare, diviso per track col suo colore
export function rideLines(ride, state) {
  const { pts } = ride
  const done = pts.slice(0, state.index + 1).map((p) => p.lngLat)
  done.push(state.lngLat)
  const todo = []
  let cur = { n: state.leg.n, coords: [state.lngLat] }
  for (let k = state.index + 1; k < pts.length; k++) {
    const p = pts[k]
    cur.coords.push(p.lngLat)
    const next = pts[k + 1]
    if (next && next.n !== p.n) {             // giunzione: parte la track dopo
      todo.push(cur)
      cur = { n: next.n, coords: [p.lngLat] }
    }
  }
  if (cur.coords.length > 1) todo.push(cur)
  return { done, todo }
}

export { meters }
