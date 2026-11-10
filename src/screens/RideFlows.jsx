import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/Button.jsx'
import RouteMap from '../components/map/RouteMap.jsx'
import { Datum } from '../components/DetailParts.jsx'
import { TrackList } from '../components/TrackTimeline.jsx'
import { DEVICE_PHOTOS, fmtKm } from '../data/garda.js'
import './RideFlows.css'

/*
 * Fine giro e segnalazione (richiesta di Paolo, anticipa i passi 4.1 e 4.2).
 * Figma: Review / Ride complete 3719:2237, Feedback 3719:2352, Photos 3719:2471,
 * Photo access 3720:2416, Photos added 3720:2498, Thank you 3720:2599;
 * segnalazione (sezione "Alert on track flow" 3774:35598): Type 3722:2604, Notes 3722:2724,
 * Picture 3722:2911, Camera access 3722:3015, Review 3722:3129.
 * Foto e permessi sono simulati: l'avviso iOS è disegnato in pagina e le foto vengono dalla
 * "galleria" delle foto del Garda.
 */

// ---------- Parti comuni dei flussi (istruzioni §6 "Flussi a passi") ----------

function FlowHeader({ steps, step, onClose, closeLabel = 'Close' }) {
  return (
    <div className="flow__head">
      {steps ? (
        <div className="flow__steps" role="progressbar" aria-valuemin={1} aria-valuemax={steps} aria-valuenow={step} aria-label={`Step ${step} of ${steps}`}>
          {Array.from({ length: steps }, (_, i) => <span key={i} className={i < step ? 'is-done' : ''} />)}
        </div>
      ) : <span />}
      <button type="button" className="flow__close" aria-label={closeLabel} onClick={onClose}>
        <Icon name="closeX" size={20} />
      </button>
    </div>
  )
}

function FlowTitle({ title, subtitle }) {
  return (
    <div className="flow__title">
      <h2 className="t-display">{title}</h2>
      {subtitle && <p className="t-md">{subtitle}</p>}
    </div>
  )
}

function FlowBack({ onClick }) {
  return (
    <button type="button" className="flow__back" aria-label="Back" onClick={onClick}>
      <Icon name="arrowLeft" size={20} />
    </button>
  )
}

// Pagina di un flusso: entra dal basso, contenuto che scorre, barra in fondo
function FlowPage({ children, bar, label, className = '' }) {
  return (
    <section className={`flow ${className}`} role="dialog" aria-modal="true" aria-label={label}>
      <div className="flow__body">{children}</div>
      {bar && <div className="flow__bar">{bar}</div>}
    </section>
  )
}

