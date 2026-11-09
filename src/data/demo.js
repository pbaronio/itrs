/*
 * Dati di esempio per la galleria dei componenti (passo 0.3).
 * Testi e valori ripresi dal Figma (pagina UI Design) e da ITRS_contesto.md §2,
 * con le correzioni del §8 delle istruzioni (formati, "Some planning").
 * I dati veri di route e track arrivano con la fase 1.
 */
import riders from '../assets/photos/riders.webp'
import trail from '../assets/photos/trail-thumb.webp'

export const ROUTES = [
  {
    id: 'malga-ciapa',
    name: 'Malga Ciapa, Tremosine sul Garda',
    place: 'Brescia, Lombardy, Italy',
    level: 'green',
    distance: '12.75 km',
    climb: '+291 m',
    duration: '~1h 50m',
    photo: riders,
    photoPosition: '50% 62%',
    ratings: { difficulty: 'green', exposure: 'green', fitness: 'blue', wilderness: 'blue' },
  },
  {
    id: 'cima-mughera',
    name: 'Cima Mughera, Bocchetta di Nansesa',
    place: 'Brescia, Lombardy, Italy',
    level: 'red',
    distance: '2.75 km',
    duration: '~1h 50m',
    photo: trail,
    photoPosition: '50% 40%',
  },
]

// Testo del bottom sheet informativo Beginner (Figma 3625:20072)
export const LEVEL_INFO = {
  'difficulty-green': {
    title: 'Perfect For Beginners and families',
    text: 'Suitable for anyone who can confidently and safely ride a bicycle, including families with children. No previous mountain biking experience or specific technical skills are required.',
  },
}

// Impostazioni della pagina Controlli (Figma 3711:28957)
export const SETTINGS = [
  { id: 'lock', title: 'Lock screen', detail: 'Prevents accidental touches', on: false },
  { id: 'voice', title: 'Voice cues', detail: 'Next track and difficulty', on: true },
  { id: 'pause', title: 'Auto-pause', detail: 'When you stop riding', on: true },
]
