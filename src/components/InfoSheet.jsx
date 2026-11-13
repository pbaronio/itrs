import { useLayoutEffect, useRef, useState } from 'react'
import BottomSheet from './BottomSheet.jsx'
import { CloseButton } from './Button.jsx'
import { Badge } from './Cards.jsx'
import { FACTORS } from '../data/itrs.js'

/*
 * Bottom sheet informativo (Figma 3625:20072): spiega un livello ITRS
 * senza lasciare la pagina. 402×428, si chiude con X, tap sul velo o
 * trascinando in giù.
 */
// tall: foglio alto quasi quanto lo schermo, il contenuto scorre (es. dettaglio della difficoltà)
export default function InfoSheet({ open, onClose, factor, level, title, text, tall = false, children }) {
  const [viewH, setViewH] = useState(() => window.innerHeight)
  useLayoutEffect(() => {
    if (!tall) return
    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;visibility:hidden;padding-top:var(--safe-top)'
    document.body.appendChild(probe)
    const safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0
    probe.remove()
    setViewH(window.innerHeight - safeTop)
  }, [tall, open])

  // In chiusura il foglio resta alto finché non è uscito (niente salto di altezza)
  const tallRef = useRef(tall)
  if (open) tallRef.current = tall
  const height = tallRef.current ? Math.max(428, viewH - 12) : 428
  return (
    <BottomSheet
      open={open}
      snaps={[height]}
      dismissible
      scrim
      onClose={onClose}
      label={factor && level ? FACTORS[factor].names[level] : undefined}
      header={<CloseButton className="info-sheet__close" onClick={onClose} />}
    >
      {factor && level && (
        <div className="info-sheet__body">
          <Badge factor={factor} level={level} className="info-sheet__badge" />
          <p className="t-display info-sheet__name">{FACTORS[factor].names[level]}</p>
          {title && <p className="t-md-em info-sheet__title">{title}</p>}
          {text && <p className="t-md info-sheet__text">{text}</p>}
          {children}
        </div>
      )}
    </BottomSheet>
  )
}
