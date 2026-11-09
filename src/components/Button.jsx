import Icon from './Icon.jsx'
import './Button.css'

/*
 * Pulsanti (istruzioni §6 "Pulsanti").
 * Nero per agire, blu per confermare (testo sempre scuro sul blu).
 */

// Pulsante pieno h 60: action (nero), confirm (blu), secondary (grigio), disabled
export function Button({ variant = 'action', children, className = '', disabled, ...props }) {
  const v = disabled ? 'disabled' : variant
  return (
    <button
      type="button"
      className={`btn btn--${v} t-md-em ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Secondario icona: tondo 60, sabbia (Salva, Download)
export function IconButton({ icon, label, active, ...props }) {
  return (
    <button type="button" className={`btn-icon${active ? ' is-active' : ''}`} aria-label={label} aria-pressed={active} {...props}>
      <Icon name={active && icon === 'bookmark' ? 'bookmarkFilled' : icon} size={20} />
    </button>
  )
}

// Tondo bianco 46 su mappa e nell'header delle pagine di dettaglio
export function RoundButton({ icon, label, iconSize = 24, ...props }) {
  return (
    <button type="button" className="btn-round" aria-label={label} {...props}>
      <Icon name={icon} size={iconSize} />
    </button>
  )
}

// Su mappa: bianco h 36, raggio 26, icona 18 (Explore Route / Explore Track)
export function MapButton({ icon, children, ...props }) {
  return (
    <button type="button" className="btn-map t-sm-em" {...props}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

// Chiusura dei bottom sheet: 40×40, raggio 12, sabbia
export function CloseButton({ label = 'Close', className = '', ...props }) {
  return (
    <button type="button" className={`btn-close ${className}`} aria-label={label} {...props}>
      <Icon name="closeX" size={20} />
    </button>
  )
}

// FAB Map: cerchio blu 70, dal listing alla mappa
export function FabMap(props) {
  return (
    <button type="button" className="btn-fab" {...props}>
      <Icon name="compass" size={32} />
      <span className="t-xs-em">Map</span>
    </button>
  )
}

// Barra azioni fissa, uguale in route e track: Salva + Download + Start
export function ActionBar({ startLabel = 'Start the route', saved, onSave, onDownload, onStart, inline }) {
  return (
    <div className={`action-bar${inline ? ' action-bar--inline' : ''}`}>
      <div className="action-bar__secondary">
        <IconButton icon="bookmark" label={saved ? 'Saved' : 'Save'} active={saved} onClick={onSave} />
        <IconButton icon="download" label="Download" onClick={onDownload} />
      </div>
      <Button variant="action" className="action-bar__start" onClick={onStart}>{startLabel}</Button>
    </div>
  )
}

// Barra filtri: Clear filters + conferma blu, 176 ciascuno
export function FilterBar({ count, unit = 'Routes', onClear, onConfirm }) {
  return (
    <div className="filter-bar">
      <Button variant="secondary" onClick={onClear}>Clear filters</Button>
      <Button variant="confirm" onClick={onConfirm}>See {count} {unit}</Button>
    </div>
  )
}
