import { useEffect, useState } from 'react'
import ElevationProfile, { fmtEle, fmtGrade } from '../components/ElevationProfile.jsx'
import TrackTimeline from '../components/TrackTimeline.jsx'
import LevelShape from '../components/LevelShape.jsx'
import Icon from '../components/Icon.jsx'
import { ActionBar } from '../components/Button.jsx'
import { FACTORS } from '../data/itrs.js'
import { fmtKm } from '../data/garda.js'
import { useEntered } from '../useEntered.js'

/*
 * Itinerary List (Figma 3691:26252): si apre dal pannello Route details espanso.
 * Chiudi in alto, grafico altimetrico trascinabile, lista track a timeline, barra azioni.
 * Tap su una track: track in bottom sheet (onOpenLeg).
 * Trascinando il grafico, i valori del punto compaiono accanto a Chiudi [P]: qui non c'è la mappa.
 */
export default function Itinerary({ route, open, onClose, onOpenLeg, saved, onSave }) {
  const [mounted, setMounted] = useState(open)
  const [scrub, setScrub] = useState(null)
  const entered = useEntered(open)

  useEffect(() => {
    if (open) { setMounted(true); setScrub(null); return }
    const t = setTimeout(() => setMounted(false), 400)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null
  return (
    <div className={`itinerary${entered ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label={`${route.name}, itinerary`}>
      <div className="itinerary__scroll">
        <div className="itinerary__top">
          <button type="button" className="btn-flow-close" aria-label="Close the itinerary" onClick={onClose}>
            <Icon name="closeX" size={24} />
          </button>
          {scrub && (
            <p className="t-sm itinerary__scrub" aria-hidden="true">
              <span className="route-details__values">
                {fmtKm(scrub.km)}<span> • </span>{fmtEle(scrub.ele)}<span> • </span>{fmtGrade(scrub.grade)}
              </span>
              <span className="route-details__track">
                <span className="t-sm-em">TRACK {scrub.leg.n}</span>
                <LevelShape level={scrub.leg.level} size={14} />
                {FACTORS.difficulty.names[scrub.leg.level]}
              </span>
            </p>
          )}
        </div>
        <div className="itinerary__chart">
          <ElevationProfile route={route} onScrub={setScrub} />
        </div>
        <TrackTimeline route={route} onOpen={onOpenLeg} />
      </div>
      <ActionBar saved={saved} onSave={onSave} />
    </div>
  )
}
