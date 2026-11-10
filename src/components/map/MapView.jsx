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
 * - Tap su un cluster: zoom finché si vedono tutti i suoi elementi. Elementi con la
 *   stessa partenza si aprono a ventaglio attorno al punto.
 * - Tap su un pin: zoom sul percorso, disegnato nel nuovo stile con partenza e arrivo;
 *   la mappa torna a colori (-25% saturazione). Gli altri pin restano visibili.
 * - Tap sulla mappa vuota: deseleziona.
 */
// Il worker di MapLibre va servito come file a parte (Vite lo copia in dist/assets)
maplibregl.setWorkerUrl(workerUrl)

const KEY = import.meta.env.VITE_MAPTILER_KEY
const STYLES = {
  topo: (key) => `https://api.maptiler.com/maps/topo-v2/style.json?key=${key}`,
  satellite: (key) => `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`,
}
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const CLUSTER_MAX_ZOOM = 14      // da 15 in su ogni elemento ha il suo pin
const FAN_RADIUS = 22            // px: ventaglio per elementi con la stessa partenza

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
    // Inquadra un riquadro [[w, s], [e, n]] (località della ricerca, risultati dei filtri)
    fitTo(bbox, maxZoom = 14) {
      const map = mapRef.current
      if (!map) return
      map.fitBounds(bbox, { padding: state.current.padding, maxZoom, duration: reducedMotion() ? 0 : 500 })
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

  // --- Indice dei cluster: elementi visibili, senza quello selezionato (al suo posto partenza e arrivo) ---
  useEffect(() => {
    const index = new Supercluster({ radius: 44, maxZoom: CLUSTER_MAX_ZOOM })
    index.load(items.filter((it) => it.id !== selectedId).map((it) => ({
      type: 'Feature',
      properties: { id: it.id },
      geometry: { type: 'Point', coordinates: it.pin },
    })))
    indexRef.current = index
    for (const m of markersRef.current.values()) m.remove()
    markersRef.current.clear()
    syncMarkers()
  }, [items, selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { countVisible() }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Selezione ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    drawSelection()
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
    const { items: list } = state.current
    const current = markersRef.current

    const b = map.getBounds()
    const pad = 0.05
    const zoom = Math.floor(map.getZoom())
    const features = index.getClusters([b.getWest() - pad, b.getSouth() - pad, b.getEast() + pad, b.getNorth() + pad], zoom)

    // Elementi con la stessa partenza: a ventaglio attorno al punto
    const groups = new Map()
    for (const f of features) {
      if (f.properties.cluster) continue
      const [x, y] = f.geometry.coordinates
      const key = `${x.toFixed(4)},${y.toFixed(4)}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(f.properties.id)
    }
    const offsetOf = (f) => {
      const [x, y] = f.geometry.coordinates
      const group = groups.get(`${x.toFixed(4)},${y.toFixed(4)}`)
      if (!group || group.length < 2) return [0, 0]
      const i = group.indexOf(f.properties.id)
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / group.length
      return [Math.round(Math.cos(angle) * FAN_RADIUS), Math.round(Math.sin(angle) * FAN_RADIUS)]
    }

    const next = new Map()
    for (const f of features) {
      const p = f.properties
      const key = p.cluster ? `c${p.cluster_id}` : `p${p.id}`
      let marker = current.get(key)
      if (!marker) {
        let el
        if (p.cluster) {
          el = clusterElement(p.point_count)
          el.addEventListener('click', () => openCluster(p.cluster_id, f.geometry.coordinates))
        } else {
          const item = list.find((it) => it.id === p.id)
          el = pinElement(item)
          el.addEventListener('click', () => state.current.onSelect?.(item.id))
        }
        marker = new maplibregl.Marker({ element: el }).setLngLat(f.geometry.coordinates).addTo(map)
      }
      if (!p.cluster) marker.setOffset(offsetOf(f))
      next.set(key, marker)
      current.delete(key)
    }
    for (const m of current.values()) m.remove()
    markersRef.current = next
  }

  // Tap su un cluster: inquadra tutti i suoi elementi, oltre lo zoom in cui si raggruppano
  function openCluster(clusterId, center) {
    const map = mapRef.current
    const index = indexRef.current
    const leaves = index.getLeaves(clusterId, Infinity)
    const xs = leaves.map((l) => l.geometry.coordinates[0])
    const ys = leaves.map((l) => l.geometry.coordinates[1])
    const duration = reducedMotion() ? 0 : 500
    if (Math.max(...xs) - Math.min(...xs) < 0.002 && Math.max(...ys) - Math.min(...ys) < 0.002) {
      map.easeTo({ center, zoom: Math.max(map.getZoom(), CLUSTER_MAX_ZOOM + 1), duration })
      return
    }
    const bounds = [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]]
    const cam = map.cameraForBounds(bounds, { padding: state.current.padding })
    const zoom = Math.max(cam?.zoom ?? 0, Math.min(index.getClusterExpansionZoom(clusterId), CLUSTER_MAX_ZOOM + 1))
    map.easeTo({ center: cam?.center ?? center, zoom: Math.min(zoom, CLUSTER_MAX_ZOOM + 1), duration })
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
