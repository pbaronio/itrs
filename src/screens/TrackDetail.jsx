import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import RouteMap from '../components/map/RouteMap.jsx'
import InfoSheet from '../components/InfoSheet.jsx'
import LevelShape from '../components/LevelShape.jsx'
import Icon from '../components/Icon.jsx'
import { Datum, Surface } from '../components/DetailParts.jsx'
import { ActionBar, MapButton, RoundButton } from '../components/Button.jsx'
import { ListingCard, MiniMap, PhotoGallery, RatingCard } from '../components/Cards.jsx'
import { FACTORS } from '../data/itrs.js'
import { legsOf, routesWithTrack, trackAsRoute } from '../data/garda.js'
import { levelInfo } from '../data/levelInfo.js'
import DetailMap from './DetailMap.jsx'
import { useEntered } from '../useEntered.js'
import './TrackDetail.css'

/*
 * Le due versioni della track (passo 2.3, contesto §4.7).
 * - TrackSheet: track dentro una route, pagina che sale dal basso sopra la route (Figma 3677:5090),
 *   col chevron giù per chiudere.
 *   Selettore `TRACK N°1 OF ROUTE` per passare alle altre track della route.
 * - TrackPage: track dalla mappa, pagina intera (Figma 3677:6229), con la sezione
 *   `Routes featuring this track`.
 * In entrambe: foto, titolo, dati, card Difficulty ed Exposure (→ bottom sheet informativo),
 * anteprima della mappa con `Explore Track` (→ mappa della track con grafico), tipo di fondo,
 * barra azioni `Start the track` + salva + download (istruzioni §8).
 * Dentro una route i dati seguono il verso di percorrenza (track al contrario: salita ↔ discesa).
 * Non ancora: Technical trail features, Wilderness Details, Recommended tracks.
 */
const FACTORS_TRACK = ['difficulty', 'exposure']

function TrackBody({ track, inRoute, onOpenMap, onInfo, onOpenRoute, selector }) {
  const featuring = inRoute ? [] : routesWithTrack(track.trackId)
  return (
    <>
      <div className="track-page__hero">
        <PhotoGallery key={track.id} photos={track.photos ?? [track]} label={track.name} className="route-page__gallery" />
      </div>

      <div className={`route-page__body${inRoute ? ' track-page__body--sheet' : ''}`}>
        {!inRoute && <MiniMap route={track} className="route-page__minimap" />}

        <section className="route-page__title">
          <h1 className="t-2xl-em">{track.name}</h1>
          <p className="route-page__meta">
            {!inRoute && <>
              <span className="t-md">Track</span>
              <span className="t-sm route-page__dot" aria-hidden="true">•</span>
            </>}
            <span className="t-md route-page__level"><LevelShape level={track.level} size={14} />{FACTORS.difficulty.names[track.level]}</span>
          </p>
        </section>

        <hr className="route-page__divider" />

        <dl className="route-data route-data--track">
          <Datum label="Distance" value={track.distance} />
          <Datum label="Climb" value={`${track.climb} m`} />
          <Datum label="Descent" value={`${track.descent} m`} />
          <Datum label="Duration" value={track.duration} />
        </dl>

        <hr className="route-page__divider" />

        {selector}

        <div className={`track-page__ratings${selector ? ' has-selector' : ''}`}>
          {FACTORS_TRACK.map((f) => (
            <RatingCard key={f} factor={f} level={track[f]} onClick={() => onInfo(f)} />
          ))}
        </div>

        <section className="route-page__map track-page__map">
          <RouteMap key={track.id} route={track} padding={{ top: 48, bottom: 64, left: 40, right: 40 }} attribution="bottom-left" />
          <button type="button" className="route-page__map-hit" aria-label="Explore the track on the map" onClick={onOpenMap} />
          <MapButton icon="expand" className="route-page__map-btn" onClick={onOpenMap} tabIndex={-1}>Explore Track</MapButton>
        </section>

        {featuring.length > 0 && (
          <section className="track-page__routes" aria-labelledby={`routes-${track.id}`}>
            <h2 id={`routes-${track.id}`} className="t-2xl-em">Routes featuring this track</h2>
            <FeaturingRoutes routes={featuring} onOpen={onOpenRoute} />
          </section>
        )}

        <hr className="route-page__divider" />

        <Surface route={track} />
      </div>
    </>
  )
}

