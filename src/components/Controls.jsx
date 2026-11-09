import { useId } from 'react'
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
