/*
 * Route e track di prova sul Garda (Alto Garda, Valle di Ledro, Tremosine).
 *
 * Tracciati: generati con BRouter (profilo mtb) su dati OpenStreetMap, tra
 * località reali; quota dal modello del terreno di BRouter. Vedi
 * scripts/README-garda.md. Geometria in garda-geometry.json (polyline codificata
 * lat, lon, quota; precisione 1e-5), più la ripartizione del fondo in metri.
 *
 * Nomi delle track, livelli ITRS e rating delle route: inventati ma verosimili,
 * a scopo di test. La route 733 riprende la scheda ufficiale del cliente
 * (ITRS_fonte_garda_733.md): Intermediate con tratti Advanced, esposizione Fatal.
 * Malga Ciapa riprende nomi e livelli di ITRS_contesto.md §2.
 */
import GEOMETRY from './garda-geometry.json'
// Foto delle route e delle track (pacchetto di Paolo, 10 nov 2026): verticali 499×828 in
// src/assets/photos/garda/NN.webp. Nei riquadri orizzontali si ritaglia una fascia: `y` è la
// posizione verticale del soggetto (object-position).
const FILES = import.meta.glob('../assets/photos/garda/*.webp', { eager: true, import: 'default' })
const FOCUS = {
  1: 45, 2: 40, 3: 65, 4: 55, 5: 60, 6: 50, 7: 62, 8: 38, 9: 78, 10: 60, 11: 85,
  12: 55, 13: 68, 14: 68, 15: 55, 16: 66, 17: 62, 18: 72, 19: 75, 20: 74, 21: 50, 22: 72,
}
const PHOTO = Object.fromEntries(Object.entries(FILES).map(([path, src]) => {
  const n = Number(path.match(/(\d+)\.webp$/)[1])
  return [n, { photo: src, photoPosition: `50% ${FOCUS[n] ?? 50}%` }]
}))
const ALL_PHOTOS = Object.keys(PHOTO).map(Number).sort((x, y) => x - y)
// Foto della "galleria del telefono" simulata nella review e nella segnalazione (4.1, 4.2)
export const DEVICE_PHOTOS = ALL_PHOTOS.map((n) => PHOTO[n])

// Copertina di ogni route, scelta per carattere del percorso
const ROUTE_COVER = {
  'tremalzo-xxl': 10, 'malga-ciapa': 4, 'passo-nota-limone': 3, 'monte-brione': 15, 'lago-di-tenno': 13,
  'arco-laghel': 22, 'nago-busatte': 8, 'lago-di-ledro': 16, 'concei-cima-oro': 12,
}
// Track: foto per tipo (ciclabile e lungolago, salita, discesa, sentiero), a rotazione
const TRACK_KIND_PHOTOS = {
  path: [18, 14, 22, 16, 13, 6],
  climb: [9, 21, 11, 10, 5, 7, 19],
  descent: [8, 20, 3, 1, 15],
  trail: [12, 17, 2, 4, 16, 14],
}
function trackKind(name) {
  if (/Ciclabile|Lungolago|Strada del Ponale|Strada di Pregasina|Borgo/.test(name)) return 'path'
  if (/Salita|Accesso|Ponale Alto|Strada militare|Passo|Bocca/.test(name)) return 'climb'
  if (/Discesa|Ritorno/.test(name)) return 'descent'
  return 'trail'
}
const kindCount = {}
function trackCover(name) {
  const kind = trackKind(name)
  const list = TRACK_KIND_PHOTOS[kind]
  const i = kindCount[kind] = (kindCount[kind] ?? -1) + 1
  return list[i % list.length]
}

// Galleria: la copertina e le 4 foto successive dell'elenco, senza ripetizioni
const GALLERY_SIZE = 5
const galleryFrom = (cover) => {
  const start = ALL_PHOTOS.indexOf(cover)
  return Array.from({ length: Math.min(GALLERY_SIZE, ALL_PHOTOS.length) }, (_, k) => PHOTO[ALL_PHOTOS[(start + k * 3) % ALL_PHOTOS.length]])
}
// Località della track → provincia e regione, come nelle card del Figma
const REGION = {
  'Tremosine sul Garda': 'Brescia, Lombardy, Italy',
  'Limone sul Garda': 'Brescia, Lombardy, Italy',
}
const placeOf = (town) => `${town}, ${REGION[town] ?? 'Trentino, Italy'}`

