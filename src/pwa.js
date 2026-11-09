/*
 * Installazione come app (PWA): modalità di apertura, piattaforma, prompt Android.
 * Va importato in main.jsx prima del render, così l'evento
 * beforeinstallprompt di Chrome non si perde.
 */

const ua = navigator.userAgent
const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

export const platform = {
  ios: /iPhone|iPad|iPod/.test(ua) || isIPadOS,
  android: /Android/.test(ua),
  // Browser diversi da Safari su iOS (Chrome, Firefox, Edge, Opera)
  iosOtherBrowser: /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua),
  // Browser interni delle app (Instagram, Facebook, LinkedIn, Line…): non installano
  inApp: /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Line\/|Twitter|MicroMessenger|GSA\//.test(ua),
  // Su Android: Chrome vero (non Samsung Internet, Edge, Opera, Firefox)
  androidChrome: /Android/.test(ua) && /Chrome\//.test(ua) && !/SamsungBrowser|EdgA|OPR|Firefox|wv\)/.test(ua),
}
platform.mobile = platform.ios || platform.android

// Aperta dall'icona sulla Home, senza barre del browser
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true
  )
}

export function displayMode() {
  if (navigator.standalone === true) return 'standalone (iOS)'
  for (const mode of ['fullscreen', 'standalone', 'minimal-ui']) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return mode
  }
  return 'browser'
}

/*
 * Anteprima nel browser senza installare (per le interviste, se l'installazione non va).
 * L'anteprima è una voce della cronologia sopra la guida: Indietro torna sempre alla guida.
 * - Pulsante "Preview app here" nella guida → startPreview()
 * - Link diretto con ?preview → la guida viene messa dietro l'anteprima
 * Il segno è in history.state.preview, che sopravvive al ricaricamento della pagina.
 * Le schermate future che usano pushState devono mantenere { preview: true } nello stato.
 */
function previewUrl() {
  const params = new URLSearchParams(location.search)
  params.set('preview', '')
  return location.pathname + '?' + params.toString().replace(/preview=(&|$)/, 'preview$1') + location.hash
}
function guideUrl() {
  const params = new URLSearchParams(location.search)
  params.delete('preview')
  const query = params.toString()
  return location.pathname + (query ? `?${query}` : '') + location.hash
}

;(function readPreviewParam() {
  if (history.state?.preview) return                 // ricaricamento: già in anteprima
  const params = new URLSearchParams(location.search)
  if (!params.has('preview')) return
  if (params.get('preview') === '0') {
    history.replaceState(null, '', guideUrl())
    return
  }
  const target = previewUrl()
  history.replaceState(null, '', guideUrl())         // la guida resta dietro
  history.pushState({ preview: true }, '', target)
})()

export function isPreview() {
  return history.state?.preview === true
}

export function startPreview() {
  history.pushState({ preview: true }, '', previewUrl())
  window.scrollTo(0, 0)
}

// Prompt di installazione di Chrome Android
let deferredPrompt = null
let installed = false
let snapshot = { canPrompt: false, installed: false }
const listeners = new Set()
const notify = () => {
  snapshot = { canPrompt: Boolean(deferredPrompt), installed }
  listeners.forEach((fn) => fn())
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()          // niente mini-barra di Chrome: c'è il pulsante nella guida
  deferredPrompt = event
  notify()
})

window.addEventListener('appinstalled', () => {
  deferredPrompt = null
  installed = true
  notify()
})

export function subscribeInstall(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Stesso oggetto finché non cambia nulla (richiesto da useSyncExternalStore)
export function getInstallState() {
  return snapshot
}

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'
  const event = deferredPrompt
  deferredPrompt = null
  event.prompt()
  notify()
  const { outcome } = await event.userChoice
  return outcome                  // 'accepted' | 'dismissed'
}
