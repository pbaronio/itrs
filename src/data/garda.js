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

// ---------- Segmenti di difficoltà (richiesta di Paolo, 13 nov) ----------
// Una track è fatta di segmenti, ognuno col suo livello di difficoltà. Il livello della track è
// quello del segmento più difficile [P]. Dati inventati ma verosimili: la track è divisa in tratti
// di ~700 m; i tratti più ripidi o irregolari prendono il livello della track, gli altri quello
// sotto (Expert: i più facili anche due sotto). Beginner: un solo segmento verde.
// segments: [{ from, to, level }] con indici di `points` (to incluso, il punto di confine è comune).
const LEVEL_ORDER = ['green', 'blue', 'red', 'black', 'orange']

function seeded(str) {
  let h = 2166136261
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function segmentsOf(id, points, level) {
  const li = LEVEL_ORDER.indexOf(level)
  const last = points.length - 1
  if (li <= 0 || last < 4) return [{ from: 0, to: last, level }]
  const rnd = seeded(id)
  const dist = [0]
  for (let i = 1; i <= last; i++) dist.push(dist[i - 1] + meters(points[i - 1], points[i]))
  const total = dist[last]
  const n = Math.max(2, Math.min(9, Math.round(total / 700)))
  const cuts = [0]
  for (let k = 1; k < n; k++) {
    const target = (total * (k + (rnd() - 0.5) * 0.6)) / n
    let i = cuts[cuts.length - 1] + 2
    while (i < last - 2 && dist[i] < target) i++
    if (i < last - 2) cuts.push(i)
  }
  cuts.push(last)
  const chunks = []
  for (let k = 0; k < cuts.length - 1; k++) {
    const a = cuts[k], b = cuts[k + 1]
    let rough = 0
    for (let i = a + 1; i <= b; i++) rough += Math.abs(points[i][2] - points[i - 1][2])
    const len = dist[b] - dist[a] || 1
    chunks.push({ from: a, to: b, score: rough / len + rnd() * 0.02 })
  }
  const ranked = [...chunks].sort((x, y) => y.score - x.score)
  const hard = Math.max(1, Math.round(chunks.length * (0.35 + rnd() * 0.25)))
  const easiest = li >= 3 ? Math.floor(chunks.length * 0.2) : 0
  ranked.forEach((c, r) => {
    c.level = r < hard ? level
      : r >= ranked.length - easiest ? LEVEL_ORDER[li - 2]
      : LEVEL_ORDER[li - 1]
  })
  // tratti vicini dello stesso livello diventano un segmento solo
  const out = []
  for (const c of chunks) {
    const prev = out[out.length - 1]
    if (prev && prev.level === c.level) prev.to = c.to
    else out.push({ from: c.from, to: c.to, level: c.level })
  }
  return out
}

// Segmenti nel verso di percorrenza (track al contrario dentro una route)
function segmentsFor(track, reverse) {
  if (!reverse) return track.segments
  const last = track.points.length - 1
  return [...track.segments].reverse().map((sg) => ({ from: last - sg.to, to: last - sg.from, level: sg.level }))
}

// Tratti colorati di una linea: [{ level, coords: [[lng, lat], …] }]
function runsOfLeg(points, segments) {
  return segments.map((sg) => ({ level: sg.level, coords: points.slice(sg.from, sg.to + 1).map((p) => [p[0], p[1]]) }))
}

// Tratti colorati di una route, di una track della mappa o di una track dentro una route
export function runsOf(item) {
  if (!item.legs) return runsOfLeg(item.points, item.segments)
  return legsOf(item).flatMap((leg) => runsOfLeg(leg.points, leg.segments))
}

// Livello di ogni vertice di una track nel verso di percorrenza (navigazione)
export function vertexLevels(leg) {
  const out = new Array(leg.points.length)
  for (const sg of leg.segments) for (let i = sg.from; i <= sg.to; i++) if (!out[i] || i > sg.from) out[i] = sg.level
  return out
}

// ---------- Punti di esposizione (richiesta di Paolo, 13 nov) ----------
// Inventati ma verosimili: nei punti più ripidi della track (pendenza su ±100 m), distanti almeno
// 800 m tra loro e 200 m dalle estremità. Il primo ha il livello di Exposure della track, gli
// altri quello sotto (mai Low risk). Track Low risk: nessun punto [P].
// exposurePts: [{ i, level }] con i = indice in `points`.
function exposurePointsOf(id, points, level) {
  const li = LEVEL_ORDER.indexOf(level)
  if (li <= 0 || points.length < 10) return []
  const last = points.length - 1
  const dist = [0]
  for (let i = 1; i <= last; i++) dist.push(dist[i - 1] + meters(points[i - 1], points[i]))
  const total = dist[last]
  const count = Math.min(3, 1 + (total > 6000 ? 1 : 0) + (li >= 2 && total > 4000 ? 1 : 0))
  const rnd = seeded(`${id}:exp`)
  const steep = []
  let a = 0, b = 0
  for (let i = 0; i <= last; i++) {
    if (dist[i] < 200 || total - dist[i] < 200) continue
    while (dist[i] - dist[a] > 100) a++
    while (b < last && dist[b + 1] - dist[i] <= 100) b++
    const span = dist[b] - dist[a]
    if (span > 50) steep.push({ i, g: Math.abs(points[b][2] - points[a][2]) / span + rnd() * 0.01 })
  }
  steep.sort((x, y) => y.g - x.g)
  const picked = []
  for (const c of steep) {
    if (picked.length >= count) break
    if (picked.every((q) => Math.abs(dist[q.i] - dist[c.i]) >= 800)) picked.push(c)
  }
  return picked
    .map((c, k) => ({ i: c.i, level: k === 0 ? level : LEVEL_ORDER[Math.max(1, li - 1)] }))
    .sort((x, y) => x.i - y.i)
}

// Punti di esposizione di una route o di una track, nel verso di percorrenza:
// [{ level, lngLat, km }] con km lungo la route (stessa scala del grafico altimetrico)
export function exposureOf(item) {
  const legs = item.legs ? legsOf(item) : [{ points: item.points, track: item, reverse: false, startKm: 0, km: item.km }]
  const out = []
  for (const leg of legs) {
    const pts = leg.track.exposurePts ?? []
    if (!pts.length) continue
    const prof = profileOf(leg.points, leg.startKm, leg.km)
    const last = leg.points.length - 1
    for (const p of pts) {
      const i = leg.reverse ? last - p.i : p.i
      out.push({ level: p.level, lngLat: [leg.points[i][0], leg.points[i][1]], km: prof[i][0] })
    }
  }
  return out.sort((x, y) => x.km - y.km)
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
    segments: segmentsOf(id, points, meta.difficulty),
    exposurePts: exposurePointsOf(id, points, meta.exposure),
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
    const leg = { n: i + 1, track, reverse, points, segments: segmentsFor(track, reverse), level: track.difficulty, km: track.km, startKm: at, endKm: at + track.km }
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

// ---------- Dettaglio della difficoltà tecnica di una route (richiesta di Paolo, 13 nov) ----------
// Quanta parte della route è di ogni livello: per ogni track la quota su strada e ciclabile
// (surface.road) è "Road (not rated)", il resto si divide tra i suoi segmenti in proporzione
// alla lunghezza. Restituisce le parti dal livello più facile al più difficile, poi la strada.
export function difficultyBreakdown(route) {
  const km = Object.fromEntries([...LEVEL_ORDER, 'road'].map((k) => [k, 0]))
  for (const leg of legsOf(route)) {
    const { track } = leg
    const road = track.surface?.road ?? 0
    km.road += track.km * road
    const rated = track.km * (1 - road)
    const lens = leg.segments.map((sg) => {
      let d = 0
      for (let i = sg.from + 1; i <= sg.to; i++) d += meters(leg.points[i - 1], leg.points[i])
      return d
    })
    const tot = lens.reduce((a, b) => a + b, 0) || 1
    leg.segments.forEach((sg, i) => { km[sg.level] += (rated * lens[i]) / tot })
  }
  const total = Object.values(km).reduce((a, b) => a + b, 0) || 1
  return [...LEVEL_ORDER, 'road']
    .map((key) => ({ key, km: km[key], share: km[key] / total }))
    .filter((p) => p.share >= 0.001)
}