/* Route che passano dalla track: card listing che scorrono in orizzontale */
function FeaturingRoutes({ routes, onOpen }) {
  const [saved, setSaved] = useState(() => new Set())
  const toggle = (id) => setSaved((s) => {
    const next = new Set(s)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  return (
    <div className={`track-page__routes-scroll${routes.length > 1 ? ' is-scrollable' : ''}`}>
      {routes.map((r) => (
        <div key={r.id} className="track-page__route">
          <ListingCard route={r} saved={saved.has(r.id)} onSave={() => toggle(r.id)} onClick={() => onOpen(r.id)} />
        </div>
      ))}
    </div>
  )
}

function useSaved() {
  const [saved, setSaved] = useState(() => new Set())
  const toggle = (id) => setSaved((s) => {
    const next = new Set(s)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  return [saved, toggle]
}

function useInfo(track) {
  const [info, setInfo] = useState(null)
  useEffect(() => { setInfo(null) }, [track?.id])
  const text = info && track ? levelInfo(info, track[info]) : null
  const sheet = (
    <InfoSheet
      open={Boolean(info)}
      onClose={() => setInfo(null)}
      factor={info}
      level={info && track ? track[info] : null}
      title={text?.title}
      text={text?.text}
    />
  )
  return [setInfo, sheet]
}

/* ---------- Track dalla mappa: pagina intera (Figma 3677:6229) ---------- */
export function TrackPage({ track: raw, open, layers = [], nav, onOpenRoute }) {
  const [shown, setShown] = useState(raw)
  const [saved, toggleSave] = useSaved()
  const scrollRef = useRef(null)
  const track = shown ? trackAsRoute(shown) : null
  const [setInfo, infoSheet] = useInfo(track)
  const entered = useEntered(open && Boolean(raw))

  useEffect(() => {
    if (raw) { setShown(raw); return }
    const t = setTimeout(() => setShown(null), 550)
    return () => clearTimeout(t)
  }, [raw])
  useLayoutEffect(() => {
    if (raw && scrollRef.current) scrollRef.current.scrollTop = 0
  }, [raw?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!track) return null
  const isSaved = saved.has(track.id)
  return (
    <div className={`route-page track-page${entered ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label={track.name} aria-hidden={!open}>
      <div ref={scrollRef} className="route-page__scroll">
        <TrackBody
          track={track}
          onOpenMap={() => nav.push({ t: 'trackMap' })}
          onInfo={setInfo}
          onOpenRoute={onOpenRoute}
        />
      </div>

      <div className="route-page__top">
        <RoundButton icon="arrowLeft" label="Back" onClick={nav.back} />
        <RoundButton icon="dots" label="More options" />
      </div>

      <ActionBar item={track} startLabel="Start the track" saved={isSaved} onSave={() => toggleSave(track.id)} />
      {infoSheet}

      <DetailMap
        key={track.id}
        route={track}
        open={open && layers.some((l) => l.t === 'trackMap')}
        onClose={nav.back}
        saved={isSaved}
        onSave={() => toggleSave(track.id)}
        startLabel="Start the track"
      />
    </div>
  )
}

/* ---------- Track dentro una route: pagina che sale dal basso sopra la route (Figma 3677:5090) ---------- */
export function TrackSheet({ route, n, open, mapOpen, onClose, onPick, onOpenMap, onCloseMap }) {
  const legs = legsOf(route)
  const leg = legs.find((l) => l.n === n) ?? legs[0]
  const track = trackAsRoute(leg.track, leg.reverse)
  const [saved, toggleSave] = useSaved()
  const [setInfo, infoSheet] = useInfo(track)
  const [choosing, setChoosing] = useState(false)
  const scrollRef = useRef(null)
  const entered = useEntered(open)

  // Nuova track dal selettore: selettore chiuso, si riparte dall'alto
  useLayoutEffect(() => {
    setChoosing(false)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [n])

  const isSaved = saved.has(track.id)

  const selector = (
    <div className={`track-selector${choosing ? ' is-open' : ''}`}>
      <button type="button" className="track-selector__head" aria-expanded={choosing} onClick={() => setChoosing((c) => !c)}>
        <img src={route.photo} style={{ objectPosition: route.photoPosition }} alt="" draggable="false" />
        <span className="track-selector__text">
          <span className="t-label track-selector__label">{`Track N°${leg.n} of route`}</span>
          <span className="t-md-em">{route.name}</span>
        </span>
        <Icon name="chevronDown" size={24} className="track-selector__chevron" />
      </button>
      {choosing && (
        <ul className="track-selector__list" aria-label={`Tracks of ${route.name}`}>
          {legs.map((l) => (
            <li key={l.n}>
              <button
                type="button"
                className={`track-selector__row${l.n === leg.n ? ' is-active' : ''}`}
                aria-current={l.n === leg.n || undefined}
                onClick={() => (l.n === leg.n ? setChoosing(false) : onPick(l.n))}
              >
                <img src={l.track.photo} style={{ objectPosition: l.track.photoPosition }} alt="" draggable="false" loading="lazy" />
                <span className="track-selector__text">
                  <span className="t-label track-selector__label">{`Track N°${l.n}`}</span>
                  <span className="t-md-em">{l.track.name}</span>
                </span>
                <LevelShape level={l.level} size={16} title={FACTORS.difficulty.names[l.level]} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div
      className={`route-page track-sheet${entered ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${leg.track.name}, track ${leg.n} of ${route.name}`}
      aria-hidden={!open}
    >
      <div ref={scrollRef} className="route-page__scroll">
        <TrackBody track={track} inRoute onOpenMap={onOpenMap} onInfo={setInfo} selector={selector} />
      </div>
      <div className="route-page__top">
        <RoundButton icon="chevronDown" label="Close the track" onClick={onClose} />
      </div>
      <ActionBar item={track} startLabel="Start the track" saved={isSaved} onSave={() => toggleSave(track.id)} />
      {infoSheet}
      <DetailMap
        key={track.id}
        route={track}
        open={mapOpen}
        onClose={onCloseMap}
        saved={isSaved}
        onSave={() => toggleSave(track.id)}
        startLabel="Start the track"
      />
    </div>
  )
}
