import Icon from './Icon.jsx'
import './Searchbar.css'

/*
 * Searchbar (componente Figma "Searchbar", istruzioni §6): 370×55, pillola.
 * Varianti Default (su mappa) e "su sfondo bianco" (onLight), con pulsante filtri tondo 42.
 * Ricerca e filtri arrivano al passo 1.4: per ora sono pulsanti senza azione.
 */
export default function Searchbar({ placeholder, onSearch, onFilters, onLight = false }) {
  return (
    <div className={`searchbar${onLight ? ' searchbar--on-light' : ''}`}>
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
