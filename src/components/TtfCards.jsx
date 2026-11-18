import { TTF_TYPES } from '../data/filters.js'
import './TtfCards.css'

/*
 * Technical trail features (Figma Card/TTF 3875:423, richiesta di Paolo 18/11).
 * Una card per tipo, nell'ordine di TTF_TYPES: nome in alto, numero di passaggi in basso
 * (Mona Sans, «X2»), fondo e accento per tipo (--ttf-*-bg / --ttf-*-accent), curve di livello.
 * Due card per riga; se sono di più scorrono in orizzontale. Senza TTF la sezione non c'è.
 */
export default function TtfCards({ item }) {
  const count = item.ttfCount ?? {}
  const list = TTF_TYPES.filter((t) => count[t.key] > 0)
  if (!list.length) return null
  return (
    <section className="ttf" aria-labelledby={`ttf-${item.id}`}>
      <h2 id={`ttf-${item.id}`} className="t-2xl-em">Technical trail features</h2>
      <ul className={`ttf__row${list.length > 2 ? ' is-scrollable' : ''}`}>
        {list.map((t) => (
          <li key={t.key} className={`ttf-card ttf-card--${t.key}`} aria-label={`${t.label}: ${count[t.key]}`}>
            <span className="ttf-card__label t-lg-em" aria-hidden="true">{t.label}</span>
            <span className="ttf-card__count t-display" aria-hidden="true">X{count[t.key]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
