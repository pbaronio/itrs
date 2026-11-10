/*
 * Percorso selezionato sulla mappa, nel nuovo stile (istruzioni §6 "Percorso sulla mappa"):
 * - ombra: y 2, blur 8, nero al 28%
 * - contorno bianco 10 px
 * - linea 6 px col colore di difficoltà, estremi e angoli arrotondati
 * - frecce bianche di direzione (tratto 1.6) dentro la linea ogni ~40 px
 * Prima di entrare nella route il percorso ha un solo colore e niente numeri.
 * I layer si rimettono a ogni cambio di stile (topografica ↔ satellite).
 */
const SOURCE = 'itrs-selection'
const ARROW = 'itrs-arrow'

// Colori letti dai token CSS, così la mappa usa gli stessi valori dell'app
function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function arrowImage() {
  const ratio = 2
  const size = 12
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size * ratio
  const ctx = canvas.getContext('2d')
  ctx.scale(ratio, ratio)
  ctx.strokeStyle = token('--gray-0')
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(4.5, 3)   // chevron verso destra: il simbolo segue la direzione della linea
  ctx.lineTo(7.5, 6)
  ctx.lineTo(4.5, 9)
  ctx.stroke()
  return { image: ctx.getImageData(0, 0, size * ratio, size * ratio), ratio }
}

export function ensureRouteLayers(map) {
  if (!map.hasImage(ARROW)) {
    const { image, ratio } = arrowImage()
    map.addImage(ARROW, image, { pixelRatio: ratio })
  }
  if (map.getSource(SOURCE)) return
  map.addSource(SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  const round = { 'line-cap': 'round', 'line-join': 'round' }
  map.addLayer({
    id: 'itrs-sel-shadow', type: 'line', source: SOURCE, layout: round,
    paint: { 'line-color': token('--gray-950'), 'line-opacity': 0.28, 'line-width': 10, 'line-blur': 8, 'line-translate': [0, 2] },
  })
  map.addLayer({
    id: 'itrs-sel-casing', type: 'line', source: SOURCE, layout: round,
    paint: { 'line-color': token('--gray-0'), 'line-width': 10 },
  })
  map.addLayer({
    id: 'itrs-sel-line', type: 'line', source: SOURCE, layout: round,
    paint: { 'line-color': ['get', 'color'], 'line-width': 6 },
  })
  map.addLayer({
    id: 'itrs-sel-arrows', type: 'symbol', source: SOURCE,
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 40,
      'icon-image': ARROW,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-rotation-alignment': 'map',
      'icon-keep-upright': false,
    },
  })
}

// item: route o track (data/garda.js), oppure null per togliere il percorso
export function setRouteSelection(map, item, levelHex) {
  const source = map.getSource(SOURCE)
  if (!source) return
  source.setData(item
    ? {
        type: 'Feature',
        properties: { color: levelHex },
        geometry: { type: 'LineString', coordinates: item.points.map((p) => [p[0], p[1]]) },
      }
    : { type: 'FeatureCollection', features: [] })
}

// Percorso della route nella pagina route: un tratto per track, ognuno col colore
// di difficoltà della sua track (istruzioni §6: "colorato per segmento nella mappa di dettaglio")
export function setRouteLegs(map, legs) {
  const source = map.getSource(SOURCE)
  if (!source) return
  source.setData({
    type: 'FeatureCollection',
    features: legs.map((leg) => ({
      type: 'Feature',
      properties: { color: leg.hex },
      geometry: { type: 'LineString', coordinates: leg.points.map((p) => [p[0], p[1]]) },
    })),
  })
}
