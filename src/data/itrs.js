/*
 * Sistema ITRS: livelli, colori e nomi.
 * Fonte: ITRS_contesto.md §2. Non aggiungere livelli né nomi inventati.
 * "Advance" è solo il nome del token Figma: il testo mostrato è "Advanced".
 */

// Chiave del livello → colore (token CSS) e forma
export const LEVELS = {
  green:  { color: 'var(--itrs-green)',  shape: 'circle',   hex: '#34A853' },
  blue:   { color: 'var(--itrs-blue)',   shape: 'square',   hex: '#4285F4' },
  red:    { color: 'var(--itrs-red)',    shape: 'triangle', hex: '#EA4335' },
  black:  { color: 'var(--itrs-black)',  shape: 'diamond',  hex: '#000000' },
  orange: { color: 'var(--itrs-orange)', shape: 'double',   hex: '#DD894B' },
}

export const LEVEL_KEYS = ['green', 'blue', 'red', 'black', 'orange']

// Fattore → nome mostrato per ogni livello (null = livello non previsto)
export const FACTORS = {
  difficulty: {
    label: 'Difficulty',
    appliesTo: ['route', 'track'],
    names: {
      green: 'Beginner',
      blue: 'Intermediate',
      red: 'Advanced',
      black: 'Expert',
      orange: 'Extreme',
    },
  },
  fitness: {
    label: 'Fitness',
    appliesTo: ['route'],
    // "Regular training" e "Frequent hard training" da confermare col cliente
    names: {
      green: 'Generally sportive',
      blue: 'Occasional training',
      red: 'Regular training',
      black: 'Frequent hard training',
      orange: 'Professional training',
    },
  },
  exposure: {
    label: 'Exposure',
    appliesTo: ['route', 'track'],
    names: {
      green: 'Low risk',
      blue: 'High risk',
      red: 'Potentially fatal',
      black: 'Fatal',
      orange: null,
    },
  },
  wilderness: {
    label: 'Wilderness',
    appliesTo: ['route'],
    names: {
      green: 'Civilized area',
      blue: 'Some planning',
      red: 'Careful preparation',
      black: 'Professional planning',
      orange: null,
    },
  },
}

// Ordine nel cerchio, senso orario da in alto a sinistra (istruzioni §5)
export const CIRCLE_ORDER = ['difficulty', 'fitness', 'exposure', 'wilderness']
