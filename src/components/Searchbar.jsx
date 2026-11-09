import Icon from './Icon.jsx'
import './Searchbar.css'

/*
 * Searchbar (componente Figma "Searchbar", istruzioni §6): 370×55, pillola.
 * Variante Default (su mappa) con pulsante filtri tondo 42.
 * Ricerca e filtri arrivano al passo 1.4: per ora sono pulsanti senza azione.
 */
export default function Searchbar({ placeholder, onSearch, onFilters }) {
  return (
    <div className="searchbar">
      <button type="button" className="searchbar__field" onClick={onSearch}>
        <Icon name="search" size={20} />
        <span className="t-md">{placeholder}</span>
      </button>
      <button type="button" className="searchbar__filters" aria-label="Filters" onClick={onFilters}>
        <Icon name="filters" size={24} />
      </button>
    </div>
  )
}
