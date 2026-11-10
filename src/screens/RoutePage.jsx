import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import RouteMap from '../components/map/RouteMap.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import InfoSheet from '../components/InfoSheet.jsx'
import ItrsCircle from '../components/ItrsCircle.jsx'
import ElevationProfile, { fmtEle, fmtGrade } from '../components/ElevationProfile.jsx'
import LevelShape from '../components/LevelShape.jsx'
import { ActionBar, MapButton, RoundButton } from '../components/Button.jsx'
import { MiniMap, PhotoGallery, RatingRow } from '../components/Cards.jsx'
import { FACTORS } from '../data/itrs.js'
import { fmtKm, legsOf } from '../data/garda.js'
import { levelInfo } from '../data/levelInfo.js'
import './RoutePage.css'

/*
 * Pagina route (passo 2.1, contesto §4.5).
 * Pagina (Figma 3625:18792): foto, mini-mappa, titolo, dati, card ITRS con cerchio e righe
 * rating (→ bottom sheet informativo), anteprima della mappa con `Explore Route`, tipo di fondo,
 * barra azioni fissa.
 * Mappa della route (Figma 3680:8568): a tutto schermo, percorso colorato per track e numerato,
 * pannello `Route details` col riepilogo e il grafico altimetrico. Trascinando il grafico (passo 2.2)
 * il riepilogo lascia il posto ai valori del punto e un punto nero si muove sulla mappa.
 * Pagina e mappa sono voci della cronologia (Explore): Indietro le chiude.
 * Non ancora in questo passo: lista track (2.3), Notebook (2.4), Technical trail features,
 * Wilderness Details, Recommended routes.
 */
const RATING_ORDER = ['difficulty', 'exposure', 'fitness', 'wilderness']   // ordine del Figma (contesto §7.4)
const PANEL_H = 261                                                         // pannello Route details (Figma 3680:8568)

