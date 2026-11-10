import { fmtKm } from '../data/garda.js'

/*
 * Parti comuni delle pagine di dettaglio di route e track (passi 2.1 e 2.3):
 * dati a colonne con divisori e tipo di fondo. Stili in screens/RoutePage.css.
 */
export function Datum({ label, value }) {
  return (
    <div className="route-data__item">
      <dt className="t-md">{label}</dt>
      <dd className="t-lg-em">{value}</dd>
    </div>
  )
}

/* Tipo di fondo: barra a segmenti proporzionali e legenda (3 categorie, contesto §7.5) */
const SURFACES = [
  { key: 'single', name: 'Single trail' },
  { key: 'gravel', name: 'Gravel roads' },
  { key: 'road', name: 'Road and cycle paths' },
]
export function Surface({ route }) {
  const parts = SURFACES
    .map((s) => ({ ...s, share: route.surface[s.key] }))
    .filter((s) => s.share >= 0.005)
  return (
    <section className="surface" aria-labelledby="surface-title">
      <h2 id="surface-title" className="t-2xl-em">Surface type</h2>
      <div className="surface__bar" aria-hidden="true">
        {parts.map((p) => <span key={p.key} className={`surface__seg surface__seg--${p.key}`} style={{ flexGrow: p.share }} />)}
      </div>
      <ul className="surface__legend">
        {parts.map((p) => (
          <li key={p.key}>
            <span className={`surface__swatch surface__seg--${p.key}`} aria-hidden="true" />
            <span className="t-md-em">{p.name}</span>
            <span className="t-md surface__value">{`${Math.round(p.share * 100)}% • ${fmtKm(route.km * p.share)}`}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