// ---------- Track ----------
// difficulty ed exposure: chiavi di LEVELS (data/itrs.js)
const TRACK_META = {
  // Riva, Ponale, Pregasina
  P1:  { name: 'Strada del Ponale', place: 'Riva del Garda', difficulty: 'green', exposure: 'blue' },
  P1b: { name: 'Ponale Alto', place: 'Ledro', difficulty: 'green', exposure: 'green' },
  P2:  { name: 'Strada di Pregasina', place: 'Riva del Garda', difficulty: 'green', exposure: 'blue' },
  // Valle di Ledro
  VL1: { name: 'Sentiero di Prè', place: 'Ledro', difficulty: 'blue', exposure: 'green' },
  LD1: { name: 'Lungolago di Ledro Nord', place: 'Ledro', difficulty: 'green', exposure: 'green' },
  LD2: { name: 'Lungolago di Ledro Sud', place: 'Ledro', difficulty: 'green', exposure: 'green' },
  VL2: { name: 'Ciclabile Valle di Ledro', place: 'Ledro', difficulty: 'green', exposure: 'green' },
  CO1: { name: 'Valle di Concei', place: 'Ledro', difficulty: 'green', exposure: 'green' },
  CO2: { name: 'Salita a Malga Trat', place: 'Ledro', difficulty: 'blue', exposure: 'green' },
  CO3: { name: "Sentiero di Cima d'Oro", place: 'Ledro', difficulty: 'red', exposure: 'red' },
  // Tremalzo e passi
  TZ1: { name: 'Salita al Tremalzo', place: 'Ledro', difficulty: 'blue', exposure: 'green' },
  TZ2: { name: 'Strada militare del Tremalzo', place: 'Ledro', difficulty: 'blue', exposure: 'black' },
  FT1: { name: 'Passo Nota – Bocca dei Fortini', place: 'Tremosine sul Garda', difficulty: 'blue', exposure: 'blue' },
  FT2: { name: 'Bocca dei Fortini – Passo Guil', place: 'Ledro', difficulty: 'blue', exposure: 'red' },
  GU1: { name: 'Discesa di Pregasina', place: 'Riva del Garda', difficulty: 'red', exposure: 'blue' },
  NT1: { name: 'Valle di Bondo', place: 'Tremosine sul Garda', difficulty: 'blue', exposure: 'blue' },
  LM1: { name: 'Discesa su Limone', place: 'Limone sul Garda', difficulty: 'black', exposure: 'red' },
  // Tremosine (Malga Ciapa, nomi da ITRS_contesto.md §2)
  MCa: { name: 'Accesso Malga Ciapa', place: 'Tremosine sul Garda', difficulty: 'green', exposure: 'green' },
  MCb: { name: 'Bosco di Tremosine', place: 'Tremosine sul Garda', difficulty: 'green', exposure: 'green' },
  MCc: { name: 'Traverso Panorama Garda', place: 'Tremosine sul Garda', difficulty: 'blue', exposure: 'blue' },
  MCd: { name: 'Salita Rocchetta', place: 'Tremosine sul Garda', difficulty: 'blue', exposure: 'green' },
  // Monte Brione, Torbole, Nago
  MB1: { name: 'Salita del Brione', place: 'Riva del Garda', difficulty: 'blue', exposure: 'blue' },
  MB2: { name: 'Discesa Forte Garda', place: 'Riva del Garda', difficulty: 'red', exposure: 'blue' },
  MB3: { name: 'Lungolago Torbole – Riva', place: 'Nago-Torbole', difficulty: 'green', exposure: 'green' },
  NG1: { name: 'Salita di Nago', place: 'Nago-Torbole', difficulty: 'green', exposure: 'green' },
  NG2: { name: 'Marmitte dei Giganti', place: 'Nago-Torbole', difficulty: 'blue', exposure: 'blue' },
  NG3: { name: 'Discesa delle Busatte', place: 'Nago-Torbole', difficulty: 'blue', exposure: 'green' },
  // Tenno, Arco, Sarca
  TN1: { name: 'Ciclabile del Varone', place: 'Riva del Garda', difficulty: 'green', exposure: 'green' },
  TN2: { name: 'Salita di Tenno', place: 'Tenno', difficulty: 'blue', exposure: 'green' },
  TN3: { name: 'Borgo di Canale', place: 'Tenno', difficulty: 'green', exposure: 'green' },
  TN4: { name: 'Discesa di Campi', place: 'Riva del Garda', difficulty: 'blue', exposure: 'blue' },
  CA:  { name: 'Ciclabile Riva – Arco', place: 'Arco', difficulty: 'green', exposure: 'green' },
  AR1: { name: 'Salita di Laghel', place: 'Arco', difficulty: 'blue', exposure: 'green' },
  AR2: { name: 'Ritorno su Arco', place: 'Arco', difficulty: 'blue', exposure: 'green' },
  CT:  { name: 'Ciclabile del Sarca', place: 'Nago-Torbole', difficulty: 'green', exposure: 'green' },
}

