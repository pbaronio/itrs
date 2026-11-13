/*
 * Percorso selezionato sulla mappa, nel nuovo stile (istruzioni §6 "Percorso sulla mappa"):
 * - ombra: y 2, blur 8, nero al 28%
 * - contorno bianco 10 px
 * - linea 6 px col colore di difficoltà, estremi e angoli arrotondati
 * - frecce bianche di direzione (tratto 1.6) dentro la linea ogni ~40 px
 * Il percorso è colorato per segmento di difficoltà ovunque (prima: un colore solo in Explore).
 * I layer si rimettono a ogni cambio di stile (topografica ↔ satellite).
 */
import { LEVELS } from '../../data/itrs.js'
import { runsOf } from '../../data/garda.js'

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

// Tratti colorati → GeoJSON: un tratto per segmento di difficoltà, col colore del suo livello
function runsData(runs) {
  return {
    type: 'FeatureCollection',
    features: runs.map((run) => ({
      type: 'Feature',
      properties: { color: LEVELS[run.level].hex },
      geometry: { type: 'LineString', coordinates: run.coords },
    })),
  }
}

// Percorso colorato per segmento (richiesta di Paolo, 13 nov): vale in Explore, nelle mappe
// di route e track e nelle anteprime. item: route o track (data/garda.js), oppure null.
export function setRouteSelection(map, item) {
  map.getSource(SOURCE)?.setData(item ? runsData(runsOf(item)) : { type: 'FeatureCollection', features: [] })
}

/*
 * Navigazione (passo 3.1, istruzioni §6 "Percorso sulla mappa"): il tratto già percorso è
 * `text-soft-500` al 70%, con lo stesso contorno bianco, senza frecce. Il tratto da fare resta
 * nella sorgente del percorso (colori per track e frecce).
 */
const DONE = 'itrs-ride-done'
export function ensureRideLayers(map) {
  ensureRouteLayers(map)
  if (map.getSource(DONE)) return
  map.addSource(DONE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  const round = { 'line-cap': 'round', 'line-join': 'round' }
  map.addLayer({
    id: 'itrs-done-casing', type: 'line', source: DONE, layout: round,
    paint: { 'line-color': token('--gray-0'), 'line-width': 10 },
  }, 'itrs-sel-arrows')
  map.addLayer({
    id: 'itrs-done-line', type: 'line', source: DONE, layout: round,
    paint: { 'line-color': token('--text-soft-500'), 'line-opacity': 0.7, 'line-width': 6 },
  }, 'itrs-sel-arrows')
}

// done: [[lng, lat], …]; todo: [{ coords, level }] un tratto per segmento di difficoltà
export function setRideLines(map, done, todo) {
  map.getSource(DONE)?.setData({
    type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: done },
  })
  map.getSource(SOURCE)?.setData(runsData(todo))
}
