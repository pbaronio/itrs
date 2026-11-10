import { useEffect, useState } from 'react'
import logo from '../assets/brand/itrs-logo.svg'
import './Splash.css'

/*
 * Splash screen (Figma 3746:31865): fondo scuro, logo e scritta al centro.
 * Compare solo all'avvio dell'app installata, resta 2 secondi e poi sfuma.
 * L'app è già montata sotto: la mappa carica mentre lo splash è visibile.
 */
const SHOW_MS = 2000

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('booted')   // fine del fondo scuro messo da index.html
    const t1 = setTimeout(() => setLeaving(true), SHOW_MS)
    const t2 = setTimeout(() => onDone?.(), SHOW_MS + 700) // dopo la dissolvenza (anche con Riduci movimento)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}`} role="img" aria-label="International Trail Rating System">
      <div className="splash__lockup" aria-hidden="true">
        <span className="splash__mark">
          <img src={logo} width="88" height="84" alt="" />
        </span>
        <span className="splash__name">
          International<br />Trail rating<br />System
        </span>
      </div>
    </div>
  )
}
