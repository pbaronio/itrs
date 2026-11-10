import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import RouteMap from '../components/map/RouteMap.jsx'
import InfoSheet from '../components/InfoSheet.jsx'
import ItrsCircle from '../components/ItrsCircle.jsx'
import LevelShape from '../components/LevelShape.jsx'
import { TrackList } from '../components/TrackTimeline.jsx'
import { Datum, Surface } from '../components/DetailParts.jsx'
import { ActionBar, MapButton, RoundButton } from '../components/Button.jsx'
import { MiniMap, PhotoGallery, RatingRow } from '../components/Cards.jsx'
import { FACTORS } from '../data/itrs.js'
import { legsOf } from '../data/garda.js'
import { levelInfo } from '../data/levelInfo.js'
import { ratingReason } from '../data/ratingReasons.js'
import DetailMap from './DetailMap.jsx'
import Itinerary from './Itinerary.jsx'
import { TrackSheet } from './TrackDetail.jsx'
import Notebook from '../components/Notebook.jsx'
import { useEntered } from '../useEntered.js'
import './RoutePage.css'

/*
 * Pagina route (passo 2.1, contesto §4.5).
 * Pagina (Figma 3625:18792): foto, mini-mappa, titolo, dati, card ITRS con cerchio e righe
 * rating (→ bottom sheet informativo), lista track a timeline (passo 2.3), anteprima della mappa
 * con `Explore Route`, tipo di fondo, barra azioni fissa.
 * Sopra la pagina, come voci della cronologia (`layers`, gestite da Explore con `nav`):
 * - routeMap: mappa della route con il pannello Route details (Figma 3680:8568 / 3680:8742);
 * - itinerary: Itinerary List (Figma 3691:26252), dal pannello espanso;
 * - leg: track in bottom sheet (Figma 3677:5090), da una riga della timeline;
 * - legMap: mappa della track, da `Explore Track` nel bottom sheet.
 * ITRS Notebook (passo 2.4): storie dentro la card sotto l'anteprima della mappa.
 * Non ancora: Technical trail features, Wilderness Details, Recommended routes.
 */
const RATING_ORDER = ['difficulty', 'exposure', 'fitness', 'wilderness']   // ordine del Figma (contesto §7.4)

export default function RoutePage({ route, open, layers = [], nav }) {
  const [shown, setShown] = useState(route)       // resta montata durante l'uscita
  const [saved, setSaved] = useState(() => new Set())
  const [info, setInfo] = useState(null)           // fattore del bottom sheet informativo
  const scrollRef = useRef(null)
  const entered = useEntered(open && Boolean(route))

  useEffect(() => {
    if (route) { setShown(route); return }
    const t = setTimeout(() => setShown(null), 550)
    return () => clearTimeout(t)
  }, [route])

  // Nuova route: si riparte dall'alto, senza bottom sheet aperti
  useLayoutEffect(() => {
    if (route && scrollRef.current) scrollRef.current.scrollTop = 0
    setInfo(null)
  }, [route?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track aperta in bottom sheet: resta montata durante l'uscita
  const legLayer = layers.find((l) => l.t === 'leg')
  const [legN, setLegN] = useState(legLayer?.n ?? null)
  useEffect(() => {
    if (legLayer) { setLegN(legLayer.n); return }
    const t = setTimeout(() => setLegN(null), 550)
    return () => clearTimeout(t)
  }, [legLayer?.n]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null
  const r = shown
  const isSaved = saved.has(r.id)
  const toggleSave = () => setSaved((s) => {
    const next = new Set(s)
    if (next.has(r.id)) next.delete(r.id); else next.add(r.id)
    return next
  })
  const family = r.access?.includes('family')
  const legs = legsOf(r)
  const infoText = info ? levelInfo(info, r.ratings[info], r) : null
  const has = (t) => layers.some((l) => l.t === t)
  const openLeg = (leg) => nav.push({ t: 'leg', n: leg.n })

  return (
    <div className={`route-page${entered ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label={r.name} aria-hidden={!open}>
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
            <Datum label="Type" value={r.loop ? 'Loop' : 'Point to p.'} />
            <Datum label="Tracks" value={String(legs.length)} />
          </dl>

          <hr className="route-page__divider" />

          <section className="itrs-card" aria-label="ITRS rating">
            <ItrsCircle ratings={r.ratings} />
            <div className="rating-rows itrs-card__rows">
              {RATING_ORDER.map((f, i) => (
                <div key={f} className="itrs-card__row">
                  {i > 0 && <hr />}
                  <RatingRow factor={f} level={r.ratings[f]} description={ratingReason(r.id, f)} onClick={() => setInfo(f)} />
                </div>
              ))}
            </div>
          </section>

          {/* Lista track a timeline (passo 2.3): tap su una track → bottom sheet */}
          <section className="route-page__tracks" aria-labelledby="tracks-title">
            <h2 id="tracks-title" className="t-2xl-em">Tracks in this route</h2>
            <TrackList route={r} onOpen={openLeg} />
          </section>

          <section className="route-page__map">
            <RouteMap key={r.id} route={r} padding={{ top: 48, bottom: 64, left: 40, right: 40 }} attribution="bottom-left" />
            <button type="button" className="route-page__map-hit" aria-label="Explore the route on the map" onClick={() => nav.push({ t: 'routeMap' })} />
            <MapButton icon="expand" className="route-page__map-btn" onClick={() => nav.push({ t: 'routeMap' })} tabIndex={-1}>Explore Route</MapButton>
          </section>

          {/* ITRS Notebook (passo 2.4, Figma 3625:18950): 32 sotto l'anteprima della mappa */}
          <Notebook key={r.id} route={r} />

          <hr className="route-page__divider" />

          <Surface route={r} />
        </div>
      </div>

      <div className="route-page__top">
        <RoundButton icon="arrowLeft" label="Back" onClick={nav.back} />
        <RoundButton icon="dots" label="More options" />
      </div>

      <ActionBar item={r} saved={isSaved} onSave={toggleSave} />

      <InfoSheet
        open={Boolean(info)}
        onClose={() => setInfo(null)}
        factor={info}
        level={info ? r.ratings[info] : null}
        title={infoText?.title}
        text={infoText?.text}
      />

      <DetailMap
        key={r.id}
        route={r}
        open={open && has('routeMap')}
        onClose={nav.back}
        saved={isSaved}
        onSave={toggleSave}
        onItinerary={() => nav.push({ t: 'itinerary' })}
      />

      <Itinerary
        route={r}
        open={open && has('itinerary')}
        onClose={nav.back}
        onOpenLeg={openLeg}
        saved={isSaved}
        onSave={toggleSave}
      />

      {legN != null && (
        <TrackSheet
          route={r}
          n={legN}
          open={open && Boolean(legLayer)}
          mapOpen={open && has('legMap')}
          onClose={nav.back}
          onPick={(n) => nav.replace({ t: 'leg', n })}
          onOpenMap={() => nav.push({ t: 'legMap' })}
          onCloseMap={nav.back}
        />
      )}
    </div>
  )
}
