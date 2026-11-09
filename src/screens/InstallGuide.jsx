import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  getInstallState,
  platform,
  promptInstall,
  startPreview,
  subscribeInstall,
} from '../pwa.js'
import './InstallGuide.css'

/*
 * Guida all'installazione (passo 0.2).
 * Compare quando il prototipo è aperto nel browser invece che dall'icona sulla Home.
 * iPhone: Safari → ⋯ → Share → Add to Home Screen → Open as Web App → Add (iOS 26).
 * Android: pulsante "Install app" se Chrome lo permette, altrimenti menu ⋮.
 * Desktop: QR code per aprire il link sul telefono e anteprima nel browser.
 */

const STEPS = {
  ios: [
    {
      icon: 'more',
      title: 'Tap ⋯, then Share',
      text: '⋯ is next to the address bar. On older iOS versions, tap Share (the square with an arrow) in the toolbar.',
    },
    {
      icon: 'addSquare',
      title: 'Tap Add to Home Screen',
      text: 'Scroll down the list of actions. If it isn’t there, look under More.',
    },
    {
      icon: 'toggle',
      title: 'Keep Open as Web App on, then tap Add',
      text: 'This makes ITRS open full screen, without Safari’s bars.',
    },
    {
      icon: 'home',
      title: 'Open ITRS from your Home Screen',
      text: 'Close Safari and tap the ITRS icon. From now on, always open it from there.',
    },
  ],
  android: [
    {
      icon: 'kebab',
      title: 'Tap ⋮ in the top right',
      text: 'It’s Chrome’s menu, next to the address bar.',
    },
    {
      icon: 'addPhone',
      title: 'Tap Add to home screen',
      text: 'On some phones it’s called Install app.',
    },
    {
      icon: 'download',
      title: 'Tap Install',
      text: 'If Chrome asks, choose Install, not Create shortcut.',
    },
    {
      icon: 'home',
      title: 'Open ITRS from your Home Screen',
      text: 'Find the ITRS icon on your Home Screen or in your apps. From now on, always open it from there.',
    },
  ],
}

