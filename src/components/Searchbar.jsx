import Icon from './Icon.jsx'
import './Searchbar.css'

/*
 * Searchbar (componente Figma "Searchbar", istruzioni §6): 370×55, pillola.
 * Varianti Default (su mappa) e "su sfondo bianco" (onLight), con pulsante filtri tondo 42.
 * Il campo apre la ricerca, il pulsante tondo apre i filtri (passo 1.4).
 * Con filtri attivi il pulsante diventa blu brand con icona scura [P].
 */
export default function Searchbar({ placeholder, onSearch, onFilters, filtersActive = 0, onLight = false }) {
  return (
    <div className={`searchbar${onLight ? ' searchbar--on-light' : ''}`}>
      <button type="button" className="searchbar__field" onClick={onSearch}>
        <Icon name="search" size={20} />
        <span className="t-md">{placeholder}</span>
      </button>
      <button
        type="button"
        className={`searchbar__filters${filtersActive ? ' is-active' : ''}`}
        aria-label={filtersActive ? `Filters, ${filtersActive} active` : 'Filters'}
        onClick={onFilters}
      >
        <Icon name="filters" size={24} />
      </button>
    </div>
  )
}
