import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
import { LEVELS } from '../../data/itrs.js'
import { ALL_BOUNDS, USER_POSITION } from '../../data/garda.js'
import { pinElement, clusterElement, userElement, endpointElement } from './markers.js'
import { ensureRouteLayers, setRouteSelection } from './routeLayers.js'
import './MapView.css'

/*
 * Mappa topografica vera (MapLibre + MapTiler, istruzioni §6 "Mappa").
 * - Vista generale desaturata: nero al 40% in fusione Color, come nel Figma.
 * - Pin colorati per difficoltà, raggruppati in cluster neri col numero.
 * - Tap su un cluster: zoom sull'area. Tap su un pin: zoom sul percorso, disegnato
 *   nel nuovo stile con partenza e arrivo; la mappa torna a colori (-25% saturazione).
 * - Tap sulla mappa vuota: torna alla vista con tutti i pin.
 */
// Il worker di MapLibre va servito come file a parte (Vite lo copia in dist/assets)
maplibregl.setWorkerUrl(workerUrl)

const KEY = import.meta.env.VITE_MAPTILER_KEY
const STYLES = {
  topo: (key) => `https://api.maptiler.com/maps/topo-v2/style.json?key=${key}`,
  satellite: (key) => `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`,
}
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const MapView = forwardRef(function MapView(
  { items, selectedId, onSelect, onViewChange, styleKind = 'topo', padding, onError },
  ref,
) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())       // chiave → marker (pin e cluster)
  const endpointsRef = useRef([])
  const indexRef = useRef(null)
  const state = useRef({})                   // valori correnti letti dai listener della mappa
  state.current = { items, selectedId, onSelect, onViewChange, padding, onError }

  useImperativeHandle(ref, () => ({
    recenter() {
      const map = mapRef.current
      if (!map) return
      map.easeTo({ center: USER_POSITION, zoom: Math.max(map.getZoom(), 13), duration: reducedMotion() ? 0 : 500 })
    },
  }), [])

  // --- Creazione della mappa (una volta) ---
  useEffect(() => {
    if (!KEY) { onError?.('key'); return }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[styleKind](KEY),
      bounds: ALL_BOUNDS,
      fitBoundsOptions: { padding: state.current.padding },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
      fadeDuration: 0,
    })
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    mapRef.current = map

    // Velo per desaturare (nero in fusione Color, come nel Figma): sopra la mappa, sotto i marker.
    // Non si usa filter sul canvas: su Chrome toglie la mappa dal blur della cima schermo.
    const tint = document.createElement('div')
    tint.className = 'map-view__tint'
    map.getCanvas().after(tint)

    new maplibregl.Marker({ element: userElement() }).setLngLat(USER_POSITION).addTo(map)

    map.on('style.load', () => {
      ensureRouteLayers(map)
      drawSelection()
    })
    map.on('error', (e) => {
      const status = e?.error?.status
      if (status === 401 || status === 403) state.current.onError?.('key')
      else if (!map.isStyleLoaded() && !map.loaded()) state.current.onError?.('network')
    })

    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => { frame = 0; syncMarkers() })
    }
    map.on('move', schedule)
    map.on('moveend', () => { syncMarkers(); countVisible() })
    map.on('load', countVisible)

    // Tap sulla mappa vuota: deseleziona
    map.on('click', (e) => {
      if (e.originalEvent?.target?.closest?.('.map-marker')) return
      if (state.current.selectedId) state.current.onSelect?.(null)
    })

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Indice dei cluster quando cambiano gli elementi (Routes ↔ Tracks) ---
  useEffect(() => {
    const index = new Supercluster({ radius: 44, maxZoom: 16 })
    index.load(items.map((it) => ({
      type: 'Feature',
      properties: { id: it.id },
      geometry: { type: 'Point', coordinates: it.pin },
    })))
    indexRef.current = index
    for (const m of markersRef.current.values()) m.remove()
    markersRef.current.clear()
    syncMarkers()
    countVisible()
  }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Selezione ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    drawSelection()
    syncMarkers()
    const item = items.find((it) => it.id === selectedId)
    if (item) {
      map.fitBounds(item.bbox, { padding: state.current.padding, maxZoom: 15, duration: reducedMotion() ? 0 : 500 })
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Stile: topografica ↔ satellite ---
  useEffect(() => {
    const map = mapRef.current
    if (!map || !KEY) return
    map.setStyle(STYLES[styleKind](KEY))
  }, [styleKind])

  function drawSelection() {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const { items: list, selectedId: id } = state.current
    const item = list.find((it) => it.id === id) || null
    ensureRouteLayers(map)
    setRouteSelection(map, item, item ? LEVELS[item.level].hex : null)

    for (const m of endpointsRef.current) m.remove()
    endpointsRef.current = []
    if (item) {
      const first = item.points[0]
      const last = item.points[item.points.length - 1]
      const loop = Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.0008
      endpointsRef.current.push(new maplibregl.Marker({ element: endpointElement('start') }).setLngLat(first.slice(0, 2)).addTo(map))
      if (!loop) endpointsRef.current.push(new maplibregl.Marker({ element: endpointElement('finish') }).setLngLat(last.slice(0, 2)).addTo(map))
    }
  }

  function syncMarkers() {
    const map = mapRef.current
    const index = indexRef.current
    if (!map || !index) return
    const { items: list, selectedId: id } = state.current
    const current = markersRef.current

    // Con un percorso selezionato restano solo partenza e arrivo
    if (id) {
      for (const m of current.values()) m.remove()
      current.clear()
      return
    }
    const b = map.getBounds()
    const pad = 0.05
    const zoom = Math.floor(map.getZoom())
    const features = index.getClusters([b.getWest() - pad, b.getSouth() - pad, b.getEast() + pad, b.getNorth() + pad], zoom)
    const next = new Map()
    for (const f of features) {
      const p = f.properties
      const key = p.cluster ? `c${p.cluster_id}` : `p${p.id}`
      let marker = current.get(key)
      if (!marker) {
        let el
        if (p.cluster) {
          el = clusterElement(p.point_count)
          el.addEventListener('click', () => {
            const z = Math.min(index.getClusterExpansionZoom(p.cluster_id), 16)
            map.easeTo({ center: f.geometry.coordinates, zoom: z, duration: reducedMotion() ? 0 : 500 })
          })
        } else {
          const item = list.find((it) => it.id === p.id)
          el = pinElement(item)
          el.addEventListener('click', () => state.current.onSelect?.(item.id))
        }
        marker = new maplibregl.Marker({ element: el }).setLngLat(f.geometry.coordinates).addTo(map)
      }
      next.set(key, marker)
      current.delete(key)
    }
    for (const m of current.values()) m.remove()
    markersRef.current = next
  }

  // Comunica l'area visibile, per i conteggi del toggle e dell'overlay
  function countVisible() {
    const map = mapRef.current
    if (!map) return
    state.current.onViewChange?.(map.getBounds())
  }

  return (
    <div
      ref={containerRef}
      className={`map-view${selectedId ? ' has-selection' : ''}${styleKind === 'satellite' ? ' is-satellite' : ''}`}
      role="application"
      aria-label="Map"
    />
  )
})

export default MapView
