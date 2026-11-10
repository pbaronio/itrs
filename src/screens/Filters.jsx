import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckRow, RangeSlider } from '../components/Controls.jsx'
import Chip from '../components/Chip.jsx'
import LevelShape from '../components/LevelShape.jsx'
import { FilterBar } from '../components/Button.jsx'
import { FACTORS } from '../data/itrs.js'
import {
  ACCESS, DIRECTIONS, LOOPS, TTF_TYPES, LENGTH_MAX, LENGTH_STEP, TIME_MAX, TIME_STEP,
  appliesTo, emptyFilters, lengthLabel, levelsOf, matches, timeLabel,
} from '../data/filters.js'
import './Filters.css'

/*
 * Pagina Filtri (Figma 3625:18436, contesto §4.10, istruzioni §8).
 * Si lavora su una bozza: `See N Routes` la applica, Cancel la scarta, `Clear filters` la svuota.
 * Il numero sul pulsante blu conta tutte le route (o track) che passano i filtri, non solo l'area visibile.
 */
export default function Filters({ open, mode, value, items, onApply, onCancel }) {
  const [draft, setDraft] = useState(value)
  const bodyRef = useRef(null)

  // A ogni apertura si riparte dai filtri applicati, dall'inizio della pagina
  useEffect(() => {
    if (!open) return
    setDraft(value)
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const count = useMemo(() => items.filter((it) => matches(it, draft, mode)).length, [items, draft, mode])
  const unit = mode === 'routes' ? (count === 1 ? 'Route' : 'Routes') : (count === 1 ? 'Track' : 'Tracks')

  const set = (key, v) => setDraft((d) => ({ ...d, [key]: v }))
  const toggle = (key, k) => (on) => setDraft((d) => ({
    ...d,
    [key]: on ? [...d[key], k] : d[key].filter((x) => x !== k),
  }))
  const show = (key) => appliesTo(key, mode)

  // TTF: "All" seleziona tutti i tipi; scegliere un tipo attiva "With TTF"
  const allTypes = draft.ttfTypes.length === TTF_TYPES.length
  const toggleType = (k) => (on) => setDraft((d) => {
    const ttfTypes = on ? [...d.ttfTypes, k] : d.ttfTypes.filter((x) => x !== k)
    return { ...d, ttfTypes, ttfWith: on ? true : d.ttfWith }
  })

  return (
    <div className={`filters${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Filter" aria-hidden={!open} inert={!open}>
      <header className="filters__head">
        <button type="button" className="filters__cancel t-md" onClick={onCancel}>Cancel</button>
        <h1 className="filters__title t-display">Filter</h1>
      </header>

      <div ref={bodyRef} className="filters__body">
        <Section title="Difficulty">
          <Rows>
            {levelsOf('difficulty').map((k) => (
              <CheckRow
                key={k}
                label={FACTORS.difficulty.names[k]}
                leading={<LevelShape level={k} />}
                checked={draft.difficulty.includes(k)}
                onChange={toggle('difficulty', k)}
              />
            ))}
          </Rows>
        </Section>

        {show('fitness') && (
          <Section title="Fitness">
            <Rows>
              {levelsOf('fitness').map((k) => (
                <CheckRow key={k} label={FACTORS.fitness.names[k]} checked={draft.fitness.includes(k)} onChange={toggle('fitness', k)} />
              ))}
            </Rows>
          </Section>
        )}

        <Section title="Time" value={timeLabel(draft.time)}>
          <RangeSlider
            label="Time"
            max={TIME_MAX}
            step={TIME_STEP}
            value={draft.time}
            onChange={(v) => set('time', v)}
            format={timeLabel}
          />
        </Section>

        <Section title="Length" value={lengthLabel(draft.length)}>
          <RangeSlider
            label="Length"
            max={LENGTH_MAX}
            step={LENGTH_STEP}
            value={draft.length}
            onChange={(v) => set('length', v)}
            format={lengthLabel}
          />
        </Section>

        <Section title="Direction">
          <Rows>
            {DIRECTIONS.map(({ key, label }) => (
              <CheckRow key={key} label={label} checked={draft.direction.includes(key)} onChange={toggle('direction', key)} />
            ))}
          </Rows>
        </Section>

        <Section title="Exposure" detail="Consequences of a fall off the trail">
          <Rows>
            {levelsOf('exposure').map((k) => (
              <CheckRow key={k} label={FACTORS.exposure.names[k]} checked={draft.exposure.includes(k)} onChange={toggle('exposure', k)} />
            ))}
          </Rows>
        </Section>

        {show('loop') && (
          <Section title="Loop">
            <Rows>
              {LOOPS.map(({ key, label }) => (
                <CheckRow key={key} label={label} checked={draft.loop.includes(key)} onChange={toggle('loop', key)} />
              ))}
            </Rows>
          </Section>
        )}

        {show('wilderness') && (
          <Section title="Wilderness">
            <Rows>
              {levelsOf('wilderness').map((k) => (
                <CheckRow key={k} label={FACTORS.wilderness.names[k]} checked={draft.wilderness.includes(k)} onChange={toggle('wilderness', k)} />
              ))}
            </Rows>
          </Section>
        )}

        {show('access') && (
          <Section title="Accessibility">
            <div className="filters__chips">
              {ACCESS.map(({ key, label, icon }) => (
                <Chip
                  key={key}
                  icon={icon}
                  selected={draft.access.includes(key)}
                  onClick={() => toggle('access', key)(!draft.access.includes(key))}
                >
                  {label}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        <Section title="Technical trail features">
          <Rows>
            <CheckRow label="Without TTF" checked={draft.ttfWithout} onChange={(on) => set('ttfWithout', on)} />
            <CheckRow
              label="With TTF"
              checked={draft.ttfWith}
              onChange={(on) => setDraft((d) => ({ ...d, ttfWith: on, ttfTypes: on ? d.ttfTypes : [] }))}
            />
            <CheckRow
              indent
              label="All"
              checked={allTypes}
              onChange={(on) => setDraft((d) => ({ ...d, ttfTypes: on ? TTF_TYPES.map((t) => t.key) : [], ttfWith: on ? true : d.ttfWith }))}
            />
            {TTF_TYPES.map(({ key, label }) => (
              <CheckRow key={key} indent label={label} checked={draft.ttfTypes.includes(key)} onChange={toggleType(key)} />
            ))}
          </Rows>
        </Section>
      </div>

      <div className="filters__bar">
        <FilterBar
          count={count}
          unit={unit}
          disabled={count === 0}
          onClear={() => setDraft(emptyFilters())}
          onConfirm={() => onApply(draft)}
        />
      </div>
    </div>
  )
}

function Section({ title, detail, value, children }) {
  return (
    <section className="filters__section">
      <div className="filters__section-head">
        <div>
          <h2 className="t-md-em">{title}</h2>
          {detail && <p className="t-sm filters__detail">{detail}</p>}
        </div>
        {value && <p className="t-sm filters__value" aria-live="polite">{value}</p>}
      </div>
      {children}
    </section>
  )
}

function Rows({ children }) {
  return <div className="filters__rows">{children}</div>
}
