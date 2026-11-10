import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import { KEY, STYLES } from './MapView.jsx'
import { LEVELS } from '../../data/itrs.js'
import { rideLines } from '../../data/ride.js'
import { endpointElement, trackNumberElement, rideUserElement } from './markers.js'
import { ensureRideLayers, setRideLines } from './routeLayers.js'
import './MapView.css'

/*
 * Mappa della navigazione (passo 3.1, Figma 3691:27462, istruzioni §6 "Percorso sulla mappa").
 * - Tratto da fare colorato per track con frecce; tratto fatto grigio al 70% senza frecce.
 * - Numeri delle track ancora da fare all'inizio di ognuna; arrivo nero.
 * - Punto blu col cono di direzione.
 * - La mappa segue il ciclista con la direzione di marcia in alto (o il nord in alto, dalla
 *   bussola). Se l'utente sposta la mappa col dito smette di seguire: `recenter()` riprende.
 * `update(state)` si chiama a ogni frame dal giro simulato.
 */
const FOLLOW_ZOOM = 16

const RideMap = forwardRef(function RideMap({ ride, styleKind = 'topo', topPad = 0, onError, onFollowChange, needleRef }, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const userRef = useRef(null)
  const numbersRef = useRef([])
  const live = useRef({ follow: true, north: false, bearing: 0, state: null, lastIndex: -1, lastLeg: 0 })
  const props = useRef({})
  props.current = { topPad, onError, onFollowChange, needleRef }

  const draw = (state, force) => {
    const map = mapRef.current
    if (!map || !state) return
    const l = live.current
    l.state = state
    userRef.current?.setLngLat(state.lngLat)
    // linee: a ogni frame (il tratto fatto finisce sotto il punto blu)
    if (map.getSource('itrs-ride-done')) {
      const { done, todo } = rideLines(ride, state)
      setRideLines(map, done, todo.map((leg) => ({ coords: leg.coords, hex: LEVELS[ride.legs[leg.n - 1].level].hex })))
    }
    // numeri: solo le track ancora da fare
    if (force || l.lastLeg !== state.leg.n) {
      l.lastLeg = state.leg.n
      for (const { n, marker } of numbersRef.current) marker.getElement().style.display = n > state.leg.n ? '' : 'none'
    }
    // camera
    const target = l.north ? 0 : state.heading
    if (l.follow) {
      let diff = ((target - l.bearing + 540) % 360) - 180
      l.bearing = (l.bearing + diff * (force ? 1 : 0.12) + 360) % 360
      map.jumpTo({ center: state.lngLat, bearing: l.bearing, padding: { top: props.current.topPad, bottom: 0, left: 0, right: 0 } })
    }
    const bearing = map.getBearing()
    const cone = userRef.current?.getElement()
    cone?.style.setProperty('--cone', `${state.heading - bearing}deg`)
    const needle = props.current.needleRef?.current
    if (needle) needle.style.transform = `rotate(${-bearing}deg)`
  }

  useImperativeHandle(ref, () => ({
    update(state) { draw(state, false) },
    recenter() {
      const l = live.current
      l.follow = true
      props.current.onFollowChange?.(true)
      const map = mapRef.current
      if (map && map.getZoom() < 14) map.jumpTo({ zoom: FOLLOW_ZOOM })
      draw(l.state, true)
    },
    toggleNorth() {
      const l = live.current
      l.north = !l.north
      if (!l.follow) {
        mapRef.current?.easeTo({ bearing: l.north ? 0 : l.state?.heading ?? 0, duration: 300 })
      }
      return l.north
    },
  }), [ride]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!KEY) { onError?.('key'); return }
    const first = ride.pts[0]
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[styleKind](KEY),
      center: first.lngLat,
      zoom: FOLLOW_ZOOM,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
      fadeDuration: 0,
    })
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-right')
    mapRef.current = map

    const tint = document.createElement('div')
    tint.className = 'map-view__tint'
    map.getCanvas().after(tint)

    // Numeri all'inizio delle track 2…N (una track da sola: niente numeri)
    numbersRef.current = ride.legs.length > 1
      ? ride.legs.slice(1).map((leg) => ({
          n: leg.n,
          marker: new maplibregl.Marker({ element: trackNumberElement(leg.n) }).setLngLat(leg.points[0].slice(0, 2)).addTo(map),
        }))
      : []
    const last = ride.pts[ride.pts.length - 1]
    new maplibregl.Marker({ element: endpointElement('finish') }).setLngLat(last.lngLat).addTo(map)
    userRef.current = new maplibregl.Marker({ element: rideUserElement() }).setLngLat(first.lngLat).addTo(map)

    map.on('style.load', () => {
      ensureRideLayers(map)
      draw(live.current.state, true)
    })
    map.once('load', () => {
      containerRef.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
    })
    // Spostata col dito: la mappa smette di seguire
    map.on('dragstart', (e) => {
      if (!e.originalEvent) return
      live.current.follow = false
      props.current.onFollowChange?.(false)
    })
    map.on('error', (e) => {
      const status = e?.error?.status
      if (status === 401 || status === 403) props.current.onError?.('key')
      else if (!map.isStyleLoaded() && !map.loaded()) props.current.onError?.('network')
    })

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      userRef.current = null
      numbersRef.current = []
    }
  }, [ride]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current
    if (!map || !KEY) return
    map.setStyle(STYLES[styleKind](KEY))
  }, [styleKind])

  return (
    <div
      ref={containerRef}
      className={`map-view has-selection ride-map${styleKind === 'satellite' ? ' is-satellite' : ''}`}
      role="application"
      aria-label={`Navigation map of ${ride.item.name}`}
    />
  )
})

export default RideMap
