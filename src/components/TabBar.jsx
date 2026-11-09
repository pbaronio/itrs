import Icon from './Icon.jsx'
import './TabBar.css'

/*
 * Tab bar (componente Figma "Navigation", 2182:13292): Explore, Record, Profile.
 * 80 di barra + margine sicuro in basso (indicatore Home).
 */
export const TABS = [
  { id: 'explore', label: 'Explore', icon: 'explore' },
  { id: 'record', label: 'Record', icon: 'record' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tab-bar" aria-label="Main">
      <ul className="tab-bar__list" role="tablist">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <li key={tab.id}>
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`tab-bar__item${isActive ? ' is-active' : ''}`}
                onClick={() => onChange?.(tab.id)}
              >
                <Icon name={tab.icon} size={28} />
                <span className="t-xs-em">{tab.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
