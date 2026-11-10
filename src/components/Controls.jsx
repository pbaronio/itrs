import { useId, useRef } from 'react'
import './Controls.css'

/*
 * Controlli (§6): Checkbox (componente Figma "Checkbox") e interruttore
 * (componente "Nav/Switch"). Nelle righe tutta la riga è cliccabile,
 * così l'area di tocco supera i 24 px del controllo.
 */

export function Checkbox({ checked }) {
  return (
    <span className={`checkbox${checked ? ' is-checked' : ''}`} aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect className="checkbox__box" x="2.91" y="2.91" width="18.18" height="18.18" rx="3.6" strokeWidth="1.02" />
        <path className="checkbox__tick" d="M17.4364 9.63646L10.8 16.2729L6.5636 12.0365L7.83639 10.7637L10.8 13.7273L16.1636 8.36367L17.4364 9.63646Z" />
      </svg>
    </span>
  )
}

// Riga con etichetta (e forma di livello opzionale) a sinistra, checkbox a destra
export function CheckRow({ label, leading, checked, onChange, indent }) {
  const id = useId()
  return (
    <label className={`check-row${indent ? ' check-row--indent' : ''}`} htmlFor={id}>
      <span className="check-row__label t-md">
        {leading}
        {label}
      </span>
      <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange?.(e.target.checked)} />
      <Checkbox checked={checked} />
    </label>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch${checked ? ' is-on' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange?.(!checked) }}
    >
      <span className="switch__knob" />
    </button>
  )
}

// Riga impostazione (pagina Controlli della navigazione)
export function SwitchRow({ title, detail, checked, onChange, last }) {
  return (
    <div className={`switch-row${last ? ' switch-row--last' : ''}`} onClick={() => onChange?.(!checked)}>
      <div className="switch-row__text">
        <p className="t-md-em">{title}</p>
        {detail && <p className="t-sm switch-row__detail">{detail}</p>}
      </div>
      <Switch checked={checked} label={title} onChange={onChange} />
    </div>
  )
}

/*
 * Slider a due cursori (§6 Controlli): traccia 6 stroke-soft-100, avanzamento brand-base,
 * cursori bianchi 16 con punto centrale blu. Si trascina il cursore più vicino al dito;
 * area di tocco 44 attorno ai cursori. Tastiera: frecce (passo), Pagina su/giù (4 passi).
 */
export function RangeSlider({ min = 0, max, step = 1, value, onChange, label, format }) {
  const trackRef = useRef(null)
  const drag = useRef(null)
  const [lo, hi] = value
  const pct = (v) => ((v - min) / (max - min)) * 100

  const valueAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - r.left - 8) / (r.width - 16)))
    return Math.round((min + t * (max - min)) / step) * step
  }
  const set = (which, v) => {
    if (which === 0) onChange([Math.min(v, hi - step), hi])
    else onChange([lo, Math.max(v, lo + step)])
  }
  const onDown = (e) => {
    const v = valueAt(e.clientX)
    // Cursore più vicino; a parità (sovrapposti) si sceglie dalla direzione del primo movimento
    const which = Math.abs(v - lo) < Math.abs(v - hi) ? 0 : Math.abs(v - lo) > Math.abs(v - hi) ? 1 : null
    drag.current = { which, x: e.clientX }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (which !== null) set(which, v)
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    if (d.which === null) {
      if (Math.abs(e.clientX - d.x) < 3) return
      d.which = e.clientX < d.x ? 0 : 1
    }
    set(d.which, valueAt(e.clientX))
  }
  const onUp = () => { drag.current = null }
  const onKey = (which) => (e) => {
    const big = step * 4
    const delta = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -big, PageUp: big }[e.key]
    let v
    if (delta) v = value[which] + delta
    else if (e.key === 'Home') v = min
    else if (e.key === 'End') v = max
    else return
    e.preventDefault()
    set(which, Math.min(max, Math.max(min, v)))
  }

  return (
    <div
      ref={trackRef}
      className="range"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <span className="range__track" />
      <span className="range__fill" style={{ left: `calc(8px + ${pct(lo)}% - ${pct(lo) * 0.16}px)`, right: `calc(8px + ${100 - pct(hi)}% - ${(100 - pct(hi)) * 0.16}px)` }} />
      {[lo, hi].map((v, i) => (
        <span
          key={i}
          role="slider"
          tabIndex={0}
          aria-label={`${label} ${i ? 'maximum' : 'minimum'}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={v}
          aria-valuetext={format ? format(value) : String(v)}
          className="range__thumb"
          style={{ left: `calc(${pct(v)}% - ${pct(v) * 0.16}px)` }}
          onKeyDown={onKey(i)}
        />
      ))}
    </div>
  )
}