export default function InstallGuide({ onPreview }) {
  const [os, setOs] = useState(platform.android ? 'android' : 'ios')
  const { canPrompt, installed } = useSyncExternalStore(subscribeInstall, getInstallState)
  const [dismissed, setDismissed] = useState(false)

  const desktop = !platform.mobile
  const showInstallButton = os === 'android' && platform.android && canPrompt && !installed

  async function handleInstall() {
    const outcome = await promptInstall()
    if (outcome === 'dismissed') setDismissed(true)
  }

  function handlePreview() {
    startPreview()
    onPreview()
  }

  return (
    <main className={`ig${showInstallButton ? ' ig--with-bar' : ''}`}>
      <header className="ig-head">
        <img className="ig-icon" src="/icons/icon-guide.png" width="72" height="72" alt="ITRS app icon" />
        <h1 className="t-display ig-title">Install the app</h1>
        <p className="t-md ig-sub">
          {desktop
            ? 'This prototype runs on your phone. Open this page there and add it to your Home Screen.'
            : 'This prototype works like a real app. Add it to your Home Screen once, then always open it from the icon.'}
        </p>
      </header>

      <BrowserNotice />

      {desktop && <QrCard />}

      {installed && (
        <div className="ig-done" role="status">
          <Glyph name="check" />
          <p className="t-md-em">ITRS is installed. Open it from your Home Screen.</p>
        </div>
      )}

      {!installed && (
        <section className="ig-steps-wrap" aria-labelledby="ig-steps-title">
          {desktop && (
            <Segmented value={os} onChange={setOs} />
          )}

          <p id="ig-steps-title" className="t-label ig-steps-label">
            {showInstallButton ? 'Or from Chrome’s menu' : os === 'ios' ? 'In Safari' : 'In Chrome'}
          </p>

          <ol className="ig-steps">
            {STEPS[os].map((step, i) => (
              <li key={step.title} className="ig-step">
                <span className="ig-step-icon"><Glyph name={step.icon} /></span>
                <div className="ig-step-text">
                  <p className="t-label">Step {i + 1}</p>
                  <p className="t-md-em">{step.title}</p>
                  <p className="t-sm ig-step-desc">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          {dismissed && (
            <p className="t-sm ig-muted">Installation cancelled. You can try again with the button or from Chrome’s menu.</p>
          )}
        </section>
      )}

      {desktop && (
        <div className="ig-preview">
          <button type="button" className="ig-btn ig-btn--secondary t-md-em" onClick={handlePreview}>
            Preview in this browser
          </button>
          <p className="t-sm ig-muted">Only for reviewing the screens. Testers should use the installed app.</p>
        </div>
      )}

      {showInstallButton && (
        <div className="ig-bar">
          <button type="button" className="ig-btn ig-btn--action t-md-em" onClick={handleInstall}>
            <Glyph name="download" />
            Install app
          </button>
        </div>
      )}
    </main>
  )
}

/* Avviso per i browser che non installano (app di chat e social) o non sono quelli consigliati */
function BrowserNotice() {
  let text = null
  if (platform.inApp) {
    text = platform.ios
      ? 'This browser can’t install apps. Copy the link and open it in Safari.'
      : 'This browser can’t install apps. Copy the link and open it in Chrome.'
  } else if (platform.ios && platform.iosOtherBrowser) {
    text = 'For the best result, copy the link and open it in Safari.'
  } else if (platform.android && !platform.androidChrome) {
    text = 'For the best result, copy the link and open it in Chrome. Other browsers name the steps differently.'
  }
  if (!text) return null

  return (
    <div className="ig-notice" role="note">
      <Glyph name="info" />
      <div className="ig-notice-body">
        <p className="t-sm">{text}</p>
        <CopyLink />
      </div>
    </div>
  )
}

function CopyLink() {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(location.origin)
      setCopied(true)
    } catch {
      window.prompt('Copy this link', location.origin)
    }
  }
  return (
    <button type="button" className="ig-chip t-sm-em" onClick={copy}>
      <Glyph name={copied ? 'check' : 'link'} />
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  )
}

/* QR code del link, solo su desktop. La libreria si carica solo qui. */
function QrCard() {
  const [svg, setSvg] = useState(null)
  const url = location.origin

  useEffect(() => {
    let alive = true
    const dark = getComputedStyle(document.documentElement).getPropertyValue('--text-strong-950').trim()
    import('qrcode')
      .then(({ toString }) => toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark, light: '#0000' } }))
      .then((markup) => alive && setSvg(markup))
      .catch(() => alive && setSvg(''))
    return () => { alive = false }
  }, [url])

  return (
    <div className="ig-qr">
      <div className="ig-qr-code" aria-label={`QR code for ${url}`} role="img">
        {svg === null && <span className="ig-qr-loading" />}
        {svg && <span dangerouslySetInnerHTML={{ __html: svg }} />}
      </div>
      <div className="ig-qr-text">
        <p className="t-md-em">Scan with your phone camera</p>
        <p className="t-sm ig-step-desc">{url.replace(/^https?:\/\//, '')}</p>
      </div>
    </div>
  )
}

/* Toggle iPhone / Android, nello stile del toggle Routes/Tracks su fondo bianco */
function Segmented({ value, onChange }) {
  const options = [
    ['ios', 'iPhone'],
    ['android', 'Android'],
  ]
  return (
    <div className="ig-seg" role="tablist" aria-label="Phone type">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          className={`ig-seg-btn t-sm-em${value === key ? ' is-active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/* Icone a tratto 1.5 che richiamano i controlli di iOS e Android */
function Glyph({ name }) {
  const paths = {
    more: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="8" cy="12" r=".9" fill="currentColor" />
        <circle cx="12" cy="12" r=".9" fill="currentColor" />
        <circle cx="16" cy="12" r=".9" fill="currentColor" />
      </>
    ),
    addSquare: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M12 8.5v7M8.5 12h7" />
      </>
    ),
    toggle: (
      <>
        <rect x="2.5" y="7" width="19" height="10" rx="5" />
        <circle cx="16.5" cy="12" r="3" fill="currentColor" />
      </>
    ),
    home: (
      <>
        <rect x="4" y="4" width="6.5" height="6.5" rx="2" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" />
      </>
    ),
    kebab: (
      <>
        <circle cx="12" cy="6" r="1.1" fill="currentColor" />
        <circle cx="12" cy="12" r="1.1" fill="currentColor" />
        <circle cx="12" cy="18" r="1.1" fill="currentColor" />
      </>
    ),
    addPhone: (
      <>
        <rect x="6" y="2.5" width="12" height="19" rx="3" />
        <path d="M12 8.5v7M8.5 12h7" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
        <path d="M5 19.5h14" />
      </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5.5" />
        <circle cx="12" cy="7.75" r=".9" fill="currentColor" />
      </>
    ),
    link: (
      <>
        <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
        <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
      </>
    ),
  }
  return (
    <svg
      className="ig-glyph"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
