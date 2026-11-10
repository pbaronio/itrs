/*
 * Filtri (contesto §4.10, Figma 3625:18436 con le correzioni del §8 delle istruzioni).
 * - Livelli ITRS tutti a checkbox (Exposure compreso).
 * - Dentro una sezione le scelte si sommano (o), tra sezioni valgono tutte (e).
 *   Una sezione senza scelte non filtra.
 * - Fitness, Loop, Wilderness e Accessibility valgono solo per le route: nella vista
 *   Tracks non compaiono e non filtrano (Fitness e Wilderness si applicano solo alle route, §2).
 */
import { LEVEL_KEYS, FACTORS } from './itrs.js'

export const TIME_MAX = 480       // minuti: 8h+ (la route più lunga è ~7h 55m)
export const TIME_STEP = 30
export const LENGTH_MAX = 80      // km: 80+ km, come nel Figma
export const LENGTH_STEP = 5

export const DIRECTIONS = [
  { key: 'one-way', label: 'One-way' },
  { key: 'two-way', label: 'Two ways' },
]
export const LOOPS = [
  { key: 'loop', label: 'Loop (Return to start)' },
  { key: 'p2p', label: 'Point to point (Ends elsewhere)' },
]
export const ACCESS = [
  { key: 'bus', label: 'Close to bus/train station', icon: 'bus' },
  { key: 'car', label: 'Easy to reach by car', icon: 'car' },
  { key: 'family', label: 'Family friendly', icon: 'family' },
  { key: 'wet', label: 'Wet weather friendly', icon: 'rain' },
]
export const TTF_TYPES = [
  { key: 'jump', label: 'Jump' },
  { key: 'drop', label: 'Drop' },
  { key: 'skinny', label: 'North shore/skinny' },
  { key: 'teeter', label: 'Teeter-totter' },
  { key: 'wallride', label: 'Wallride' },
  { key: 'pump', label: 'Pump track' },
  { key: 'other', label: 'Other' },
]

// Livelli previsti per un fattore, nell'ordine della scala
export const levelsOf = (factor) => LEVEL_KEYS.filter((k) => FACTORS[factor].names[k])

export function emptyFilters() {
  return {
    difficulty: [],
    fitness: [],
    time: [0, TIME_MAX],
    length: [0, LENGTH_MAX],
    direction: [],
    exposure: [],
    loop: [],
    wilderness: [],
    access: [],
    ttfWithout: false,
    ttfWith: false,
    ttfTypes: [],
  }
}

const ROUTE_ONLY = ['fitness', 'loop', 'wilderness', 'access']
export const appliesTo = (key, mode) => mode === 'routes' || !ROUTE_ONLY.includes(key)

// Numero di sezioni attive (per il pulsante filtri sulla mappa)
export function activeCount(f, mode) {
  const on = {
    difficulty: f.difficulty.length > 0,
    fitness: f.fitness.length > 0,
    time: f.time[0] > 0 || f.time[1] < TIME_MAX,
    length: f.length[0] > 0 || f.length[1] < LENGTH_MAX,
    direction: f.direction.length > 0,
    exposure: f.exposure.length > 0,
    loop: f.loop.length > 0,
    wilderness: f.wilderness.length > 0,
    access: f.access.length > 0,
    ttf: f.ttfWithout || f.ttfWith || f.ttfTypes.length > 0,
  }
  return Object.entries(on).filter(([k, v]) => v && appliesTo(k, mode)).length
}

export function matches(it, f, mode) {
  const route = mode === 'routes'
  const r = it.ratings ?? { difficulty: it.difficulty, exposure: it.exposure }
  const inSet = (list, v) => !list.length || list.includes(v)

  if (!inSet(f.difficulty, r.difficulty)) return false
  if (!inSet(f.exposure, r.exposure)) return false
  if (route && !inSet(f.fitness, r.fitness)) return false
  if (route && !inSet(f.wilderness, r.wilderness)) return false

  // Intervalli: l'estremo massimo vale "e oltre"
  const [t0, t1] = f.time
  if (it.minutes < t0 || (t1 < TIME_MAX && it.minutes > t1)) return false
  const [l0, l1] = f.length
  if (it.km < l0 || (l1 < LENGTH_MAX && it.km > l1)) return false

  if (!inSet(f.direction, it.oneWay ? 'one-way' : 'two-way')) return false
  if (route && !inSet(f.loop, it.loop ? 'loop' : 'p2p')) return false
  if (route && f.access.length && !f.access.every((a) => it.access.includes(a))) return false

  // TTF: "Without" = nessuna; "With" = almeno una, dei tipi scelti se ce ne sono
  const wantWith = f.ttfWith || f.ttfTypes.length > 0
  if (f.ttfWithout || wantWith) {
    const none = it.ttf.length === 0
    const some = !none && (!f.ttfTypes.length || f.ttfTypes.some((t) => it.ttf.includes(t)))
    if (!((f.ttfWithout && none) || (wantWith && some))) return false
  }
  return true
}

// ---------- Etichette degli slider (formati §8) ----------
const h = (min) => {
  const hh = Math.floor(min / 60), mm = min % 60
  return mm ? `${hh}h ${mm}m` : `${hh}h`
}
export function timeLabel([a, b]) {
  if (a === 0 && b === TIME_MAX) return 'Any'
  if (b === TIME_MAX) return `${h(a)}+`
  if (a === 0) return `Up to ${h(b)}`
  return `${h(a)}–${h(b)}`
}
export function lengthLabel([a, b]) {
  if (a === 0 && b === LENGTH_MAX) return 'Any'
  if (b === LENGTH_MAX) return `${a}+ km`
  if (a === 0) return `Up to ${b} km`
  return `${a}–${b} km`
}