// ---------- Dati per i filtri (passo 1.4) ----------
// Inventati ma verosimili, come nomi e livelli (ITRS_dati_garda.md). Non sono dati ITRS.
// Senso unico: discese e sentieri stretti. Le altre track sono percorribili nei due sensi.
const ONE_WAY = new Set(['VL1', 'CO3', 'GU1', 'LM1', 'MB2', 'NG3', 'TN4'])
// Technical trail features per track (chiavi di TTF_TYPES in data/filters.js)
const TRACK_TTF = {
  VL1: ['other'],
  CO3: ['drop', 'skinny'],
  GU1: ['drop'],
  LM1: ['drop', 'other'],
  MB2: ['jump', 'drop', 'teeter'],
  NG3: ['jump'],
  TN4: ['jump', 'wallride'],
  AR2: ['pump'],
}
// Accessibilità della partenza: bus/treno, auto, famiglie (route). "Wet weather friendly"
// si calcola dal fondo: meno del 15% di single trail.
const ROUTE_ACCESS = {
  'tremalzo-xxl': ['bus', 'car'],
  'malga-ciapa': ['car', 'family'],
  'passo-nota-limone': ['car'],
  'monte-brione': ['bus', 'car'],
  'lago-di-tenno': ['bus', 'car'],
  'arco-laghel': ['bus', 'car', 'family'],
  'nago-busatte': ['bus', 'family'],
  'lago-di-ledro': ['bus', 'car', 'family'],
  'concei-cima-oro': ['car'],
}

