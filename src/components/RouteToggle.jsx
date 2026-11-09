import './RouteToggle.css'

/*
 * Toggle Routes/Tracks (istruzioni §6): 370×50, pillola, bianco su mappa.
 * Segmento attivo nero da 198 con testo bianco; mostra sempre numero + nome.
 */
export default function RouteToggle({ value, onChange, counts, onLight = false }) {
  const options = [
    { id: 'routes', label: counts.routes === 1 ? 'Route' : 'Routes', count: counts.routes },
    { id: 'tracks', label: counts.tracks === 1 ? 'Track' : 'Tracks', count: counts.tracks },
  ]
  return (
    <div className={`route-toggle${onLight ? ' route-toggle--on-light' : ''}`} data-active={value} role="tablist" aria-label="Show">
      <span className="route-toggle__thumb" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          className="route-toggle__option t-sm-em"
          onClick={() => onChange(o.id)}
        >
          {o.count} {o.label}
        </button>
      ))}
    </div>
  )
}