export default function RoutePage({ route, open, mapOpen, onBack, onOpenMap, onCloseMap }) {
  const [shown, setShown] = useState(route)       // resta montata durante l'uscita
  const [saved, setSaved] = useState(() => new Set())
  const [info, setInfo] = useState(null)           // fattore del bottom sheet informativo
  const scrollRef = useRef(null)

  useEffect(() => {
    if (route) { setShown(route); return }
    const t = setTimeout(() => setShown(null), 400)
    return () => clearTimeout(t)
  }, [route])

  // Nuova route: si riparte dall'alto, senza bottom sheet aperti
  useLayoutEffect(() => {
    if (route && scrollRef.current) scrollRef.current.scrollTop = 0
    setInfo(null)
  }, [route?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null
  const r = shown
  const isSaved = saved.has(r.id)
  const toggleSave = () => setSaved((s) => {
    const next = new Set(s)
    if (next.has(r.id)) next.delete(r.id); else next.add(r.id)
    return next
  })
  const family = r.access?.includes('family')
  const tracks = legsOf(r).length
  const infoText = info ? levelInfo(info, r.ratings[info], r) : null

  return (
    <div className={`route-page${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label={r.name} aria-hidden={!open}>
      <div ref={scrollRef} className="route-page__scroll">
        <div className="route-page__hero">
          <PhotoGallery key={r.id} photos={r.photos ?? [r]} label={r.name} className="route-page__gallery" />
        </div>

        <div className="route-page__body">
          <MiniMap route={r} className="route-page__minimap" />

          <section className="route-page__title">
            <h1 className="t-2xl-em">{r.name}</h1>
            <p className="route-page__meta">
              <span className="t-md">Route</span>
              <span className="t-sm route-page__dot" aria-hidden="true">•</span>
              <span className="t-md route-page__level"><LevelShape level={r.level} size={14} />{FACTORS.difficulty.names[r.level]}</span>
              {family && <>
                <span className="t-sm route-page__dot" aria-hidden="true">•</span>
                <span className="t-md">Family friendly</span>
              </>}
            </p>
          </section>

          <hr className="route-page__divider" />

          <dl className="route-data">
            <Datum label="Distance" value={r.distance} />
            <Datum label="Climb" value={`${r.climb} m`} />
            <Datum label="Descent" value={`${r.descent} m`} />
            <Datum label="Duration" value={r.duration} />
            <Datum label="Type" value={r.loop ? 'Loop' : 'Point to point'} />
            <Datum label="Tracks" value={String(tracks)} />
          </dl>

          <hr className="route-page__divider" />

          <section className="itrs-card" aria-label="ITRS rating">
            <ItrsCircle ratings={r.ratings} />
            <div className="rating-rows itrs-card__rows">
              {RATING_ORDER.map((f, i) => (
                <div key={f} className="itrs-card__row">
                  {i > 0 && <hr />}
                  <RatingRow factor={f} level={r.ratings[f]} onClick={() => setInfo(f)} />
                </div>
              ))}
            </div>
          </section>

          <section className="route-page__map">
            <RouteMap key={r.id} route={r} padding={{ top: 48, bottom: 64, left: 40, right: 40 }} attribution="bottom-left" />
            <button type="button" className="route-page__map-hit" aria-label="Explore the route on the map" onClick={onOpenMap} />
            <MapButton icon="expand" className="route-page__map-btn" onClick={onOpenMap} tabIndex={-1}>Explore Route</MapButton>
          </section>

          <hr className="route-page__divider" />

          <Surface route={r} />
        </div>
      </div>

      <div className="route-page__top">
        <RoundButton icon="arrowLeft" label="Back" onClick={onBack} />
        <RoundButton icon="dots" label="More options" />
      </div>

      <ActionBar saved={isSaved} onSave={toggleSave} />

      <InfoSheet
        open={Boolean(info)}
        onClose={() => setInfo(null)}
        factor={info}
        level={info ? r.ratings[info] : null}
        title={infoText?.title}
        text={infoText?.text}
      />

      <RouteMapPage route={r} open={open && mapOpen} onClose={onCloseMap} saved={isSaved} onSave={toggleSave} />
    </div>
  )
}

function Datum({ label, value }) {
  return (
    <div className="route-data__item">
      <dt className="t-md">{label}</dt>
      <dd className="t-lg-em">{value}</dd>
    </div>
  )
}

/* Tipo di fondo: barra a segmenti proporzionali e legenda (3 categorie, contesto §7.5) */
const SURFACES = [
  { key: 'single', name: 'Single trail' },
  { key: 'gravel', name: 'Gravel roads' },
  { key: 'road', name: 'Road and cycle paths' },
]
function Surface({ route }) {
  const parts = SURFACES
    .map((s) => ({ ...s, share: route.surface[s.key] }))
    .filter((s) => s.share >= 0.005)
  return (
    <section className="surface" aria-labelledby="surface-title">
      <h2 id="surface-title" className="t-2xl-em">Surface type</h2>
      <div className="surface__bar" aria-hidden="true">
        {parts.map((p) => <span key={p.key} className={`surface__seg surface__seg--${p.key}`} style={{ flexGrow: p.share }} />)}
      </div>
      <ul className="surface__legend">
        {parts.map((p) => (
          <li key={p.key}>
            <span className={`surface__swatch surface__seg--${p.key}`} aria-hidden="true" />
            <span className="t-md-em">{p.name}</span>
            <span className="t-md surface__value">{`${Math.round(p.share * 100)}% • ${fmtKm(route.km * p.share)}`}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- Mappa della route a tutto schermo con il pannello Route details ---------- */
function RouteMapPage({ route, open, onClose, saved, onSave }) {
  const [mounted, setMounted] = useState(open)
  const [styleKind, setStyleKind] = useState('topo')
  const [barH, setBarH] = useState(114)
  const [safeTop, setSafeTop] = useState(0)
  const [error, setError] = useState(null)
  const [scrub, setScrub] = useState(null)        // punto del grafico sotto il dito
  const pageRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (open) { setMounted(true); setError(null); setScrub(null); return }
    const t = setTimeout(() => setMounted(false), 400)
    return () => clearTimeout(t)
  }, [open])

  // Altezza della barra azioni (safe area compresa) e margine sicuro in alto
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
    }
    measure()
    const ro = bar && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(bar)
    return () => ro?.disconnect()
  }, [mounted])

  const onScrub = (s) => {
    setScrub(s)
    mapRef.current?.setCursor(s ? s.lngLat : null)
  }

  if (!mounted) return null
  const padding = { top: safeTop + 16 + 46 + 24, bottom: barH + PANEL_H + 32, left: 40, right: 72 }

  return (
    <div
      ref={pageRef}
      className={`route-map-page${open ? ' is-open' : ''}`}
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
        snaps={[PANEL_H]}
        bottom={barH}
        className="route-details"
        label="Route details"
        header={
          <div className="route-details__head">
            <h2 className="t-lg-em">Route details</h2>
            {scrub ? (
              <p className="t-sm route-details__summary route-details__scrub" aria-hidden="true">
                <span className="route-details__values">
                  {fmtKm(scrub.km)}<span> • </span>{fmtEle(scrub.ele)}<span> • </span>{fmtGrade(scrub.grade)}
                </span>
                <span className="route-details__track">
                  <span className="t-sm-em">TRACK {scrub.leg.n}</span>
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
      </BottomSheet>

      <ActionBar saved={saved} onSave={onSave} />
    </div>
  )
}
