import { Fragment, useEffect, useMemo, useState } from 'react'
import BottomSheet from '../components/BottomSheet.jsx'
import InfoSheet from '../components/InfoSheet.jsx'
import Chip from '../components/Chip.jsx'
import LevelShape from '../components/LevelShape.jsx'
import { ActionBar, Button, CloseButton, FabMap, FilterBar, IconButton, MapButton, RoundButton } from '../components/Button.jsx'
import { CheckRow, SwitchRow } from '../components/Controls.jsx'
import { ListingCard, RatingCard, RatingRow, RouteCard } from '../components/Cards.jsx'
import { FACTORS, LEVEL_KEYS } from '../data/itrs.js'
import { LEVEL_INFO, ROUTES, SETTINGS } from '../data/demo.js'
import './Components.css'

/*
 * Galleria dei componenti base (passo 0.3).
 * Serve a provarli sul telefono prima di usarli nelle schermate vere.
 */
export default function Components({ onBaseCheck }) {
  const [info, setInfo] = useState(null)        // { factor, level }
  const [overlayOpen, setOverlayOpen] = useState(false)

  const openInfo = (factor, level) => setInfo({ factor, level })
  const infoText = info ? LEVEL_INFO[`${info.factor}-${info.level}`] : null

  return (
    <main className="cmp">
      <header className="cmp-head">
        <p className="t-label">Step 0.3 · Base components</p>
        <h1 className="t-display cmp-title">Components</h1>
        <p className="t-md cmp-sub">Everything here is interactive: tap, drag and toggle to check the feel.</p>
      </header>

      <ButtonsSection />
      <ChipsSection />
      <ControlsSection />
      <CardsSection onInfo={openInfo} />

      <Section title="Bottom sheets">
        <p className="t-sm cmp-note">Drag the handle or the content. The map overlay snaps to 3 states; the info sheet closes when dragged down.</p>
        <div className="cmp-stack">
          <Button variant="secondary" onClick={() => openInfo('difficulty', 'green')}>Info sheet · Beginner</Button>
          <Button variant="secondary" onClick={() => setOverlayOpen(true)}>Map overlay · 3 states</Button>
        </div>
      </Section>

      <Section title="Tab bar">
        <p className="t-sm cmp-note">Fixed at the bottom of the screen. Record and Profile are not designed yet.</p>
      </Section>

      <button type="button" className="cmp-link t-sm-em" onClick={onBaseCheck}>
        Base check (steps 0.1–0.2) →
      </button>

      <InfoSheet
        open={Boolean(info)}
        onClose={() => setInfo(null)}
        factor={info?.factor}
        level={info?.level}
        title={infoText?.title}
        text={infoText?.text}
      />
      {overlayOpen && <OverlayDemo onClose={() => setOverlayOpen(false)} />}
    </main>
  )
}

function ButtonsSection() {
  const [saved, setSaved] = useState(false)
  return (
    <Section title="Buttons">
      <p className="t-label cmp-label">Action · Confirm · Secondary · Disabled</p>
      <div className="cmp-stack">
        <Button variant="action">Start the route</Button>
        <Button variant="confirm">See 24 Routes</Button>
        <Button variant="secondary">Clear filters</Button>
        <Button disabled>Next</Button>
      </div>

      <p className="t-label cmp-label">Filter bar</p>
      <FilterBar count={24} />

      <p className="t-label cmp-label">Action bar · route and track</p>
      <ActionBar inline saved={saved} onSave={() => setSaved((s) => !s)} />

      <p className="t-label cmp-label">Icon · map · close · FAB</p>
      <div className="cmp-mapstrip">
        <div className="cmp-row">
          <RoundButton icon="arrowLeft" label="Back" />
          <RoundButton icon="dots" iconSize={20} label="More" />
          <MapButton>Explore Route</MapButton>
        </div>
        <div className="cmp-row">
          <IconButton icon="bookmark" label="Save" active={saved} onClick={() => setSaved((s) => !s)} />
          <IconButton icon="download" label="Download" />
          <CloseButton />
          <FabMap />
        </div>
      </div>
    </Section>
  )
}

function ChipsSection() {
  const [on, setOn] = useState({ loop: true })
  const chips = [
    ['loop', 'Loop'],
    ['wet', 'Wet weather friendly'],
    ['ttf', 'With TTF'],
  ]
  return (
    <Section title="Chips">
      <div className="cmp-chips">
        {chips.map(([id, label]) => (
          <Chip key={id} selected={!!on[id]} onClick={() => setOn((s) => ({ ...s, [id]: !s[id] }))}>{label}</Chip>
        ))}
      </div>
    </Section>
  )
}

