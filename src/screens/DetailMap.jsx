import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import RouteMap from '../components/map/RouteMap.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import ElevationProfile, { fmtEle, fmtGrade } from '../components/ElevationProfile.jsx'
import LevelShape from '../components/LevelShape.jsx'
import Icon from '../components/Icon.jsx'
import { ActionBar, RoundButton } from '../components/Button.jsx'
import { FACTORS } from '../data/itrs.js'
import { fmtKm } from '../data/garda.js'
import { levelInfo } from '../data/levelInfo.js'
import { useEntered } from '../useEntered.js'

/*
 * Mappa a tutto schermo di una route o di una track (Figma 3680:8568, 3680:8742).
 * - Route: percorso colorato per track e numerato; pannello `Route details` a due stati:
 *   261 col riepilogo e il grafico, oppure espanso con uno swipe in su (passo 2.3) con il testo
 *   del livello e la riga `Itinerary List`, che apre la lista track (onItinerary).
 * - Track (trackAsRoute): un solo colore, niente numeri; pannello `Track details` a un solo stato.
 * Trascinando il grafico (passo 2.2) il riepilogo lascia il posto ai valori del punto e un
 * punto nero si muove sulla mappa.
 */
export const PANEL_H = 261                                   // pannello Route details (Figma 3680:8568)
const TOP_GAP = 14                                           // pannello espanso: 14 sotto la barra di stato (Figma 3680:8742)

export default function DetailMap({ route, open, onClose, saved, onSave, startLabel, onItinerary, className = '' }) {
  const isTrack = route.kind === 'track'
  const [mounted, setMounted] = useState(open)
  const [styleKind, setStyleKind] = useState('topo')
  const [barH, setBarH] = useState(114)
  const [safeTop, setSafeTop] = useState(0)
  const [viewH, setViewH] = useState(() => window.innerHeight)
  const [error, setError] = useState(null)
  const [scrub, setScrub] = useState(null)        // punto del grafico sotto il dito
  const [snap, setSnap] = useState(0)
  const pageRef = useRef(null)
  const mapRef = useRef(null)
  const entered = useEntered(open)

  useEffect(() => {
    if (open) { setMounted(true); setError(null); setScrub(null); setSnap(0); return }
    const t = setTimeout(() => setMounted(false), 400)
    return () => clearTimeout(t)
  }, [open])

  // Altezza della barra azioni (safe area compresa), margine sicuro in alto, altezza dello schermo
  useLayoutEffect(() => {
    if (!mounted) return
    const bar = pageRef.current?.querySelector('.action-bar')
    const measure = () => {
      if (bar) setBarH(bar.offsetHeight)
      const probe = document.createElement('div')
      probe.style.cssText = 'position:absolute;visibility:hidden;padding-top:var(--safe-top)'
      document.body.appendChild(probe)
      setSafeTop(parseFloat(getComputedStyle(probe).paddingTop) || 0)
      probe.remove()
      setViewH(pageRef.current?.clientHeight || window.innerHeight)
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (bar) ro?.observe(bar)
    if (pageRef.current) ro?.observe(pageRef.current)
    return () => ro?.disconnect()
  }, [mounted])

  const onScrub = (s) => {
    setScrub(s)
    mapRef.current?.setCursor(s ? s.lngLat : null)
  }

  if (!mounted) return null
  const padding = { top: safeTop + 16 + 46 + 24, bottom: barH + PANEL_H + 32, left: 40, right: 72 }
  const expandedH = Math.max(PANEL_H, viewH - barH - safeTop - TOP_GAP)
  const snaps = onItinerary ? [PANEL_H, expandedH] : [PANEL_H]
  const text = levelInfo('difficulty', route.level)?.text
  const title = isTrack ? 'Track details' : 'Route details'

  return (
    <div
      ref={pageRef}
      className={`route-map-page${entered ? ' is-open' : ''} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${route.name}, map`}
      style={{ '--attrib-bottom': `${barH + PANEL_H + 8}px` }}
    >
      {error ? (
        <div className="route-map-page__error">
          <p className="t-md">{error === 'key' ? 'The map is not available right now.' : 'Can’t load the map. Check your connection.'}</p>
        </div>
      ) : (
        <RouteMap ref={mapRef} route={route} interactive styleKind={styleKind} padding={padding} onError={setError} />
      )}

      <div className="route-map-page__left">
        <RoundButton icon="chevronDown" label="Close the map" onClick={onClose} />
      </div>
      <div className="route-map-page__right">
        <RoundButton
          icon="layers"
          label={styleKind === 'topo' ? 'Show satellite map' : 'Show topographic map'}
          aria-pressed={styleKind === 'satellite'}
          onClick={() => setStyleKind((k) => (k === 'topo' ? 'satellite' : 'topo'))}
        />
        <RoundButton icon="target" label="Show my position" onClick={() => mapRef.current?.recenter()} />
      </div>

      <BottomSheet
        open={open}
        snaps={snaps}
        snap={snap}
        onSnapChange={setSnap}
        bottom={barH}
        className="route-details"
        label={title}
        header={
          <div className="route-details__head">
            <h2 className="t-lg-em">{title}</h2>
            {scrub ? (
              <p className="t-sm route-details__summary route-details__scrub" aria-hidden="true">
                <span className="route-details__values">
                  {fmtKm(scrub.km)}<span> • </span>{fmtEle(scrub.ele)}<span> • </span>{fmtGrade(scrub.grade)}
                </span>
                <span className="route-details__track">
                  {!isTrack && <span className="t-sm-em">TRACK {scrub.leg.n}</span>}
                  <LevelShape level={scrub.leg.level} size={14} />
                  {FACTORS.difficulty.names[scrub.leg.level]}
                </span>
              </p>
            ) : (
              <p className="t-sm route-details__summary">
                {route.distance}<span aria-hidden="true"> • </span>{route.climbLabel}<span aria-hidden="true"> • </span>{route.duration}
              </p>
            )}
          </div>
        }
      >
        <div className="route-details__chart">
          <ElevationProfile route={route} onScrub={onScrub} />
        </div>
        {onItinerary && (
          <div className="route-details__more" aria-hidden={snap === 0} inert={snap === 0 ? true : undefined}>
            {text && <p className="t-md route-details__text">{text}</p>}
            <ul className="route-details__links">
              <li>
                <button type="button" className="route-details__link" onClick={onItinerary}>
                  <Icon name="listBullets" size={24} />
                  <span className="t-md-em">Itinerary List</span>
                  <Icon name="chevronRight" size={24} className="route-details__chevron" />
                </button>
              </li>
            </ul>
          </div>
        )}
      </BottomSheet>

      <ActionBar startLabel={startLabel} saved={saved} onSave={onSave} />
    </div>
  )
}
