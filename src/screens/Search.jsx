import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import LevelShape from '../components/LevelShape.jsx'
import { FACTORS } from '../data/itrs.js'
import { unionBox } from '../data/garda.js'
import './Search.css'

/*
 * Ricerca (Figma 3625:18189, contesto §4.10): searchbar in stato Typing,
 * Current Location e `recommended for you:`.
 * Mentre si scrive, le stesse righe mostrano località e route/track che corrispondono
 * (i risultati di ricerca non sono disegnati: contesto §7 punto 7, proposta da confermare).
 * Si cerca tra gli elementi che passano i filtri attivi, nella vista corrente (Routes o Tracks).
 */
const CURRENT_PLACE = 'Riva del Garda, Trentino, Italy'   // posizione simulata (ITRS_dati_garda.md)
const RECOMMENDED = {
  routes: ['monte-brione', 'lago-di-tenno', 'malga-ciapa', 'tremalzo-xxl'],
  tracks: ['MB2', 'P1', 'NG3', 'CO3'],
}

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const Search = forwardRef(function Search({ open, mode, items, filtersOn, onPick, onPlace, onCurrent, onClose }, ref) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  // Il campo resta montato: si mette a fuoco nello stesso tocco che apre la ricerca,
  // altrimenti iOS non apre la tastiera
  useImperativeHandle(ref, () => ({
    focus() {
      setQuery('')
      inputRef.current?.focus({ preventScroll: true })
    },
  }), [])

  const recommended = useMemo(
    () => RECOMMENDED[mode].map((id) => items.find((it) => it.id === id)).filter(Boolean),
    [items, mode],
  )

  // Località dagli elementi visibili con i filtri, col riquadro per inquadrarle
  const places = useMemo(() => {
    const byTown = new Map()
    for (const it of items) {
      for (const town of it.towns) {
        const p = byTown.get(town) ?? { town, count: 0, boxes: [] }
        p.count += 1
        p.boxes.push(it.bbox)
        byTown.set(town, p)
      }
    }
    return [...byTown.values()].map((p) => ({ ...p, bbox: unionBox(p.boxes) }))
  }, [items])

  const q = norm(query.trim())
  const results = useMemo(() => {
    if (!q) return null
    const hit = (s) => norm(s).includes(q)
    return {
      places: places.filter((p) => hit(p.town)).sort((a, b) => b.count - a.count),
      items: items.filter((it) => hit(it.name) || it.towns.some(hit) || hit(it.place)),
    }
  }, [q, places, items])

  const close = () => {
    inputRef.current?.blur()
    onClose()
  }
  const unit = (n) => (mode === 'routes' ? (n === 1 ? 'route' : 'routes') : (n === 1 ? 'track' : 'tracks'))

  return (
    <div className={`search${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Search" aria-hidden={!open}>
      <div className="search__top">
        <form
          className="search__field"
          role="search"
          onSubmit={(e) => { e.preventDefault(); inputRef.current?.blur() }}
        >
          <Icon name="search" size={20} />
          <input
            ref={inputRef}
            className="t-md"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={mode === 'routes' ? 'Search Routes or locations' : 'Search Tracks or locations'}
            value={query}
            tabIndex={open ? undefined : -1}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') close() }}
          />
        </form>
        <button type="button" className="search__cancel t-md" tabIndex={open ? undefined : -1} onClick={close}>Cancel</button>
      </div>

      <div className="search__body" onTouchMove={() => inputRef.current?.blur()}>
        {!results ? (
          <>
            <Row icon="radar" title="Current Location" meta={CURRENT_PLACE} onClick={onCurrent} />
            {recommended.length > 0 && (
              <section className="search__group">
                <h2 className="t-sm-em search__heading">recommended for you:</h2>
                {recommended.map((it) => (
                  <ItemRow key={it.id} item={it} onClick={() => onPick(it)} />
                ))}
              </section>
            )}
          </>
        ) : results.places.length + results.items.length === 0 ? (
          <p className="t-md search__empty">
            {`No ${mode} or locations match “${query.trim()}”.`}
            {filtersOn && ' Try clearing your filters.'}
          </p>
        ) : (
          <section className="search__group">
            {results.places.map((p) => (
              <Row key={p.town} icon="search" title={p.town} meta={`${p.count} ${unit(p.count)}`} onClick={() => onPlace(p)} />
            ))}
            {results.items.map((it) => (
              <ItemRow key={it.id} item={it} onClick={() => onPick(it)} />
            ))}
          </section>
        )}
      </div>
    </div>
  )
})

export default Search

function Row({ icon, title, meta, onClick }) {
  return (
    <button type="button" className="search-row" onClick={onClick}>
      <span className="search-row__icon"><Icon name={icon} size={24} /></span>
      <span className="search-row__text">
        <span className="t-md-em search-row__title">{title}</span>
        <span className="t-sm search-row__meta">{meta}</span>
      </span>
    </button>
  )
}

function ItemRow({ item, onClick }) {
  return (
    <button type="button" className="search-row" onClick={onClick}>
      <span className="search-row__icon"><Icon name="rider" size={24} /></span>
      <span className="search-row__text">
        <span className="t-md-em search-row__title">{item.name}</span>
        <span className="t-sm search-row__meta">
          <span className="search-row__level">
            <LevelShape level={item.level} />
            {FACTORS.difficulty.names[item.level]}
          </span>
          <span aria-hidden="true">•</span>
          <span className="search-row__place">{item.place}</span>
        </span>
      </span>
    </button>
  )
}

