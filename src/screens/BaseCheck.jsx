import LevelShape from '../components/LevelShape.jsx'
import { FACTORS, LEVEL_KEYS, LEVELS } from '../data/itrs.js'
import './BaseCheck.css'

/*
 * Schermata di controllo del passo 0.1: token, font, livelli ITRS.
 * Serve solo a verificare la resa sul telefono; verrà sostituita dall'app.
 */

const TYPE_STYLES = [
  { cls: 't-2xl-em', name: '2xl/emphasized', sample: 'Malga Ciapa' },
  { cls: 't-lg-em', name: 'lg/emphasized', sample: '12.75 km' },
  { cls: 't-md-em', name: 'md/emphasized', sample: 'Start the route' },
  { cls: 't-md', name: 'md/default', sample: 'Search Routes or locations' },
  { cls: 't-sm-em', name: 'sm/emphasized', sample: '27 Routes' },
  { cls: 't-sm', name: 'sm/default', sample: 'Tremosine sul Garda' },
  { cls: 't-xs-em', name: 'xs/emphasized', sample: 'Explore' },
  { cls: 't-label', name: 'label', sample: 'Difficulty level' },
]

const SWATCHES = [
  { group: 'Brand', items: ['brand-lighter', 'brand-light', 'brand-base', 'brand-dark', 'brand-darker'] },
  { group: 'Background', items: ['bg-white-0', 'bg-weak-50', 'bg-soft-100', 'bg-sub-200', 'bg-surface-800', 'bg-strong-950'] },
  { group: 'Text', items: ['text-strong-950', 'text-sub-700', 'text-soft-500', 'text-disabled-400'] },
  { group: 'Surfaces', items: ['sabbia-light', 'sabbia-dark', 'sand-button', 'stroke-sand', 'forest', 'accent-stop'] },
]

const RADII = [
  ['r-thumb', 6], ['r-bar', 5], ['r-sm', 12], ['r-img', 14], ['r-card', 16], ['r-sheet', 24], ['r-pill', '∞'],
]

export default function BaseCheck() {
  return (
    <main className="bc">
      <header className="bc-head">
        <p className="t-label">Step 0.1 · Tokens & fonts</p>
        <h1 className="t-display bc-title">ITRS base check</h1>
        <p className="t-md bc-sub">
          Open this page on your phone and check that fonts, colours and levels match Figma.
        </p>
      </header>

      <Section title="Fonts">
        <div className="bc-fonts">
          <div className="bc-font">
            <p className="t-label">Inter · text</p>
            <p className="bc-font-sample">Aa</p>
            <p className="t-sm bc-muted">400 · 500 · 600 · <em>Semi Bold Italic</em></p>
          </div>
          <div className="bc-font bc-font--display">
            <p className="t-label">Mona Sans Black Italic</p>
            <p className="t-display bc-font-big">X2</p>
            <p className="t-display bc-font-small">29 Routes</p>
          </div>
        </div>
      </Section>

      <Section title="Type scale">
        <ul className="bc-type">
          {TYPE_STYLES.map((t) => (
            <li key={t.name}>
              <span className={t.cls}>{t.sample}</span>
              <span className="t-xs-em bc-muted">{t.name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="ITRS levels">
        <ul className="bc-levels">
          {LEVEL_KEYS.map((key) => (
            <li key={key} className="bc-level">
              <span className="bc-level-chip" style={{ background: LEVELS[key].color }} />
              <span className="bc-level-name">
                <LevelShape level={key} size={14} />
                <span className="t-md-em">{FACTORS.difficulty.names[key]}</span>
              </span>
              <span className="t-xs-em bc-muted">{LEVELS[key].hex}</span>
            </li>
          ))}
        </ul>
        <p className="t-label bc-mona-label">Card label</p>
        <p className="t-display bc-mona12">
          <LevelShape level="blue" size={10} /> Intermediate
        </p>
      </Section>

      <Section title="Colours">
        {SWATCHES.map((g) => (
          <div key={g.group} className="bc-swatch-group">
            <p className="t-label">{g.group}</p>
            <div className="bc-swatches">
              {g.items.map((v) => (
                <div key={v} className="bc-swatch">
                  <span className="bc-swatch-chip" style={{ background: `var(--${v})` }} />
                  <span className="bc-swatch-name">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Radii & buttons">
        <div className="bc-radii">
          {RADII.map(([name, px]) => (
            <div key={name} className="bc-radius">
              <span className="bc-radius-box" style={{ borderRadius: `var(--${name})` }} />
              <span className="bc-swatch-name">{px}</span>
            </div>
          ))}
        </div>
        <div className="bc-buttons">
          <button type="button" className="bc-btn bc-btn--action t-md-em">Start the route</button>
          <button type="button" className="bc-btn bc-btn--confirm t-md-em">See 24 Routes</button>
          <button type="button" className="bc-btn bc-btn--secondary t-md-em">Clear filters</button>
        </div>
        <p className="t-sm bc-muted bc-note">
          Real components (buttons, chips, cards, bottom sheet) arrive in step 0.3.
        </p>
      </Section>
    </main>
  )
}

function Section({ title, children }) {
  return (
    <section className="bc-section">
      <h2 className="t-2xl-em bc-section-title">{title}</h2>
      {children}
    </section>
  )
}
