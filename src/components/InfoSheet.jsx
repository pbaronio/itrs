import { useLayoutEffect, useState } from 'react'
import BottomSheet from './BottomSheet.jsx'
import { CloseButton } from './Button.jsx'
import { Badge } from './Cards.jsx'
import { FACTORS } from '../data/itrs.js'

/*
 * Bottom sheet informativo (Figma 3625:20072): spiega un livello ITRS
 * senza lasciare la pagina. Si chiude con X, tap sul velo o trascinando in giù.
 * Altezza (comportamento da bottom sheet nativo): segue il contenuto, almeno 428 come nel Figma;
 * se il contenuto è più lungo il foglio arriva al massimo lasciando 24 px di velo sotto la barra
 * di stato (si capisce che è un foglio sopra la pagina) e il contenuto scorre. La maniglia resta.
 */
const MIN_H = 428
const HEAD_H = 24        // testata con la maniglia (BottomSheet)
const TOP_GAP = 24       // velo visibile sopra il foglio alla massima altezza

function safeTopPx() {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;padding-top:var(--safe-top)'
  document.body.appendChild(probe)
  const v = parseFloat(getComputedStyle(probe).paddingTop) || 0
  probe.remove()
  return v
}

export default function InfoSheet({ open, onClose, factor, level, title, text, children }) {
  const [body, setBody] = useState(null)      // corpo del foglio (montato dopo l'apertura)
  const [need, setNeed] = useState(MIN_H)
  const [maxH, setMaxH] = useState(() => window.innerHeight - TOP_GAP)

  // Altezza del contenuto e spazio disponibile, ricalcolati se cambiano (testi, rotazione)
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      setMaxH(window.innerHeight - safeTopPx() - TOP_GAP)
      if (body) setNeed(HEAD_H + body.offsetHeight)
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (body) ro?.observe(body)
    window.addEventListener('resize', measure)
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure) }
  }, [open, body])

  const height = Math.round(Math.min(Math.max(MIN_H, need), maxH))
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
        <div ref={setBody} className="info-sheet__body">
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
