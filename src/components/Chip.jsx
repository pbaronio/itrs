import Icon from './Icon.jsx'
import './Chip.css'

/*
 * Chip (§6 Controlli): h 34, pillola, icona 20 opzionale + sm/emphasized.
 * Normale con bordo stroke-sub-200, attiva in blu brand con testo scuro.
 */
export default function Chip({ selected, icon, children, onClick, ...props }) {
  return (
    <button
      type="button"
      className={`chip t-sm-em${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
      {...props}
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  )
}