// Avviso iOS di sistema (istruzioni §6 "Permessi di sistema"): 270, raggio 14, pulsanti blu
function IosAlert({ title, message, buttons }) {
  const first = useRef(null)
  useEffect(() => { first.current?.focus() }, [])
  return (
    <div className="ios-alert__dim">
      <div className="ios-alert" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="ios-alert__content">
          <p className="ios-alert__title">{title}</p>
          <p className="ios-alert__msg">{message}</p>
        </div>
        <div className={`ios-alert__buttons${buttons.length > 2 ? ' is-stacked' : ''}`}>
          {buttons.map((b, i) => (
            <button key={b.label} ref={i === 0 ? first : null} type="button" className={b.bold ? 'is-bold' : ''} onClick={b.onClick}>{b.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Badge pentagonale con la spunta (Thank you, conferma della segnalazione)
function DoneBadge() {
  return (
    <span className="flow-done__badge" aria-hidden="true">
      <svg className="flow-done__shape" viewBox="0 0 120 114" width="120" height="114">
        <path d="M60 8 112 46 92 106H28L8 46Z" />
      </svg>
      <Icon name="check" size={48} />
    </span>
  )
}

const pick = (n, from = 0) => Array.from({ length: n }, (_, i) => DEVICE_PHOTOS[(from + i * 4) % DEVICE_PHOTOS.length])

// ---------- Ride complete (Figma 3719:2237) ----------

function fmtRideTime(sec) {
  const m = Math.round(sec / 60)
  const h = Math.floor(m / 60)
  return h ? `${h}h ${m % 60}m` : `${m}m`
}

export function RideComplete({ ride, end, onRate, onClose }) {
  const done = ride.legs.filter((l) => end.finished || end.km >= l.endKm - 0.005)
  const hours = end.t / 3600
  const speed = hours > 0 ? Math.round(end.km / hours) : 0
  return (
    <FlowPage label="Ride complete" className="flow--complete" bar={<Button onClick={onRate}>Rate the ride</Button>}>
      <FlowHeader onClose={onClose} closeLabel="Close and go back to the map" />
      <div className="flow__title flow__title--tight">
        <h2 className="t-display">Ride complete</h2>
        <p className="t-md">{ride.item.name}</p>
      </div>
      <p className="ride-done__km">
        <span className="t-display">{end.km.toFixed(2)}</span>
        <span className="t-sm-em">Kilometres</span>
      </p>
      <dl className="route-data ride-done__data">
        <Datum label="Distance" value={fmtKm(end.km)} />
        <Datum label="Climb" value={`${Math.round(end.upDone)} m`} />
        <Datum label="Descent" value={`${Math.round(end.downDone)} m`} />
        <Datum label="Time" value={fmtRideTime(end.t)} />
        <Datum label="Speed" value={`${speed} km/h`} />
        <Datum label="Completed" value={`${done.length} ${done.length === 1 ? 'Track' : 'Tracks'}`} />
      </dl>
      <div className="ride-done__map">
        <RouteMap route={ride.item} padding={{ top: 32, bottom: 32, left: 32, right: 32 }} attribution="bottom-left" />
      </div>
      <div className="ride-done__tracks">
        <div className="ride-done__tracks-head">
          <h3 className="t-md-em">Tracks completed</h3>
          <span className="t-md">{done.length} of {ride.legs.length}</span>
        </div>
        {done.length ? (
          <TrackList route={ride.item} legs={done} label="Tracks completed" />
        ) : (
          <p className="t-md ride-done__none">You ended the ride before finishing the first track.</p>
        )}
      </div>
    </FlowPage>
  )
}

// ---------- Review: feedback, foto, grazie (Figma 3719:2352 → 3720:2599) ----------

const FACES = [
  { icon: 'face1', label: 'Not great' },
  { icon: 'face2', label: 'Not so good' },
  { icon: 'face3', label: 'Okay' },
  { icon: 'face4', label: 'Good' },
  { icon: 'face5', label: 'Loved it' },
]
const EXPECT = ['As expected', 'More physically demanding', 'Harder to ride', 'Greater fall consequences', 'Easier than expected', 'Further from help']
const MAX_PHOTOS = 10

export function Review({ onClose, onDone }) {
  const [step, setStep] = useState('feedback')   // feedback, photos, thanks
  const [face, setFace] = useState(null)
  const [chips, setChips] = useState([])
  const [photos, setPhotos] = useState([])
  const [alert, setAlert] = useState(false)
  const toggle = (c) => setChips((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))

  if (step === 'thanks') {
    return (
      <FlowPage label="Thank you" className="flow--done" bar={<Button onClick={onDone}>Go to the map</Button>}>
        <div className="flow-done">
          <DoneBadge />
          <h2 className="t-display">See you on the next ride!</h2>
          <p className="t-md">Thanks for sharing your feedback. It helps other riders pick the right route.</p>
          <div className="flow-done__summary">
            <span className="t-sm-em"><Icon name="check" size={16} />Rating sent</span>
            {photos.length > 0 && <span className="t-sm-em"><Icon name="check" size={16} />{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>}
          </div>
        </div>
      </FlowPage>
    )
  }

  if (step === 'photos') {
    const add = () => setPhotos((ps) => [...ps, ...pick(Math.min(5, MAX_PHOTOS - ps.length), ps.length * 3 + 1)])
    return (
      <FlowPage
        label="Your ride in pictures"
        bar={photos.length ? (
          <Button onClick={() => setStep('thanks')}>Next</Button>
        ) : (
          <div className="flow__bar-row">
            <Button variant="secondary" onClick={() => setStep('thanks')}>Skip</Button>
            <Button disabled>Next</Button>
          </div>
        )}
      >
        <FlowHeader steps={2} step={2} onClose={onClose} />
        <FlowTitle
          title="Your ride in pictures"
          subtitle={photos.length ? `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} added. The first one is the cover.` : 'Add a few photos to give other riders a feel for the route.'}
        />
        {photos.length ? (
          <ul className="flow-photos">
            {photos.map((p, i) => (
              <li key={`${p.photo}-${i}`}>
                <img src={p.photo} alt="" draggable="false" />
                {i === 0 && <span className="flow-photos__cover t-xs-em">Cover</span>}
                <button type="button" className="flow-photos__remove" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((ps) => ps.filter((_, k) => k !== i))}>
                  <Icon name="closeX" size={14} />
                </button>
              </li>
            ))}
            {photos.length < MAX_PHOTOS && (
              <li>
                <button type="button" className="flow-photos__add" onClick={add}>
                  <Icon name="plus" size={24} />
                  <span className="t-sm-em">Add</span>
                </button>
              </li>
            )}
          </ul>
        ) : (
          <button type="button" className="flow-drop" onClick={() => setAlert(true)}>
            <span className="flow-drop__icon"><Icon name="image" size={24} /></span>
            <span className="t-md-em">Add photos</span>
            <span className="t-sm">Choose up to {MAX_PHOTOS} from your gallery</span>
          </button>
        )}
        {alert && (
          <IosAlert
            title="“ITRS” Would Like to Access Your Photos"
            message="Choose photos of your ride to share them with other riders on this route."
            buttons={[
              { label: 'Limit Access…', onClick: () => { setAlert(false); add() } },
              { label: 'Allow Full Access', onClick: () => { setAlert(false); add() } },
              { label: 'Don’t Allow', bold: true, onClick: () => setAlert(false) },
            ]}
          />
        )}
      </FlowPage>
    )
  }

  return (
    <FlowPage label="How was the ride?" bar={<Button disabled={face == null} onClick={() => setStep('photos')}>Next</Button>}>
      <FlowHeader steps={2} step={1} onClose={onClose} />
      <FlowTitle title="How was the ride?" subtitle="Rate your overall experience" />
      <div className="flow-faces" role="radiogroup" aria-label="Overall experience">
        {FACES.map((f, i) => (
          <button key={f.icon} type="button" role="radio" aria-checked={face === i} aria-label={f.label} className={face === i ? 'is-on' : ''} onClick={() => setFace(i)}>
            <Icon name={f.icon} size={28} />
          </button>
        ))}
      </div>
      <div className="flow-faces__scale t-xs" aria-hidden="true"><span>Not great</span><span>Loved it</span></div>
      <hr className="flow__divider" />
      <h3 className="t-lg-em">Was the ride what you expected?</h3>
      <p className="t-sm flow__helper">Help us check the ITRS rating of this route. Select all that apply.</p>
      <div className="flow-chips">
        {EXPECT.map((c) => (
          <button key={c} type="button" aria-pressed={chips.includes(c)} className={`t-sm-em${chips.includes(c) ? ' is-on' : ''}`} onClick={() => toggle(c)}>{c}</button>
        ))}
      </div>
    </FlowPage>
  )
}

// ---------- Segnalazione (sezione Figma 3774:35598) ----------

const TYPES = [
  { key: 'maintenance', icon: 'wrench', title: 'Maintenance', detail: 'Fallen trees, erosion, damaged trail' },
  { key: 'signage', icon: 'signpost', title: 'Signage', detail: 'Missing, wrong or damaged signs' },
  { key: 'mitigation', icon: 'shield', title: 'Mitigation', detail: 'Missing or damaged safety measures' },
]
const MAX_NOTE = 280

export function Report({ ride, at, onClose }) {
  const [step, setStep] = useState(1)            // 1 tipo, 2 note, 3 foto, 4 riepilogo, 5 inviata
  const [type, setType] = useState(null)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(null)
  const [alert, setAlert] = useState(false)
  const [back, setBack] = useState(null)         // da "Edit" si torna al riepilogo
  const many = ride.legs.length > 1
  const trackLabel = `${many ? `Track ${at.leg.n} • ` : ''}${at.leg.track.name}`
  const kmLabel = `${at.km.toFixed(1)} km`
  const T = TYPES.find((t) => t.key === type)
  const next = (s) => { if (back) { setBack(null); setStep(back) } else setStep(s) }
  const edit = (s) => { setBack(4); setStep(s) }

  if (step === 5) {
    return (
      <FlowPage label="Report sent" className="flow--done" bar={<Button onClick={onClose}>Back to the ride</Button>}>
        <div className="flow-done">
          <DoneBadge />
          <h2 className="t-display">Report sent</h2>
          <p className="t-md">Thanks for warning other riders. Trail managers will check it soon.</p>
          <div className="flow-done__summary">
            <span className="t-sm-em"><Icon name={T.icon} size={16} />{T.title}</span>
            {photo && <span className="t-sm-em"><Icon name="check" size={16} />Photo</span>}
          </div>
        </div>
      </FlowPage>
    )
  }

  if (step === 4) {
    return (
      <FlowPage label="Check your report" bar={<div className="flow__bar-row"><FlowBack onClick={() => setStep(3)} /><Button onClick={() => setStep(5)}>Send report</Button></div>}>
        <FlowHeader steps={4} step={4} onClose={onClose} />
        <FlowTitle title="Check your report" />
        <dl className="flow-summary">
          <div>
            <dt className="t-label">Type</dt>
            <dd className="t-md-em flow-summary__type"><Icon name={T.icon} size={20} />{T.title}</dd>
            <button type="button" className="flow-summary__edit t-sm-em" onClick={() => edit(1)} aria-label="Edit type">Edit</button>
          </div>
          <div>
            <dt className="t-label">Location</dt>
            <dd className="t-md-em">{trackLabel}</dd>
            <dd className="t-sm flow-summary__detail">{kmLabel} from the start</dd>
          </div>
          <div>
            <dt className="t-label">Notes</dt>
            <dd className="t-md flow-summary__note">{note}</dd>
            <button type="button" className="flow-summary__edit t-sm-em" onClick={() => edit(2)} aria-label="Edit notes">Edit</button>
          </div>
          <div>
            <dt className="t-label">Picture</dt>
            <dd>{photo ? <img className="flow-summary__photo" src={photo.photo} style={{ objectPosition: photo.photoPosition }} alt="Attached photo" /> : <span className="t-md flow-summary__detail">No picture</span>}</dd>
            <button type="button" className="flow-summary__edit t-sm-em" onClick={() => edit(3)} aria-label="Edit picture">Edit</button>
          </div>
        </dl>
      </FlowPage>
    )
  }

  if (step === 3) {
    const attach = () => { setPhoto(pick(1, 7 + at.leg.n)[0]); next(4) }
    return (
      <FlowPage label="Can you share a picture?" bar={<div className="flow__bar-row"><FlowBack onClick={() => setStep(2)} /><Button variant="secondary" onClick={() => { setPhoto(null); next(4) }}>Skip</Button></div>}>
        <FlowHeader steps={4} step={3} onClose={onClose} />
        <FlowTitle title="Can you share a picture?" subtitle="A photo helps riders and trail managers understand the problem." />
        <div className="flow-options">
          <button type="button" className="flow-option" onClick={() => setAlert(true)}>
            <span className="flow-option__icon"><Icon name="camera" size={20} /></span>
            <span className="flow-option__text"><span className="t-md-em">Take a photo</span><span className="t-sm">Use the camera now</span></span>
          </button>
          <button type="button" className="flow-option" onClick={attach}>
            <span className="flow-option__icon"><Icon name="image" size={20} /></span>
            <span className="flow-option__text"><span className="t-md-em">Choose from library</span><span className="t-sm">Pick a photo you already took</span></span>
          </button>
        </div>
        {alert && (
          <IosAlert
            title="“ITRS” Would Like to Access the Camera"
            message="Take a photo of the problem to attach it to your report."
            buttons={[
              { label: 'Don’t Allow', onClick: () => setAlert(false) },
              { label: 'Allow', bold: true, onClick: () => { setAlert(false); attach() } },
            ]}
          />
        )}
      </FlowPage>
    )
  }

  if (step === 2) {
    return (
      <FlowPage label="What do you want to share?">
        <FlowHeader steps={4} step={2} onClose={onClose} />
        <FlowTitle title="What do you want to share?" subtitle="Describe the problem in a few words." />
        <label className="flow-text">
          <span className="sr-only">Notes</span>
          <textarea
            className="t-md"
            value={note}
            maxLength={MAX_NOTE}
            autoFocus
            rows={3}
            onChange={(e) => setNote(e.target.value)}
          />
          <span className="t-xs flow-text__count" aria-live="polite">{note.length}/{MAX_NOTE}</span>
        </label>
        <div className="flow__bar-row flow__bar-inline">
          <FlowBack onClick={() => setStep(1)} />
          <Button disabled={!note.trim()} onClick={() => next(3)}>Next</Button>
        </div>
      </FlowPage>
    )
  }

  return (
    <FlowPage label="What is the report about?" bar={<Button disabled={!type} onClick={() => next(2)}>Next</Button>}>
      <FlowHeader steps={4} step={1} onClose={onClose} />
      <FlowTitle title="What is the report about?" subtitle="Share what you see on the trail. Reports don’t change the ITRS rating but help riders and trail managers." />
      <div className="flow-options" role="radiogroup" aria-label="Report type">
        {TYPES.map((t) => (
          <button key={t.key} type="button" role="radio" aria-checked={type === t.key} className={`flow-option${type === t.key ? ' is-on' : ''}`} onClick={() => setType(t.key)}>
            <span className="flow-option__icon"><Icon name={t.icon} size={20} /></span>
            <span className="flow-option__text"><span className="t-md-em">{t.title}</span><span className="t-sm">{t.detail}</span></span>
            <span className="flow-option__radio" aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="flow-location t-sm"><Icon name="pin" size={18} />{trackLabel} • {kmLabel}</p>
    </FlowPage>
  )
}
