/*
 * Marker HTML della mappa (istruzioni §6 "Mappa" e "Percorso sulla mappa").
 * Forme e tracciati dal Figma (pagina UI Design); colori dai token via CSS (MapView.css).
 * Ogni marker è un pulsante con area di tocco 44×44 attorno al disegno.
 */
import { LEVELS, FACTORS } from '../../data/itrs.js'

// IconSend del Figma, nel riquadro 28×28 del pin
const SEND = 'M14.44 21.3139L19.5387 7.58661L5.8114 12.6853L12.0867 15.0385L14.44 21.3139Z'

// Elemento singolo: cerchio 28 col colore di difficoltà, bordo bianco, IconSend
export function pinElement({ level, name, kind }) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'map-marker map-pin'
  el.setAttribute('aria-label', `${name}, ${kind}, ${FACTORS.difficulty.names[level]}`)
  el.style.setProperty('--pin-color', LEVELS[level].color)
  el.innerHTML = `<svg class="map-pin__shape" viewBox="0 0 28 28" aria-hidden="true">
    <circle class="map-pin__fill" cx="14" cy="14" r="13.34" stroke-width="1.31"/>
    <path class="map-pin__icon" d="${SEND}"/>
  </svg>`
  return el
}

// Cluster: cerchio 28 nero, bordo bianco, numero sm/emphasized bianco
export function clusterElement(count) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'map-marker map-cluster'
  el.setAttribute('aria-label', `${count} items here, zoom in`)
  el.innerHTML = `<span class="map-cluster__dot t-sm-em" aria-hidden="true">${count}</span>`
  return el
}

// Posizione utente: punto 19 blu brand con bordo bianco, alone 39 brand-alpha-24
export function userElement() {
  const el = document.createElement('div')
  el.className = 'map-user'
  el.setAttribute('role', 'img')
  el.setAttribute('aria-label', 'Your position')
  el.innerHTML = `<svg viewBox="0 0 38.67 38.67" aria-hidden="true">
    <circle class="map-user__halo" cx="19.33" cy="19.33" r="19.33"/>
    <circle class="map-user__dot" cx="19.33" cy="19.33" r="8.45" stroke-width="2.42"/>
  </svg>`
  return el
}

// Partenza e arrivo: cerchio 28 nero, bordo bianco 3, play o bandierina bianca
const PLAY = 'M11 9.2v9.6c0 .5.5.8.9.5l7.4-4.8a.6.6 0 0 0 0-1L11.9 8.7c-.4-.3-.9 0-.9.5Z'
const FLAG = 'M10.5 20V8.4M10.5 8.6h7.2l-1.6 2.7 1.6 2.7h-7.2'
export function endpointElement(type) {
  const el = document.createElement('div')
  el.className = `map-endpoint map-endpoint--${type}`
  el.setAttribute('role', 'img')
  el.setAttribute('aria-label', type === 'start' ? 'Start' : 'Finish')
  el.innerHTML = type === 'start'
    ? `<svg viewBox="0 0 28 28" aria-hidden="true"><path class="map-endpoint__fill-icon" d="${PLAY}"/></svg>`
    : `<svg viewBox="0 0 28 28" aria-hidden="true"><path class="map-endpoint__stroke-icon" d="${FLAG}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  return el
}