function ControlsSection() {
  const [levels, setLevels] = useState({ green: true })
  const [settings, setSettings] = useState(() => Object.fromEntries(SETTINGS.map((s) => [s.id, s.on])))
  return (
    <Section title="Controls">
      <p className="t-label cmp-label">Checkbox · Difficulty filter</p>
      <div>
        {LEVEL_KEYS.map((key) => (
          <CheckRow
            key={key}
            leading={<LevelShape level={key} size={14} />}
            label={FACTORS.difficulty.names[key]}
            checked={!!levels[key]}
            onChange={(v) => setLevels((s) => ({ ...s, [key]: v }))}
          />
        ))}
      </div>

      <p className="t-label cmp-label">Switch · Ride controls</p>
      <div>
        {SETTINGS.map((s, i) => (
          <SwitchRow
            key={s.id}
            title={s.title}
            detail={s.detail}
            checked={settings[s.id]}
            last={i === SETTINGS.length - 1}
            onChange={(v) => setSettings((st) => ({ ...st, [s.id]: v }))}
          />
        ))}
      </div>
    </Section>
  )
}

function CardsSection({ onInfo }) {
  const [saved, setSaved] = useState(false)
  const route = ROUTES[0]
  const order = ['difficulty', 'exposure', 'fitness', 'wilderness']
  return (
    <Section title="Cards">
      <p className="t-label cmp-label">Overlay card · carousel</p>
      <div className="cmp-carousel">
        {[ROUTES[1], ROUTES[0], ROUTES[1]].map((r, i) => <RouteCard key={i} route={r} />)}
      </div>

      <p className="t-label cmp-label">Listing card</p>
      <ListingCard route={route} saved={saved} onSave={() => setSaved((s) => !s)} />

      <p className="t-label cmp-label">Rating rows · route (tap for info)</p>
      <div className="cmp-sand rating-rows">
        {order.map((f, i) => (
          <Fragment key={f}>
            {i > 0 && <hr />}
            <RatingRow factor={f} level={route.ratings[f]} onClick={() => onInfo(f, route.ratings[f])} />
          </Fragment>
        ))}
      </div>

      <p className="t-label cmp-label">Small cards · track</p>
      <div className="cmp-row cmp-row--fill">
        <RatingCard factor="difficulty" level="green" onClick={() => onInfo('difficulty', 'green')} />
        <RatingCard factor="exposure" level="green" onClick={() => onInfo('exposure', 'green')} />
      </div>
    </Section>
  )
}

/* Overlay della mappa a 3 stati, sopra la tab bar. La mappa vera arriva al passo 1.1. */
function OverlayDemo({ onClose }) {
  const [index, setIndex] = useState(0)
  const [vh, setVh] = useState(() => window.innerHeight)
  const [tabH, setTabH] = useState(80)
  const [safeTop, setSafeTop] = useState(0)

  useEffect(() => {
    const measure = () => {
      setVh(window.innerHeight)
      setTabH(document.querySelector('.tab-bar')?.offsetHeight ?? 80)
      const probe = document.createElement('div')
      probe.style.cssText = 'position:absolute;visibility:hidden;padding-top:var(--safe-top)'
      document.body.appendChild(probe)
      setSafeTop(parseFloat(getComputedStyle(probe).paddingTop) || 0)
      probe.remove()
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Stati: 86 e 226 sopra la tab bar (§6), poi listing a tutta pagina
  const snaps = useMemo(() => [86, 226, Math.max(320, vh - tabH - safeTop - 16)], [vh, tabH, safeTop])

  return (
    <div className="overlay-demo">
      <div className="overlay-demo__map">
        <RoundButton icon="close" label="Close demo" onClick={onClose} />
        <p className="t-sm overlay-demo__hint">Map arrives in step 1.1</p>
      </div>
      <BottomSheet
        snaps={snaps}
        snap={index}
        onSnapChange={setIndex}
        bottom={tabH}
        className="overlay-demo__sheet"
        label="Routes"
        header={<p className="t-display overlay-demo__title">29 Routes</p>}
        footer={index === 2 && (
          <div className="overlay-demo__fab"><FabMap onClick={() => setIndex(0)} /></div>
        )}
      >
        {index < 2 ? (
          <div className="cmp-carousel cmp-carousel--sheet">
            {[ROUTES[1], ROUTES[0], ROUTES[1]].map((r, i) => <RouteCard key={i} route={r} />)}
          </div>
        ) : (
          <div className="overlay-demo__list">
            {[ROUTES[0], ROUTES[1], ROUTES[0]].map((r, i) => <ListingCard key={i} route={r} />)}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="cmp-section">
      <h2 className="t-2xl-em cmp-section-title">{title}</h2>
      {children}
    </section>
  )
}
