import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import { KEY, STYLES } from './MapView.jsx'
import { LEVELS } from '../../data/itrs.js'
import { USER_POSITION, legsOf, midpointOf } from '../../data/garda.js'
import { userElement, endpointElement, trackNumberElement, cursorElement } from './markers.js'
import { ensureRouteLayers, setRouteLegs } from './routeLayers.js'
import './MapView.css'

/*
 * Mappa di una route (pagina route, contesto §4.5; istruzioni §6 "Percorso sulla mappa"):
 * un tratto per track col suo colore di difficoltà, frecce di direzione, numeri delle track
 * (cerchio bianco 24 a metà track), partenza e arrivo neri, mappa a colori -25%.
 * - interactive=false: anteprima nella pagina route (ferma, il tocco apre la mappa intera).
 * - interactive=true: mappa a tutto schermo, si sposta e si zooma.
 * - setCursor([lng, lat] | null): punto nero del grafico altimetrico (passo 2.2). Se il punto esce
 *   dalla parte visibile (fuori dai margini di `padding`), la mappa lo segue.
 */
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const RouteMap = forwardRef(function RouteMap({ route, interactive = false, styleKind = 'topo', padding, onError, attribution = 'bottom-right' }, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const state = useRef({})
  const cursorRef = useRef(null)
  state.current = { padding, onError }

  useImperativeHandle(ref, () => ({
    recenter() {
      const map = mapRef.current
      if (!map) return
      map.easeTo({ center: USER_POSITION, zoom: Math.max(map.getZoom(), 13), duration: reducedMotion() ? 0 : 500 })
    },
    setCursor(lngLat) {
      const map = mapRef.current
      if (!map) return
      if (!lngLat) { cursorRef.current?.remove(); cursorRef.current = null; return }
      if (!cursorRef.current) cursorRef.current = new maplibregl.Marker({ element: cursorElement() }).setLngLat(lngLat).addTo(map)
      else cursorRef.current.setLngLat(lngLat)
      // Segue il punto se esce dall'area libera sopra il pannello
      const p = map.project(lngLat)
      const { clientWidth: w, clientHeight: h } = map.getContainer()
      const pad = state.current.padding || {}
      const m = 12
      const out = p.x < (pad.left ?? 0) - m || p.x > w - (pad.right ?? 0) + m
        || p.y < (pad.top ?? 0) - m || p.y > h - (pad.bottom ?? 0) + m
      if (out && !map.isMoving()) {
        const offset = [((pad.left ?? 0) - (pad.right ?? 0)) / 2, ((pad.top ?? 0) - (pad.bottom ?? 0)) / 2]
        map.easeTo({ center: lngLat, offset, duration: reducedMotion() ? 0 : 300 })
      }
    },
    fit() {
      mapRef.current?.fitBounds(route.bbox, { padding: state.current.padding, duration: reducedMotion() ? 0 : 500 })
    },
  }), [route])

  useEffect(() => {
    if (!KEY) { onError?.('key'); return }
    const legs = legsOf(route).map((leg) => ({ ...leg, hex: LEVELS[leg.level].hex }))
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[styleKind](KEY),
      bounds: route.bbox,
      fitBoundsOptions: { padding: state.current.padding },
      attributionControl: false,
      interactive,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
      fadeDuration: 0,
    })
    if (interactive) {
      map.touchZoomRotate.disableRotation()
      map.keyboard.disableRotation()
    }
    map.addControl(new maplibregl.AttributionControl({ compact: true }), attribution)
    mapRef.current = map

    // Mappa a colori leggermente desaturata (stesso velo di Explore con un percorso)
    const tint = document.createElement('div')
    tint.className = 'map-view__tint'
    map.getCanvas().after(tint)

    new maplibregl.Marker({ element: userElement() }).setLngLat(USER_POSITION).addTo(map)

    // Numeri delle track a metà di ognuna, poi partenza e arrivo sopra
    // (una track da sola: niente numeri, istruzioni §6)
    for (const leg of legs.length > 1 ? legs : []) {
      new maplibregl.Marker({ element: trackNumberElement(leg.n) }).setLngLat(midpointOf(leg.points)).addTo(map)
    }
    const first = route.points[0]
    const last = route.points[route.points.length - 1]
    new maplibregl.Marker({ element: endpointElement('finish') }).setLngLat(last.slice(0, 2)).addTo(map)
    new maplibregl.Marker({ element: endpointElement('start') }).setLngLat(first.slice(0, 2)).addTo(map)

    map.on('style.load', () => {
      ensureRouteLayers(map)
      setRouteLegs(map, legs)
    })
    // Attribuzione chiusa (solo la "i"): aperta coprirebbe Explore Route nell'anteprima
    map.once('load', () => {
      containerRef.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
    })
    map.on('error', (e) => {
      const status = e?.error?.status
      if (status === 401 || status === 403) state.current.onError?.('key')
      else if (!map.isStyleLoaded() && !map.loaded()) state.current.onError?.('network')
    })

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    return () => {
      ro.disconnect()
      cursorRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [route.id, interactive]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current
    if (!map || !KEY) return
    map.setStyle(STYLES[styleKind](KEY))
  }, [styleKind])

  return (
    <div
      ref={containerRef}
      className={`map-view has-selection route-map${styleKind === 'satellite' ? ' is-satellite' : ''}${interactive ? '' : ' is-static'}`}
      role={interactive ? 'application' : 'img'}
      aria-label={`Map of ${route.name}`}
    />
  )
})

export default RouteMap
