/*
 * Perché una route ha quel livello: una frase breve sotto ogni riga rating della pagina route
 * (Figma 3767:35247). Testi inventati ma coerenti con tracciati, track e livelli di prova
 * (ITRS_dati_garda.md): da sostituire con le motivazioni del cliente [P].
 */
const REASONS = {
  'tremalzo-xxl': {
    difficulty: 'Mostly gravel roads; a few rocky Intermediate sections on Tremalzo and the descent to Pregasina.',
    exposure: 'The old military road on Tremalzo runs above vertical drops with no barrier.',
    fitness: 'Over 2,200 m of climbing in a single day, more than 7 hours in the saddle.',
    wilderness: 'Long stretches above 1,500 m with no villages, water or phone signal between Ledro and Passo Nota.',
  },
  'malga-ciapa': {
    difficulty: 'Wide, smooth tracks on the Tremosine plateau, with no technical passages.',
    exposure: 'The trail stays away from cliffs: a fall has no extra consequences.',
    fitness: 'Moderate length with a steady climb to Rocchetta: some regular riding helps.',
    wilderness: 'Villages are close, but the woods between Voltino and Pregasio have patchy signal.',
  },
  'passo-nota-limone': {
    difficulty: 'The descent to Limone is steep, rocky and full of tight hairpins.',
    exposure: 'Above Limone the path crosses slopes where a fall would not stop.',
    fitness: 'A long climb to Passo Nota on loose gravel, followed by a demanding descent.',
    wilderness: 'No shelter or water between Valle di Bondo and Bocca dei Fortini.',
  },
  'monte-brione': {
    difficulty: 'The descent from Forte Garda has steps, roots and a few drops.',
    exposure: 'Some short sections run beside drops of about 2 m.',
    fitness: 'Short, with one climb of about 300 m: suitable for most riders.',
    wilderness: 'Always close to Riva and Torbole, with good signal everywhere.',
  },
  'lago-di-tenno': {
    difficulty: 'The climb to Tenno and the descent to Campi need basic MTB skills.',
    exposure: 'The descent to Campi passes steep slopes beside the trail.',
    fitness: 'Over 800 m of climbing: regular training makes it enjoyable.',
    wilderness: 'Villages, fountains and bus stops all along the way.',
  },
  'arco-laghel': {
    difficulty: 'Almost entirely on cycle paths and quiet roads.',
    exposure: 'Flat ground: a fall has no extra consequences.',
    fitness: 'Long but almost flat, with only one short climb to Laghel.',
    wilderness: 'Always in town or on cycle paths, with services at every turn.',
  },
  'nago-busatte': {
    difficulty: 'Short rocky sections at the Marmitte dei Giganti and on the Busatte descent.',
    exposure: 'Near the Marmitte the path runs beside small drops.',
    fitness: 'Short and with a gentle climb from Torbole to Nago.',
    wilderness: 'Between two villages, with signal and water close by.',
  },
  'lago-di-ledro': {
    difficulty: 'A flat ride on the lakeside path, fine for families.',
    exposure: 'The path stays level with the lake shore.',
    fitness: 'About 12 km with almost no climbing.',
    wilderness: 'Always near Pieve and Molina, with cafés and bus stops.',
  },
  'concei-cima-oro': {
    difficulty: "The Cima d'Oro trail is narrow, with roots, rock steps and tight corners.",
    exposure: "Below Cima d'Oro the trail crosses steep ground above a drop of about 4 m.",
    fitness: 'Over 1,400 m of climbing to Malga Trat and beyond.',
    wilderness: 'Malga Trat is the last place with water: plan your supplies for the high section.',
  },
}

export function ratingReason(routeId, factor) {
  return REASONS[routeId]?.[factor] ?? null
}