// ---------- Route ----------
// tracks: in ordine di percorrenza; '-' davanti = track percorsa al contrario
const ROUTE_DEFS = [
  {
    id: 'tremalzo-xxl', ref: '733', name: 'Tremalzo Garda XXL Tour', place: 'Riva del Garda, Trentino, Italy',
    tracks: ['P1', 'P1b', 'VL1', 'LD1', 'VL2', 'TZ1', 'TZ2', 'FT1', 'FT2', 'GU1', 'P2', '-P1'],
    ratings: { difficulty: 'blue', fitness: 'black', exposure: 'black', wilderness: 'red' },
  },
  {
    id: 'malga-ciapa', ref: '761', name: 'Malga Ciapa, Tremosine sul Garda', place: 'Brescia, Lombardy, Italy',
    tracks: ['MCa', 'MCb', 'MCc', 'MCd'],
    ratings: { difficulty: 'green', fitness: 'blue', exposure: 'green', wilderness: 'blue' },
  },
  {
    id: 'passo-nota-limone', ref: '764', name: 'Passo Nota e Limone', place: 'Brescia, Lombardy, Italy',
    tracks: ['NT1', 'FT1', 'LM1'],
    ratings: { difficulty: 'black', fitness: 'red', exposure: 'black', wilderness: 'red' },
  },
  {
    id: 'monte-brione', ref: '741', name: 'Monte Brione', place: 'Riva del Garda, Trentino, Italy',
    tracks: ['MB1', 'MB2', 'MB3'],
    ratings: { difficulty: 'red', fitness: 'green', exposure: 'blue', wilderness: 'green' },
  },
  {
    id: 'lago-di-tenno', ref: '711', name: 'Lago di Tenno e Canale', place: 'Riva del Garda, Trentino, Italy',
    tracks: ['TN1', 'TN2', 'TN3', 'TN4'],
    ratings: { difficulty: 'blue', fitness: 'blue', exposure: 'blue', wilderness: 'green' },
  },
  {
    id: 'arco-laghel', ref: '702', name: 'Arco e Laghel dal Lago', place: 'Riva del Garda, Trentino, Italy',
    tracks: ['CA', 'AR1', 'AR2', 'CT', 'MB3'],
    ratings: { difficulty: 'green', fitness: 'green', exposure: 'green', wilderness: 'green' },
  },
  {
    id: 'nago-busatte', ref: '745', name: 'Nago e Busatte', place: 'Nago-Torbole, Trentino, Italy',
    tracks: ['NG1', 'NG2', 'NG3'],
    ratings: { difficulty: 'blue', fitness: 'green', exposure: 'blue', wilderness: 'green' },
  },
  {
    id: 'lago-di-ledro', ref: '720', name: 'Giro del Lago di Ledro', place: 'Ledro, Trentino, Italy',
    tracks: ['LD1', 'LD2'],
    ratings: { difficulty: 'green', fitness: 'green', exposure: 'green', wilderness: 'green' },
  },
  {
    id: 'concei-cima-oro', ref: '725', name: "Valle di Concei e Cima d'Oro", place: 'Ledro, Trentino, Italy',
    tracks: ['LD1', 'CO1', 'CO2', 'CO3'],
    ratings: { difficulty: 'red', fitness: 'red', exposure: 'red', wilderness: 'blue' },
  },
]

// Posizione dell'utente simulata: lungolago di Riva del Garda.
// I tester sono altrove: la posizione vera porterebbe la mappa fuori dall'area.
export const USER_POSITION = [10.8430, 45.8836]

// ---------- Calcoli ----------
function decode(str) {
  const out = []
  let i = 0, lat = 0, lon = 0, ele = 0
  const next = () => {
    let r = 0, sh = 0, b
    do { b = str.charCodeAt(i++) - 63; r |= (b & 0x1f) << sh; sh += 5 } while (b >= 0x20)
    return r & 1 ? ~(r >> 1) : r >> 1
  }
  while (i < str.length) {
    lat += next(); lon += next(); ele += next()
    out.push([lon / 1e5, lat / 1e5, ele])
  }
  return out
}

function meters(a, b) {
  const R = 6371000, toRad = Math.PI / 180
  const dLat = (b[1] - a[1]) * toRad, dLon = (b[0] - a[0]) * toRad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Dislivello: quota media mobile su 250 m (il modello del terreno è rumoroso
// lungo le pareti, es. Ponale) e isteresi di 5 m
function climbOf(points) {
  const dist = [0]
  for (let i = 1; i < points.length; i++) dist.push(dist[i - 1] + meters(points[i - 1], points[i]))
  const smooth = points.map((_, i) => {
    let sum = 0, n = 0
    for (let j = i; j >= 0 && dist[i] - dist[j] <= 125; j--) { sum += points[j][2]; n++ }
    for (let j = i + 1; j < points.length && dist[j] - dist[i] <= 125; j++) { sum += points[j][2]; n++ }
    return sum / n
  })
  let up = 0, down = 0, ref = smooth[0]
  for (const e of smooth) {
    const d = e - ref
    if (d >= 5) { up += d; ref = e } else if (d <= -5) { down -= d; ref = e }
  }
  return { up: Math.round(up), down: Math.round(down) }
}

function bboxOf(points) {
  let w = 180, s = 90, e = -180, n = -90
  for (const [x, y] of points) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y }
  return [[w, s], [e, n]]
}

function pointAtHalf(points) {
  const total = points.reduce((acc, p, i) => (i ? acc + meters(points[i - 1], p) : 0), 0)
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const d = meters(points[i - 1], points[i])
    if (acc + d >= total / 2) {
      const t = d ? (total / 2 - acc) / d : 0
      const [a, b] = [points[i - 1], points[i]]
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    }
    acc += d
  }
  return points[0].slice(0, 2)
}

// Tempo stimato in MTB: 14 km/h in piano più 1 h ogni 600 m di salita
function durationMin(km, up) {
  return Math.round(((km / 14) + (up / 600)) * 60 / 5) * 5
}

function surfaceShare(s) {
  const tot = s.road + s.gravel + s.single || 1
  return { road: s.road / tot, gravel: s.gravel / tot, single: s.single / tot }
}

const covers = Object.fromEntries(Object.entries(TRACK_META).map(([id, meta]) => [id, trackCover(meta.name)]))
export const TRACKS = Object.entries(TRACK_META).map(([id, meta]) => {
  const g = GEOMETRY[id]
  const points = decode(g.line)
  const { up, down } = climbOf(points)
  const km = g.len / 1000
  return {
    id,
    kind: 'track',
    ...meta,
    place: placeOf(meta.place),
    level: meta.difficulty,
    ...PHOTO[covers[id]],
    photos: galleryFrom(covers[id]),
    points,                                  // [lon, lat, quota]
    km,
    climb: up,
    descent: down,
    minutes: durationMin(km, up),
    surface: surfaceShare(g.surface),
    bbox: bboxOf(points),
    pin: pointAtHalf(points),                // il pin della track sta a metà percorso
    town: meta.place,
    towns: [meta.place],
    oneWay: ONE_WAY.has(id),
    ttf: TRACK_TTF[id] ?? [],
  }
})

const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]))

export const ROUTES = ROUTE_DEFS.map((def) => {
  const legs = def.tracks.map((key) => {
    const reverse = key.startsWith('-')
    const track = TRACK_BY_ID[key.replace('-', '')]
    return { track, reverse, points: reverse ? [...track.points].reverse() : track.points }
  })
  const points = legs.flatMap((leg, i) => (i ? leg.points.slice(1) : leg.points))
  const km = legs.reduce((acc, leg) => acc + leg.track.km, 0)
  const { up, down } = climbOf(points)
  const surf = legs.reduce((acc, leg) => {
    const s = GEOMETRY[leg.track.id].surface
    return { road: acc.road + s.road, gravel: acc.gravel + s.gravel, single: acc.single + s.single }
  }, { road: 0, gravel: 0, single: 0 })
  const surface = surfaceShare(surf)
  const access = [...(ROUTE_ACCESS[def.id] ?? [])]
  if (surface.single < 0.15) access.push('wet')
  return {
    id: def.id,
    kind: 'route',
    ref: def.ref,
    name: def.name,
    place: def.place,
    ratings: def.ratings,
    level: def.ratings.difficulty,
    ...PHOTO[ROUTE_COVER[def.id]],
    photos: galleryFrom(ROUTE_COVER[def.id]),
    legs: legs.map(({ track, reverse }) => ({ trackId: track.id, reverse })),
    points,
    km,
    climb: up,
    descent: down,
    minutes: durationMin(km, up),
    surface,
    bbox: bboxOf(points),
    pin: points[0].slice(0, 2),              // il pin della route sta alla partenza
    towns: [...new Set([def.place.split(',')[0], ...legs.map((leg) => leg.track.town)])].filter((t) => t !== 'Brescia'), // località (ricerca)
    // Filtri: senso unico se ne ha una track; anello se arrivo e partenza distano meno di 500 m
    oneWay: legs.some((leg) => leg.track.oneWay),
    loop: meters(points[0], points[points.length - 1]) < 500,
    ttf: [...new Set(legs.flatMap((leg) => leg.track.ttf))],
    access,
  }
})

// Testi già formattati per le card (§8)
for (const it of [...TRACKS, ...ROUTES]) {
  it.distance = fmtKm(it.km)
  it.climbLabel = fmtClimb(it.climb)
  it.duration = fmtDuration(it.minutes)
}

// Riquadro che contiene più riquadri [[w, s], [e, n]]
export function unionBox(boxes) {
  return bboxOf(boxes.flat())
}

// Area di tutti i percorsi, per la vista iniziale
export const ALL_BOUNDS = bboxOf(ROUTES.flatMap((r) => r.points))

// ---------- Formati (istruzioni §8) ----------
export function fmtKm(km) {
  return `${km < 20 ? km.toFixed(2) : km.toFixed(1)} km`
}
export function fmtClimb(m) {
  return `+${m} m`
}
export function fmtDuration(min) {
  const h = Math.floor(min / 60), m = min % 60
  if (!h) return `~${m}m`
  return m ? `~${h}h ${m}m` : `~${h}h`
}

// ---------- Track di una route, in ordine di percorrenza (pagina route, passo 2.1) ----------
// n: numero mostrato su mappa e grafico; points già nel verso di percorrenza;
// startKm / endKm: posizione lungo la route (per il grafico altimetrico).
const LEGS_CACHE = new Map()
export function legsOf(route) {
  if (LEGS_CACHE.has(route.id)) return LEGS_CACHE.get(route.id)
  let at = 0
  const legs = route.legs.map(({ trackId, reverse }, i) => {
    const track = TRACK_BY_ID[trackId]
    const points = reverse ? [...track.points].reverse() : track.points
    const leg = { n: i + 1, track, reverse, points, level: track.difficulty, km: track.km, startKm: at, endKm: at + track.km }
    at += track.km
    return leg
  })
  LEGS_CACHE.set(route.id, legs)
  return legs
}

// Punto a metà di una linea [lon, lat, …] (numero della track sulla mappa)
export function midpointOf(points) {
  return pointAtHalf(points)
}

// Profilo altimetrico: [km, quota] lungo una linea, quota media mobile su ±60 m.
// Le distanze si scalano sulla lunghezza ufficiale della track (km), come nel resto dell'app.
export function profileOf(points, startKm = 0, km) {
  const dist = [0]
  for (let i = 1; i < points.length; i++) dist.push(dist[i - 1] + meters(points[i - 1], points[i]))
  return points.map((_, i) => {
    let sum = 0, n = 0
    for (let j = i; j >= 0 && dist[i] - dist[j] <= 60; j--) { sum += points[j][2]; n++ }
    for (let j = i + 1; j < points.length && dist[j] - dist[i] <= 60; j++) { sum += points[j][2]; n++ }
    const total = dist[dist.length - 1] || 1
    return [startKm + (km != null ? (dist[i] / total) * km : dist[i] / 1000), sum / n]
  })
}

// ---------- Track nei due contesti (passo 2.3, contesto §4.7) ----------
// Una track vista come "route" di una sola track, nel verso di percorrenza: così mappa
// (RouteMap) e grafico (ElevationProfile) funzionano uguali per route e track.
// reverse: track percorsa al contrario dentro una route (salita e discesa si scambiano).
const SOLO_CACHE = new Map()
export function trackAsRoute(track, reverse = false) {
  const id = `track:${track.id}${reverse ? ':r' : ''}`
  if (SOLO_CACHE.has(id)) return SOLO_CACHE.get(id)
  const points = reverse ? [...track.points].reverse() : track.points
  const climb = reverse ? track.descent : track.climb
  const descent = reverse ? track.climb : track.descent
  const minutes = reverse ? durationMin(track.km, climb) : track.minutes
  const solo = {
    ...track,
    id,
    trackId: track.id,
    reverse,
    legs: [{ trackId: track.id, reverse }],
    points,
    climb,
    descent,
    minutes,
    climbLabel: fmtClimb(climb),
    duration: fmtDuration(minutes),
  }
  SOLO_CACHE.set(id, solo)
  return solo
}

// Route che passano da una track (sezione "Routes featuring this track")
export function routesWithTrack(trackId) {
  return ROUTES.filter((r) => r.legs.some((leg) => leg.trackId === trackId))
}

export const TRACK_BY_KEY = TRACK_BY_ID
